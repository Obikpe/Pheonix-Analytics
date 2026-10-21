"""Learnora AI API.

The frontend is not required for these endpoints; the API is the stable
contract for Learnora's future AI experiences.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase
from .permissions import (
    PermissionContext,
    get_permission_context,
    require_permission,
)
from services.ai_profiles import generate

router = APIRouter(
    prefix="/api/ai",
    tags=["Learnora AI"],
)


class AskIn(BaseModel):
    feature: str = Field(default="tutor", min_length=1, max_length=30)
    message: str = Field(..., min_length=1, max_length=12000)
    conversation_id: str | None = None
    organisation_id: str | None = None


class ProviderUpdateIn(BaseModel):
    enabled: bool | None = None
    default_model: str | None = Field(default=None, max_length=150)
    priority: int | None = Field(default=None, ge=0, le=100000)


class LimitUpdateIn(BaseModel):
    requests_per_day: int | None = Field(default=None, ge=0)
    requests_per_month: int | None = Field(default=None, ge=0)
    max_input_chars: int | None = Field(default=None, ge=100, le=12000)
    max_output_tokens: int | None = Field(default=None, ge=100, le=8000)
    enabled: bool | None = None


ALLOWED = {
    "tutor",
    "coach",
    "practice",
    "project",
    "summarise",
    "instructor",
    "organisation",
}


AI_ENTITLEMENT_KEYS = {
    "tutor": ("ai_tutor", "ai.tutor", "ai_access"),
    "coach": ("ai_coach", "ai.coach", "ai_access"),
    "practice": ("ai_practice", "ai.practice", "ai_access"),
    "project": ("ai_project", "ai.project", "ai_access"),
    "summarise": ("ai_summarise", "ai.summarise", "ai_access"),
    "instructor": ("ai_instructor_assistant", "ai.instructor", "ai_access"),
    "organisation": ("ai_organisation_assistant", "ai.organisation", "ai_access"),
}


def _authorise_feature(
    feature: str,
    context: PermissionContext,
):
    if feature not in ALLOWED:
        raise HTTPException(400, "Unsupported AI feature.")

    if context.is_platform_admin:
        return

    role = (context.organisation_role or "").strip().lower()
    if role not in {"learner", "instructor", "admin", "owner"}:
        if not context.has_permission("ai.view"):
            raise HTTPException(403, "AI access is not available for this account.")

    if feature == "instructor" and role not in {"instructor", "admin", "owner"}:
        raise HTTPException(403, "The instructor AI assistant is restricted to instructors and organisation administrators.")

    if feature == "organisation":
        if role not in {"admin", "owner"} and not context.has_permission("analytics.organisation"):
            raise HTTPException(403, "You are not authorised to use the organisation AI assistant.")


def _assert_contract_ai_entitlement(organisation_id: str | None, feature: str):
    """Require an enabled feature entitlement for non-pilot organisations."""
    if not organisation_id:
        return

    try:
        organisation = (
            supabase.table("organisations")
            .select("settings,is_active")
            .eq("id", organisation_id)
            .limit(1)
            .execute()
        ).data or []
        if not organisation or not organisation[0].get("is_active", True):
            raise HTTPException(403, "This organisation is inactive or unavailable.")
        if (organisation[0].get("settings") or {}).get("pilot_mode") is True:
            return

        contracts = (
            supabase.table("learnora_contracts")
            .select("id,status,start_date,end_date")
            .eq("organisation_id", organisation_id)
            .in_("status", ["signed", "active", "expiring"])
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        ).data or []
        today = datetime.now(timezone.utc).date()
        active_contracts = [
            row for row in contracts
            if (not row.get("start_date") or str(row["start_date"]) <= today.isoformat())
            and (not row.get("end_date") or str(row["end_date"]) >= today.isoformat())
        ]
        if not active_contracts:
            raise HTTPException(403, "An active Learnora contract is required for organisation AI access.")

        keys = AI_ENTITLEMENT_KEYS.get(feature, ("ai_access",))
        for contract in active_contracts:
            entitlements = (
                supabase.table("learnora_contract_entitlements")
                .select("entitlement_key,enabled,metadata")
                .eq("contract_id", contract["id"])
                .eq("enabled", True)
                .execute()
            ).data or []
            for entitlement in entitlements:
                key = str(entitlement.get("entitlement_key") or "").strip().lower()
                metadata = entitlement.get("metadata") or {}
                declared_features = metadata.get("features", []) if isinstance(metadata, dict) else []
                if key in keys or feature in declared_features:
                    return
    except HTTPException:
        raise
    except Exception as exc:
        print(f"AI contract entitlement verification failed: {type(exc).__name__}")
        raise HTTPException(503, "AI access could not be verified. Please try again later.")

    raise HTTPException(403, f"Your organisation contract does not include the AI feature: {feature}.")


@router.post("/ask")
async def ask(
    body: AskIn,
    user: CurrentUser = Depends(get_current_user),
    context: PermissionContext = Depends(get_permission_context),
):
    _authorise_feature(body.feature, context)

    if (
        body.organisation_id
        and not context.is_platform_admin
        and str(body.organisation_id) != str(context.organisation_id)
    ):
        raise HTTPException(
            403,
            "Organisation context does not match your membership.",
        )

    org_id = (
        context.organisation_id
        or (body.organisation_id if context.is_platform_admin else None)
    )

    _assert_contract_ai_entitlement(org_id, body.feature)

    conversation_id = body.conversation_id

    if conversation_id:
        conversation = (
            supabase
            .table("learnora_ai_conversations")
            .select(
                "id,user_id,organisation_id,feature,status"
            )
            .eq("id", conversation_id)
            .limit(1)
            .execute()
        )

        if not conversation.data:
            raise HTTPException(404, "Conversation not found.")

        row = conversation.data[0]

        if str(row["user_id"]) != str(user.id):
            raise HTTPException(
                403,
                "Conversation access denied.",
            )

        if row["status"] != "active":
            raise HTTPException(
                409,
                "This conversation is archived.",
            )

        if row["feature"] != body.feature:
            raise HTTPException(
                409,
                "Conversation feature cannot be changed.",
            )

        stored_org = row.get("organisation_id")
        if str(stored_org or "") != str(org_id or ""):
            raise HTTPException(
                403,
                "Conversation organisation context does not match.",
            )

    else:
        conversation = (
            supabase
            .table("learnora_ai_conversations")
            .insert({
                "user_id": user.id,
                "organisation_id": org_id,
                "feature": body.feature,
                "title": body.message.strip()[:120],
                "status": "active",
            })
            .execute()
        )

        if not conversation.data:
            raise HTTPException(
                500,
                "Unable to create AI conversation.",
            )

        conversation_id = conversation.data[0]["id"]

    result = await generate(
        user.id,
        body.feature,
        body.message,
        org_id,
        conversation_id,
    )

    if result["status"] == "quota_unavailable":
        raise HTTPException(503, "AI quota enforcement is unavailable. Please try again later.")

    if result["status"] == "rate_limited":
        raise HTTPException(
            429,
            "AI request limit reached. Please try again later.",
        )

    if result["status"] == "disabled":
        raise HTTPException(
            503,
            "This AI feature is temporarily disabled.",
        )

    if result["status"] == "input_too_large":
        raise HTTPException(
            413,
            result["content"],
        )

    # Persist the conversation only after the generation attempt so the
    # service's history does not contain the current user message twice.
    user_message = (
        supabase
        .table("learnora_ai_messages")
        .insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": body.message,
        })
        .execute()
    )

    if not user_message.data:
        raise HTTPException(
            500,
            "Unable to save AI conversation message.",
        )

    assistant_message = (
        supabase
        .table("learnora_ai_messages")
        .insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": result["content"],
            "provider": result.get("provider"),
            "model": result.get("model"),
            "latency_ms": result.get("latency_ms"),
            "input_tokens": (result.get("usage") or {}).get("prompt_tokens"),
            "output_tokens": (result.get("usage") or {}).get("completion_tokens"),
        })
        .execute()
    )

    if not assistant_message.data:
        raise HTTPException(
            500,
            "Unable to save AI response.",
        )

    supabase.table("learnora_ai_conversations").update({
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", conversation_id).execute()

    return {
        "success": True,
        "conversation_id": conversation_id,
        **result,
    }


@router.get("/conversations")
def conversations(
    user: CurrentUser = Depends(get_current_user),
):
    result = (
        supabase
        .table("learnora_ai_conversations")
        .select(
            "id,organisation_id,feature,title,status,created_at,updated_at"
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("updated_at", desc=True)
        .execute()
    )
    return {
        "success": True,
        "conversations": result.data or [],
    }


@router.get("/conversations/{conversation_id}")
def conversation(
    conversation_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    result = (
        supabase
        .table("learnora_ai_conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Conversation not found.")

    messages = (
        supabase
        .table("learnora_ai_messages")
        .select(
            "id,role,content,provider,model,input_tokens,"
            "output_tokens,latency_ms,created_at"
        )
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )

    return {
        "success": True,
        "conversation": result.data[0],
        "messages": messages.data or [],
    }


@router.post("/conversations/{conversation_id}/archive")
def archive_conversation(
    conversation_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    result = (
        supabase
        .table("learnora_ai_conversations")
        .update({"status": "archived"})
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .execute()
    )
    if not result.data:
        raise HTTPException(
            404,
            "Active conversation not found.",
        )

    return {
        "success": True,
        "conversation": result.data[0],
    }


@router.get("/usage")
def usage(
    user: CurrentUser = Depends(get_current_user),
):
    result = (
        supabase
        .table("ai_usage_logs")
        .select(
            "feature,provider,model,request_status,input_tokens,"
            "output_tokens,latency_ms,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return {
        "success": True,
        "usage": result.data or [],
    }


@router.get(
    "/admin/providers",
)
def providers(
    context: PermissionContext = Depends(
        require_permission("ai.manage")
    ),
):
    result = (
        supabase
        .table("learnora_ai_providers")
        .select(
            "id,provider_key,display_name,base_url,default_model,"
            "enabled,priority,config,created_at,updated_at"
        )
        .order("priority")
        .execute()
    )
    return {
        "success": True,
        "providers": result.data or [],
    }


@router.patch(
    "/admin/providers/{provider_id}",
)
def update_provider(
    provider_id: str,
    body: ProviderUpdateIn,
    context: PermissionContext = Depends(
        require_permission("ai.manage")
    ),
):
    updates = body.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            400,
            "No provider changes supplied.",
        )

    result = (
        supabase
        .table("learnora_ai_providers")
        .update(updates)
        .eq("id", provider_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            404,
            "Provider not found.",
        )

    return {
        "success": True,
        "provider": result.data[0],
    }


@router.get("/admin/limits")
def list_limits(
    context: PermissionContext = Depends(
        require_permission("ai.manage")
    ),
):
    result = (
        supabase
        .table("learnora_ai_limits")
        .select("*")
        .order("scope_type")
        .order("feature")
        .execute()
    )
    return {
        "success": True,
        "limits": result.data or [],
    }


@router.patch("/admin/limits/{limit_id}")
def update_limit(
    limit_id: str,
    body: LimitUpdateIn,
    context: PermissionContext = Depends(
        require_permission("ai.manage")
    ),
):
    updates = body.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            400,
            "No limit changes supplied.",
        )

    result = (
        supabase
        .table("learnora_ai_limits")
        .update(updates)
        .eq("id", limit_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            404,
            "AI limit not found.",
        )

    return {
        "success": True,
        "limit": result.data[0],
    }
