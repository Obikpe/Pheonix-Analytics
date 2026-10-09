"""Learnora commercial, organisation requests, contracts and entitlements API."""

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .permissions import PermissionContext, require_permission
from .auth import CurrentUser, RegisterRequest, get_current_user, norm_email, register, supabase
from services.capacity import count_org

router = APIRouter(
    prefix="/api/commercial",
    tags=["Commercial"],
)


class OrganisationRequestIn(BaseModel):
    organisation_name: str = Field(..., min_length=2, max_length=200)
    contact_name: str = Field(..., min_length=2, max_length=150)
    email: str
    phone: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    organisation_type: Optional[str] = None
    request_type: str
    organisation_size: Optional[int] = Field(default=None, ge=1)
    expected_learners: Optional[int] = Field(default=None, ge=0)
    expected_instructors: Optional[int] = Field(default=None, ge=0)
    expected_teams: Optional[int] = Field(default=None, ge=0)
    expected_cohorts: Optional[int] = Field(default=None, ge=0)
    duration: Optional[str] = None
    requirements: list[str] = Field(default_factory=list)
    notes: Optional[str] = None
    portal_password: str = Field(..., min_length=10, max_length=72)


class PortalSignatureIn(BaseModel):
    signer_name: str = Field(..., min_length=2, max_length=150)
    signer_title: Optional[str] = Field(None, max_length=150)
    acknowledgement: bool = False


class RequestStatusIn(BaseModel):
    status: str


class ContractIn(BaseModel):
    organisation_id: str
    request_id: Optional[str] = None
    contract_number: str
    currency: str = "NGN"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    commercial_terms: Optional[str] = None
    document_url: Optional[str] = None


class EntitlementIn(BaseModel):
    entitlement_key: str
    limit_value: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = None
    enabled: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)


def _scope(
    context: PermissionContext,
    organisation_id: str,
):
    if context.is_platform_admin:
        return

    if (
        not context.organisation_id
        or str(context.organisation_id) != str(organisation_id)
    ):
        raise HTTPException(
            403,
            "Organisation access denied.",
        )


