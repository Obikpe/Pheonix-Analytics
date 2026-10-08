"""Internal Learnora operational read APIs.

These endpoints are intentionally separate from learner/admin public APIs so
the internal frontend can authenticate with the internal staff token only.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
from .internal_auth import InternalStaffContext, require_internal_permission
from .auth import supabase

router = APIRouter(prefix="/api/internal/operations", tags=["Internal Operations"])

def _staff(permission: str):
    return Depends(require_internal_permission(permission))

@router.get("/organisations")
def organisations(staff: InternalStaffContext = _staff("organisations.view")):
    result = supabase.table("organisations").select(
        "id,name,slug,organisation_type,template,is_active,created_at,updated_at"
    ).order("created_at", desc=True).execute()
    return {"success": True, "organisations": result.data or []}

@router.get("/organisations/{organisation_id}")
def organisation(organisation_id: str, staff: InternalStaffContext = _staff("organisations.view")):
    result = supabase.table("organisations").select("*").eq("id", organisation_id).limit(1).execute()
    if not result.data:
        raise HTTPException(404, "Organisation not found.")
    return {"success": True, "organisation": result.data[0]}

class OrganisationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=100)
    organisation_type: str = Field("academy", min_length=2, max_length=50)
    template: str = Field("academy", min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    logo_url: Optional[str] = Field(None, max_length=1000)
    brand_primary: Optional[str] = Field(None, max_length=50)
    brand_secondary: Optional[str] = Field(None, max_length=50)

class OrganisationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    slug: Optional[str] = Field(None, min_length=2, max_length=100)
    organisation_type: Optional[str] = Field(None, min_length=2, max_length=50)
    template: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    logo_url: Optional[str] = Field(None, max_length=1000)
    brand_primary: Optional[str] = Field(None, max_length=50)
    brand_secondary: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None

@router.post("/organisations")
def create_organisation(payload: OrganisationCreate, staff: InternalStaffContext = Depends(require_internal_permission("organisations.create"))):
    name = payload.name.strip()
    slug = payload.slug.strip().lower().replace(" ", "-")
    if supabase.table("organisations").select("id").eq("slug", slug).limit(1).execute().data:
        raise HTTPException(status_code=400, detail="An organisation with this slug already exists.")
    row = supabase.table("organisations").insert({"name": name, "slug": slug, "organisation_type": payload.organisation_type.strip().lower(), "template": payload.template.strip().lower(), "description": payload.description.strip() if payload.description else None, "logo_url": payload.logo_url.strip() if payload.logo_url else None, "brand_primary": payload.brand_primary.strip() if payload.brand_primary else None, "brand_secondary": payload.brand_secondary.strip() if payload.brand_secondary else None, "is_active": True}).execute()
    if not row.data: raise HTTPException(status_code=500, detail="Organisation creation failed.")
    return {"success": True, "organisation": row.data[0]}

@router.patch("/organisations/{organisation_id}")
def update_organisation(organisation_id: str, payload: OrganisationUpdate, staff: InternalStaffContext = Depends(require_internal_permission("organisations.update"))):
    if not supabase.table("organisations").select("id").eq("id", organisation_id).limit(1).execute().data:
        raise HTTPException(status_code=404, detail="Organisation not found.")
    data = payload.model_dump(exclude_unset=True)
    for key in ("name", "organisation_type", "template", "logo_url", "brand_primary", "brand_secondary", "description", "slug"):
        if key in data and isinstance(data[key], str): data[key] = data[key].strip() or None
    if data.get("slug"):
        data["slug"] = data["slug"].lower().replace(" ", "-")
        if supabase.table("organisations").select("id").eq("slug", data["slug"]).neq("id", organisation_id).limit(1).execute().data:
            raise HTTPException(status_code=400, detail="An organisation with this slug already exists.")
    if not data: raise HTTPException(status_code=400, detail="No changes supplied.")
    row = supabase.table("organisations").update(data).eq("id", organisation_id).execute()
    if not row.data: raise HTTPException(status_code=500, detail="Organisation update failed.")
    return {"success": True, "organisation": row.data[0]}

@router.get("/organisations/{organisation_id}/members")
def organisation_members(organisation_id: str, staff: InternalStaffContext = _staff("organisations.members")):
    rows = supabase.table("organisation_members").select(
        "id,organisation_id,user_id,role,status,joined_at"
    ).eq("organisation_id", organisation_id).order("joined_at").execute().data or []
    members = []
    for row in rows:
        user = supabase.table("users").select("id,email,name,role").eq("id", row["user_id"]).limit(1).execute()
        members.append({**row, "membership_id": row["id"], "user": user.data[0] if user.data else None})
    return {"success": True, "members": members, "count": len(members)}

@router.get("/organisations/{organisation_id}/members/summary")
def member_summary(organisation_id: str, staff: InternalStaffContext = _staff("organisations.members")):
    rows = supabase.table("organisation_members").select("role,status").eq("organisation_id", organisation_id).execute().data or []
    summary = {"total": len(rows), "active": 0, "invited": 0, "suspended": 0, "owners": 0, "admins": 0, "instructors": 0, "learners": 0}
    for row in rows:
        if row.get("status") in summary:
            summary[row["status"]] += 1
        role = row.get("role")
        if role == "owner": summary["owners"] += 1
        elif role in {"admin", "instructor", "learner"}: summary[role + "s"] += 1
    return {"success": True, "summary": summary}

@router.get("/organisations/{organisation_id}/contract")
def organisation_contract(organisation_id: str, staff: InternalStaffContext = _staff("organisations.view")):
    result = supabase.table("learnora_contracts").select("*").eq("organisation_id", organisation_id).in_("status", ["signed","active","expiring"]).order("created_at", desc=True).limit(1).execute()
    return {"success": True, "contract": result.data[0] if result.data else None}

@router.get("/organisations/{organisation_id}/capacity")
def organisation_capacity(organisation_id: str, staff: InternalStaffContext = _staff("organisations.view")):
    contract = supabase.table("learnora_contracts").select("*").eq("organisation_id", organisation_id).in_("status", ["signed","active","expiring"]).order("created_at", desc=True).limit(1).execute()
    if not contract.data:
        return {"success": True, "contract": None, "capacity": []}
    cid = contract.data[0]["id"]
    entitlements = supabase.table("learnora_contract_entitlements").select("*").eq("contract_id", cid).execute().data or []
    return {"success": True, "contract": contract.data[0], "capacity": entitlements}

@router.get("/organisations/{organisation_id}/contract-preparation")
def contract_preparation(
    organisation_id: str,
    staff: InternalStaffContext = _staff("organisations.view"),
):
    organisation_result = (
        supabase.table("organisations")
        .select("*")
        .eq("id", organisation_id)
        .limit(1)
        .execute()
    )
    if not organisation_result.data:
        raise HTTPException(status_code=404, detail="Organisation not found.")

    request_result = (
        supabase.table("learnora_organisation_requests")
        .select("*")
        .eq("organisation_id", organisation_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    contract_result = (
        supabase.table("learnora_contracts")
        .select("*")
        .eq("organisation_id", organisation_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    contract = contract_result.data[0] if contract_result.data else None
    versions = []
    entitlements = []

    if contract:
        versions = (
            supabase.table("learnora_contract_versions")
            .select("*")
            .eq("contract_id", contract["id"])
            .order("version_number", desc=True)
            .execute()
        ).data or []

        entitlements = (
            supabase.table("learnora_contract_entitlements")
            .select("*")
            .eq("contract_id", contract["id"])
            .order("entitlement_key")
            .execute()
        ).data or []

    request = request_result.data[0] if request_result.data else None

    return {
        "success": True,
        "organisation": organisation_result.data[0],
        "request": request,
        "contract": contract,
        "versions": versions,
        "entitlements": entitlements,
        "ready_for_terms": bool(request),
        "ready_for_draft": bool(request and contract),
    }


@router.get("/creators/applications")
def creator_applications(staff: InternalStaffContext = _staff("users.view")):
    result = supabase.table("learnora_creator_applications").select("*").order("created_at", desc=True).execute()
    return {"success": True, "applications": result.data or []}

@router.get("/creators/payouts")
def creator_payouts(staff: InternalStaffContext = _staff("users.view")):
    result = supabase.table("learnora_creator_payouts").select("*").order("requested_at", desc=True).execute()
    return {"success": True, "payouts": result.data or []}

@router.get("/ai/providers")
def ai_providers(staff: InternalStaffContext = _staff("ai.manage")):
    result = supabase.table("learnora_ai_providers").select(
        "id,provider_key,display_name,base_url,default_model,enabled,priority,config,created_at,updated_at"
    ).order("priority").execute()
    return {"success": True, "providers": result.data or []}

@router.get("/ai/limits")
def ai_limits(staff: InternalStaffContext = _staff("ai.manage")):
    result = supabase.table("learnora_ai_limits").select("*").order("scope_type").order("feature").execute()
    return {"success": True, "limits": result.data or []}


class CreatorReview(BaseModel):
    status: str = Field(..., min_length=1, max_length=20)

@router.patch("/creators/applications/{application_id}")
def review_creator_application(
    application_id: str,
    payload: CreatorReview,
    staff: InternalStaffContext = _staff("users.update"),
):
    if payload.status not in {"approved", "declined"}:
        raise HTTPException(status_code=400, detail="Status must be approved or declined.")

    application = (
        supabase.table("learnora_creator_applications")
        .select("*")
        .eq("id", application_id)
        .limit(1)
        .execute()
    )
    if not application.data:
        raise HTTPException(status_code=404, detail="Creator application not found.")

    row = application.data[0]
    now = datetime.now(timezone.utc).isoformat()

    updated = (
        supabase.table("learnora_creator_applications")
        .update({
            "status": payload.status,
            "reviewed_by": staff.user_id,
            "reviewed_at": now,
        })
        .eq("id", application_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=500, detail="Unable to update creator application.")

    if payload.status == "approved":
        existing = (
            supabase.table("learnora_creator_accounts")
            .select("id")
            .eq("user_id", row["user_id"])
            .limit(1)
            .execute()
        )
        account_payload = {
            "user_id": row["user_id"],
            "status": "approved",
            "approved_by": staff.user_id,
            "approved_at": now,
            "application_id": application_id,
        }
        if existing.data:
            account = (
                supabase.table("learnora_creator_accounts")
                .update(account_payload)
                .eq("id", existing.data[0]["id"])
                .execute()
            )
        else:
            account = supabase.table("learnora_creator_accounts").insert(account_payload).execute()

        if not account.data:
            raise HTTPException(status_code=500, detail="Creator account activation failed.")

    return {"success": True, "status": payload.status}


@router.get("/organisation-requests")
def organisation_requests(staff: InternalStaffContext = _staff("organisations.view")):
    result = (
        supabase.table("learnora_organisation_requests")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "requests": result.data or []}


class OrganisationRequestStatus(BaseModel):
    status: str = Field(..., min_length=1, max_length=40)

@router.patch("/organisation-requests/{request_id}")
def update_organisation_request(
    request_id: str,
    payload: OrganisationRequestStatus,
    staff: InternalStaffContext = _staff("organisations.update"),
):
    allowed = {
        "submitted",
        "under_review",
        "discussion",
        "contract_preparation",
        "contract_sent",
        "signed",
        "pending_approval",
        "active",
        "declined",
        "closed",
    }
    if payload.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid organisation request status.")

    existing = (
        supabase.table("learnora_organisation_requests")
        .select("*")
        .eq("id", request_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Organisation request not found.")

    row = existing.data[0]
    if payload.status == "active" and not row.get("organisation_id"):
        raise HTTPException(status_code=409, detail="An organisation must be linked before activation.")

    updated = (
        supabase.table("learnora_organisation_requests")
        .update({"status": payload.status})
        .eq("id", request_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(status_code=500, detail="Unable to update organisation request.")

    return {"success": True, "request": updated.data[0]}
