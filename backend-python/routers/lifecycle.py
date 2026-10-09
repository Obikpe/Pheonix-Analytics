"""Organisation and cohort lifecycle/renewal API."""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import supabase
from .permissions import PermissionContext, require_permission
from services.audit import audit

router = APIRouter(
    prefix="/api/lifecycle",
    tags=["Lifecycle"],
)

ORG_STATES = {
    "requested",
    "under_review",
    "contract_pending",
    "pending_activation",
    "active",
    "expiring",
    "expired",
    "inactive",
    "suspended",
    "archived",
}

COHORT_STATES = {
    "draft",
    "upcoming",
    "active",
    "ending",
    "completed",
    "expired",
    "closed",
}


class StatusIn(BaseModel):
    status: str
    reason: str | None = Field(default=None, max_length=2000)


class RenewalIn(BaseModel):
    contract_number: str = Field(..., min_length=2, max_length=100)
    start_date: date | None = None
    end_date: date | None = None
    currency: str = Field(default="NGN", min_length=3, max_length=10)
    commercial_terms: str | None = None
    document_url: str | None = None


def _org_access(
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


@router.post("/organisations/{organisation_id}/status")
def org_status(
    organisation_id: str,
    body: StatusIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    _org_access(context, organisation_id)

    if body.status not in ORG_STATES:
        raise HTTPException(
            400,
            "Invalid organisation lifecycle status.",
        )

    old = (
        supabase
        .table("learnora_organisation_lifecycle")
        .select("*")
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    )
    old_status = old.data[0]["status"] if old.data else None

    payload = {
        "organisation_id": organisation_id,
        "status": body.status,
        "status_reason": body.reason,
        "changed_by": context.user_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if old.data:
        result = (
            supabase
            .table("learnora_organisation_lifecycle")
            .update(payload)
            .eq("organisation_id", organisation_id)
            .execute()
        )
    else:
        result = (
            supabase
            .table("learnora_organisation_lifecycle")
            .insert(payload)
            .execute()
        )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to update organisation lifecycle.",
        )

    supabase.table(
        "learnora_organisation_lifecycle_events"
    ).insert({
        "organisation_id": organisation_id,
        "from_status": old_status,
        "to_status": body.status,
        "reason": body.reason,
        "actor_user_id": context.user_id,
    }).execute()

    audit(
        actor_user_id=context.user_id,
        action="organisation_lifecycle_changed",
        resource_type="organisation",
        resource_id=organisation_id,
        organisation_id=organisation_id,
        metadata={
            "from": old_status,
            "to": body.status,
            "reason": body.reason,
        },
    )

    return {
        "success": True,
        "lifecycle": result.data[0],
    }


@router.post("/contracts/{contract_id}/approve")
def approve_signed_contract(
    contract_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    """Record Learnora's explicit approval of an organisation-signed contract.

    Signing and approval are separate states: only a platform administrator
    may approve, and only a signed contract may be approved.
    """
    if not context.is_platform_admin:
        raise HTTPException(
            403,
            "Only Learnora platform administrators can approve signed contracts.",
        )

    result = (
        supabase
        .table("learnora_contracts")
        .select("*")
        .eq("id", contract_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Contract not found.")

    contract = result.data[0]
    if contract.get("status") != "signed":
        raise HTTPException(
            409,
            "Only signed contracts can be approved.",
        )
    if contract.get("approved_at"):
        raise HTTPException(
            409,
            "This contract has already been approved.",
        )

    now = datetime.now(timezone.utc).isoformat()
    updated = (
        supabase
        .table("learnora_contracts")
        .update({"approved_at": now})
        .eq("id", contract_id)
        .eq("status", "signed")
        .is_("approved_at", "null")
        .execute()
    )
    if not updated.data:
        raise HTTPException(
            409,
            "Contract state changed; approval was not applied.",
        )

    audit(
        actor_user_id=context.user_id,
        action="contract_approved",
        resource_type="contract",
        resource_id=contract_id,
        organisation_id=contract["organisation_id"],
    )
    return {"success": True, "contract": updated.data[0]}


@router.post("/contracts/{contract_id}/activate")
def activate_contract(
    contract_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    result = (
        supabase
        .table("learnora_contracts")
        .select("*")
        .eq("id", contract_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            404,
            "Contract not found.",
        )

    contract = result.data[0]
    if not context.is_platform_admin:
        raise HTTPException(
            403,
            "Only Learnora platform administrators can activate an organisation contract.",
        )

    if contract["status"] != "signed":
        raise HTTPException(
            409,
            "Only signed contracts can be activated.",
        )
    if not contract.get("approved_at"):
        raise HTTPException(
            409,
            "Learnora must explicitly approve the signed contract before activation.",
        )

    now = datetime.now(timezone.utc).isoformat()

    updated = (
        supabase
        .table("learnora_contracts")
        .update({
            "status": "active",
        })
        .eq("id", contract_id)
        .eq("status", "signed")
        .execute()
    )

    if not updated.data:
        raise HTTPException(
            409,
            "Contract state changed; activation was not applied.",
        )

    organisation_id = str(contract["organisation_id"])
    supabase.table("organisations").update({"is_active": True}).eq("id", organisation_id).execute()

    if contract.get("request_id"):
        request_row = supabase.table("learnora_organisation_requests").select("id,portal_user_id").eq("id", contract["request_id"]).limit(1).execute()
        if request_row.data:
            supabase.table("learnora_organisation_requests").update({"status": "active"}).eq("id", contract["request_id"]).execute()
            portal_user_id = request_row.data[0].get("portal_user_id")
            if portal_user_id:
                existing_member = supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", portal_user_id).limit(1).execute()
                if existing_member.data:
                    supabase.table("organisation_members").update({"role": "owner", "status": "active"}).eq("id", existing_member.data[0]["id"]).execute()
                else:
                    supabase.table("organisation_members").insert({
                        "organisation_id": organisation_id,
                        "user_id": portal_user_id,
                        "role": "owner",
                        "status": "active",
                        "joined_at": now,
                    }).execute()
                supabase.table("users").update({"role": "normal"}).eq("id", portal_user_id).eq("role", "organisation_prospect").execute()

    supabase.table(
        "learnora_organisation_lifecycle"
    ).upsert({
        "organisation_id": organisation_id,
        "status": "active",
        "changed_by": context.user_id,
        "updated_at": now,
    }).execute()

    audit(
        actor_user_id=context.user_id,
        action="contract_activated",
        resource_type="contract",
        resource_id=contract_id,
        organisation_id=contract["organisation_id"],
    )

    return {
        "success": True,
        "contract": updated.data[0],
    }


@router.post("/organisations/{organisation_id}/renew")
def renew(
    organisation_id: str,
    body: RenewalIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    _org_access(context, organisation_id)

    if body.start_date and body.end_date and body.end_date <= body.start_date:
        raise HTTPException(
            400,
            "Contract end date must be after the start date.",
        )

    current = (
        supabase
        .table("learnora_contracts")
        .select("id,status")
        .eq("organisation_id", organisation_id)
        .in_("status", ["active", "expiring", "expired", "renewed"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    previous = current.data[0]["id"] if current.data else None

    payload = {
        **body.model_dump(mode="json"),
        "organisation_id": organisation_id,
        "status": "draft",
        "previous_contract_id": previous,
        "created_by": context.user_id,
    }

    result = (
        supabase
        .table("learnora_contracts")
        .insert(payload)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to create renewal contract.",
        )

    if previous:
        supabase.table(
            "learnora_contracts"
        ).update({
            "status": "renewed",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", previous).execute()

    audit(
        actor_user_id=context.user_id,
        action="organisation_contract_renewal_created",
        resource_type="contract",
        resource_id=result.data[0]["id"],
        organisation_id=organisation_id,
        metadata={
            "previous_contract_id": previous,
        },
    )

    return {
        "success": True,
        "contract": result.data[0],
    }


@router.post("/cohorts/{cohort_id}/status")
def cohort_status(
    cohort_id: str,
    body: StatusIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    if body.status not in COHORT_STATES:
        raise HTTPException(
            400,
            "Invalid cohort lifecycle status.",
        )

    cohort = (
        supabase
        .table("cohorts")
        .select("id,organisation_id")
        .eq("id", cohort_id)
        .limit(1)
        .execute()
    )
    if not cohort.data:
        raise HTTPException(
            404,
            "Cohort not found.",
        )

    organisation_id = cohort.data[0]["organisation_id"]
    _org_access(
        context,
        str(organisation_id),
    )

    old = (
        supabase
        .table("learnora_cohort_lifecycle")
        .select("status")
        .eq("cohort_id", cohort_id)
        .limit(1)
        .execute()
    )
    old_status = old.data[0]["status"] if old.data else None

    now = datetime.now(timezone.utc).isoformat()

    lifecycle = (
        supabase
        .table("learnora_cohort_lifecycle")
        .upsert({
            "cohort_id": cohort_id,
            "status": body.status,
            "changed_by": context.user_id,
            "updated_at": now,
        })
        .execute()
    )

    if not lifecycle.data:
        raise HTTPException(
            500,
            "Unable to update cohort lifecycle.",
        )

    updated_cohort = (
        supabase
        .table("cohorts")
        .update({
            "status": body.status,
            "updated_at": now,
        })
        .eq("id", cohort_id)
        .execute()
    )

    supabase.table(
        "learnora_cohort_lifecycle_events"
    ).insert({
        "cohort_id": cohort_id,
        "from_status": old_status,
        "to_status": body.status,
        "reason": body.reason,
        "actor_user_id": context.user_id,
    }).execute()

    return {
        "success": True,
        "lifecycle": lifecycle.data[0],
        "cohort": (
            updated_cohort.data[0]
            if updated_cohort.data
            else None
        ),
    }


@router.post("/cohorts/{cohort_id}/renew")
def renew_cohort(
    cohort_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    cohort = (
        supabase
        .table("cohorts")
        .select("*")
        .eq("id", cohort_id)
        .limit(1)
        .execute()
    )
    if not cohort.data:
        raise HTTPException(
            404,
            "Cohort not found.",
        )

    old = cohort.data[0]
    _org_access(
        context,
        str(old["organisation_id"]),
    )

    if old["status"] in {"draft", "upcoming", "active"}:
        raise HTTPException(
            409,
            "Only completed or ended cohorts can be renewed.",
        )

    name = f"{old['name']} — Renewal"

    result = (
        supabase
        .table("cohorts")
        .insert({
            "organisation_id": old["organisation_id"],
            "name": name,
            "description": old.get("description"),
            "start_date": None,
            "end_date": None,
            "status": "draft",
            "programme_id": old.get("programme_id"),
            "capacity": old.get("capacity"),
            "instructor_capacity": old.get("instructor_capacity"),
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to create renewal cohort.",
        )

    new_cohort = result.data[0]
    now = datetime.now(timezone.utc).isoformat()

    supabase.table(
        "learnora_cohort_lifecycle"
    ).upsert({
        "cohort_id": cohort_id,
        "status": "completed",
        "next_cohort_id": new_cohort["id"],
        "changed_by": context.user_id,
        "updated_at": now,
    }).execute()

    supabase.table(
        "learnora_cohort_lifecycle"
    ).upsert({
        "cohort_id": new_cohort["id"],
        "status": "draft",
        "previous_cohort_id": cohort_id,
        "changed_by": context.user_id,
        "updated_at": now,
    }).execute()

    audit(
        actor_user_id=context.user_id,
        action="cohort_renewed",
        resource_type="cohort",
        resource_id=new_cohort["id"],
        organisation_id=old["organisation_id"],
        metadata={
            "previous_cohort_id": cohort_id,
        },
    )

    return {
        "success": True,
        "previous_cohort": old,
        "new_cohort": new_cohort,
    }