def _active_contract(organisation_id: str):
    result = (
        supabase
        .table("learnora_contracts")
        .select("*")
        .eq("organisation_id", organisation_id)
        .in_("status", ["active", "expiring"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _contract(contract_id: str):
    result = (
        supabase
        .table("learnora_contracts")
        .select("*")
        .eq("id", contract_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


@router.post("/organisation-requests", status_code=201)
def create_request(body: OrganisationRequestIn, request: Request):
    email = norm_email(body.email)

    # A new prospect identity must not overwrite or silently change an
    # existing learner, staff or administrator account.
    if supabase.table("users").select("id").eq("email", email).limit(1).execute().data:
        raise HTTPException(
            409,
            "This email already has a Learnora account. Linking existing accounts to a new prospect portal is not supported yet; use a separate email.",
        )
    if supabase.table("admins").select("id").eq("email", email).limit(1).execute().data:
        raise HTTPException(409, "This email is already associated with a Learnora administrator account.")

    payload = body.model_dump(exclude={"portal_password"})
    payload["email"] = email
    payload["status"] = "submitted"
    payload["portal_created_at"] = datetime.now(timezone.utc).isoformat()
    created = (
        supabase
        .table("learnora_organisation_requests")
        .insert(payload)
        .execute()
    )
    if not created.data:
        raise HTTPException(500, "Unable to create organisation request.")

    request_row = created.data[0]
    email_delivery_warning = None
    try:
        register(
            RegisterRequest(
                email=email,
                password=body.portal_password,
                name=body.contact_name,
            ),
            request,
        )
    except HTTPException as exc:
        # The auth registration function may create the pending identity and
        # then report a delivery failure. Preserve and link that pending
        # identity so the request is recoverable; never mark it verified.
        if exc.status_code != 503:
            supabase.table("learnora_organisation_requests").delete().eq("id", request_row["id"]).execute()
            raise
        email_delivery_warning = exc.detail

    user_result = (
        supabase
        .table("users")
        .select("id,email,name,role,sub_status")
        .eq("email", email)
        .limit(1)
        .execute()
    )
    if not user_result.data:
        supabase.table("learnora_organisation_requests").delete().eq("id", request_row["id"]).execute()
        raise HTTPException(500, "The request was saved, but the portal identity could not be created.")

    portal_user = user_result.data[0]
    if portal_user.get("sub_status") != "pending":
        # Do not re-purpose an already active account if a race occurred.
        supabase.table("learnora_organisation_requests").delete().eq("id", request_row["id"]).execute()
        raise HTTPException(409, "A verified account already exists for this email. Please use a separate prospect email.")

    role_update = (
        supabase.table("users")
        .update({"role": "organisation_prospect"})
        .eq("id", portal_user["id"])
        .select("id,role")
        .execute()
    )
    if not role_update.data or role_update.data[0].get("role") != "organisation_prospect":
        supabase.table("learnora_organisation_requests").delete().eq("id", request_row["id"]).execute()
        raise HTTPException(500, "The portal identity could not be configured.")

    linked = (
        supabase
        .table("learnora_organisation_requests")
        .update({"portal_user_id": portal_user["id"]})
        .eq("id", request_row["id"])
        .select("id,portal_user_id")
        .execute()
    )
    if not linked.data:
        raise HTTPException(500, "The portal account was created but could not be linked to the request. Contact Learnora support.")

    return {
        "success": True,
        "request": {
            "id": request_row["id"],
            "organisation_name": request_row["organisation_name"],
            "status": "submitted",
            "submitted_at": request_row.get("submitted_at") or request_row.get("created_at"),
        },
        "portal": {
            "email": email,
            "verification_required": True,
            "verification_email_sent": email_delivery_warning is None,
            "verification_message": email_delivery_warning,
        },
    }


@router.get("/portal/me")
def prospect_portal(
    user: CurrentUser = Depends(get_current_user),
):
    if user.role != "organisation_prospect":
        raise HTTPException(403, "Organisation prospect portal access is required.")

    request_result = (
        supabase
        .table("learnora_organisation_requests")
        .select(
            "id,organisation_id,organisation_name,contact_name,email,country,"
            "organisation_type,request_type,expected_learners,expected_instructors,"
            "expected_teams,expected_cohorts,duration,requirements,notes,status,"
            "submitted_at,reviewed_at,closed_at,created_at,updated_at"
        )
        .eq("portal_user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not request_result.data:
        raise HTTPException(404, "No organisation request is linked to this portal account.")

    request_row = request_result.data[0]
    contract_result = (
        supabase
        .table("learnora_contracts")
        .select(
            "id,request_id,organisation_id,contract_number,status,currency,"
            "start_date,end_date,commercial_terms,document_url,sent_at,signed_at,"
            "approved_at,signature_name,signature_title"
        )
        .eq("request_id", request_row["id"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    contract = contract_result.data[0] if contract_result.data else None
    version = None
    if contract and contract.get("status") in {"sent", "signed", "active", "expiring", "expired", "renewed", "terminated"}:
        version_result = (
            supabase
            .table("learnora_contract_versions")
            .select("version_number,draft_content,review_status,created_at")
            .eq("contract_id", contract["id"])
            .order("version_number", desc=True)
            .limit(1)
            .execute()
        )
        version = version_result.data[0] if version_result.data else None

    return {
        "success": True,
        "request": request_row,
        "contract": contract,
        "contract_version": version,
    }


@router.post("/portal/contracts/{contract_id}/sign")
def sign_portal_contract(
    contract_id: str,
    body: PortalSignatureIn,
    user: CurrentUser = Depends(get_current_user),
):
    if user.role != "organisation_prospect":
        raise HTTPException(403, "Organisation prospect portal access is required.")
    if not body.acknowledgement:
        raise HTTPException(400, "Please confirm that you have reviewed and agree to submit the displayed contract acknowledgement.")

    request_result = (
        supabase
        .table("learnora_organisation_requests")
        .select("id,organisation_id,status")
        .eq("portal_user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not request_result.data:
        raise HTTPException(404, "No organisation request is linked to this portal account.")
    request_row = request_result.data[0]

    contract_result = (
        supabase
        .table("learnora_contracts")
        .select("id,request_id,organisation_id,status,approved_at")
        .eq("id", contract_id)
        .eq("request_id", request_row["id"])
        .limit(1)
        .execute()
    )
    if not contract_result.data:
        raise HTTPException(404, "Contract not found for this organisation request.")
    contract = contract_result.data[0]
    if contract.get("status") != "sent":
        raise HTTPException(409, "Only a contract formally sent by Learnora can be signed.")
    if not contract.get("request_id"):
        raise HTTPException(409, "This contract is not linked to an onboarding request.")

    version_result = (
        supabase
        .table("learnora_contract_versions")
        .select("version_number,draft_content,review_status,qa_result")
        .eq("contract_id", contract_id)
        .order("version_number", desc=True)
        .limit(1)
        .execute()
    )
    if not version_result.data or not version_result.data[0].get("draft_content"):
        raise HTTPException(409, "The contract has no saved version to acknowledge.")
    version = version_result.data[0]
    if version.get("review_status") != "approved":
        raise HTTPException(409, "Learnora must complete its internal contract review before this contract can be signed.")

    now = datetime.now(timezone.utc).isoformat()
    updated = (
        supabase
        .table("learnora_contracts")
        .update({
            "status": "signed",
            "signed_at": now,
            "signed_by_user_id": user.id,
            "signature_name": body.signer_name.strip(),
            "signature_title": body.signer_title.strip() if body.signer_title else None,
            "signature_acknowledged_at": now,
        })
        .eq("id", contract_id)
        .eq("status", "sent")
        .execute()
    )
    if not updated.data:
        raise HTTPException(409, "Contract state changed; signature was not recorded.")

    supabase.table("learnora_organisation_requests").update({
        "status": "pending_approval",
    }).eq("id", request_row["id"]).execute()

    try:
        supabase.table("learnora_audit_events").insert({
            "actor_user_id": user.id,
            "action": "prospect_contract_signed",
            "resource_type": "contract",
            "resource_id": contract_id,
            "organisation_id": contract.get("organisation_id"),
            "success": True,
            "metadata": {"request_id": request_row["id"], "signature_name": body.signer_name.strip()},
        }).execute()
    except Exception:
        pass

    return {"success": True, "contract": updated.data[0], "request_status": "pending_approval"}


@router.get("/organisation-requests")
def list_requests(
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    query = (
        supabase
        .table("learnora_organisation_requests")
        .select("*")
        .order("created_at", desc=True)
    )

    if not context.is_platform_admin:
        if not context.organisation_id:
            raise HTTPException(
                403,
                "No organisation context is available.",
            )
        query = query.eq(
            "organisation_id",
            context.organisation_id,
        )

    result = query.execute()
    return {
        "success": True,
        "requests": result.data or [],
    }


@router.patch("/organisation-requests/{request_id}")
def update_request(
    request_id: str,
    body: RequestStatusIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    # Prospect onboarding is a Learnora-controlled workflow. Customer
    # organisation administrators must not advance their own request into
    # signed, approved, or active states.
    if not context.is_platform_admin:
        raise HTTPException(
            403,
            "Only Learnora platform administrators can update onboarding requests.",
        )

    # Signature, approval and activation transitions are controlled by
    # dedicated contract lifecycle endpoints, not generic status edits.
    allowed = {
        "submitted",
        "under_review",
        "discussion",
        "contract_preparation",
        "declined",
        "closed",
    }

    if body.status not in allowed:
        raise HTTPException(
            400,
            "Invalid request status.",
        )

    request_row = (
        supabase
        .table("learnora_organisation_requests")
        .select("id,organisation_id")
        .eq("id", request_id)
        .limit(1)
        .execute()
    )
    if not request_row.data:
        raise HTTPException(
            404,
            "Organisation request not found.",
        )

    oid = request_row.data[0].get("organisation_id")
    if oid:
        _scope(context, str(oid))
    elif not context.is_platform_admin:
        raise HTTPException(
            403,
            "Only platform administrators can manage unlinked requests.",
        )

    if body.status == "active":
        if not oid:
            raise HTTPException(
                409,
                "An organisation must be linked before activation.",
            )
        if not _active_contract(str(oid)):
            raise HTTPException(
                409,
                "An active or signed contract is required before activation.",
            )

    result = (
        supabase
        .table("learnora_organisation_requests")
        .update({"status": body.status})
        .eq("id", request_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            404,
            "Organisation request not found.",
        )

    return {
        "success": True,
        "request": result.data[0],
    }


@router.post("/contracts", status_code=201)
def create_contract(
    body: ContractIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    if not context.is_platform_admin:
        raise HTTPException(
            403,
            "Only Learnora platform administrators can create organisation contracts.",
        )

    organisation = (
        supabase
        .table("organisations")
        .select("id")
        .eq("id", body.organisation_id)
        .limit(1)
        .execute()
    )
    if not organisation.data:
        raise HTTPException(404, "Organisation not found.")

    if body.request_id:
        request_row = (
            supabase.table("learnora_organisation_requests")
            .select("id,organisation_id")
            .eq("id", body.request_id)
            .limit(1)
            .execute()
        )
        if not request_row.data or str(request_row.data[0].get("organisation_id")) != str(body.organisation_id):
            raise HTTPException(409, "Contract request and organisation do not match.")

    result = (
        supabase
        .table("learnora_contracts")
        .insert({
            **body.model_dump(),
            "created_by": context.user_id,
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to create contract.",
        )

    return {
        "success": True,
        "contract": result.data[0],
    }


@router.get("/organisations/{organisation_id}/contract")
def current_contract(
    organisation_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    _scope(context, organisation_id)
    contract = _active_contract(organisation_id)
    return {
        "success": True,
        "contract": contract,
    }


@router.post(
    "/contracts/{contract_id}/entitlements",
    status_code=201,
)
def add_entitlement(
    contract_id: str,
    body: EntitlementIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    contract = _contract(contract_id)
    if not contract:
        raise HTTPException(
            404,
            "Contract not found.",
        )

    _scope(context, str(contract["organisation_id"]))

    result = (
        supabase
        .table("learnora_contract_entitlements")
        .upsert(
            {
                "contract_id": contract_id,
                **body.model_dump(),
            },
            on_conflict="contract_id,entitlement_key",
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to save entitlement.",
        )

    return {
        "success": True,
        "entitlement": result.data[0],
    }


@router.get("/organisations/{organisation_id}/capacity")
def capacity(
    organisation_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    _scope(context, organisation_id)

    contract = _active_contract(organisation_id)
    if not contract:
        return {
            "success": True,
            "contract": None,
            "capacity": [],
        }

    entitlements = (
        supabase
        .table("learnora_contract_entitlements")
        .select("*")
        .eq("contract_id", contract["id"])
        .execute()
    )

    usage = []
    for entitlement in entitlements.data or []:
        key = entitlement["entitlement_key"]
        limit = entitlement.get("limit_value")
        used = count_org(
            organisation_id,
            key,
        )

        usage.append({
            "entitlement": entitlement,
            "used": used,
            "remaining": (
                None
                if limit is None
                else max(0, limit - used)
            ),
        })

    return {
        "success": True,
        "contract": contract,
        "capacity": usage,
    }
