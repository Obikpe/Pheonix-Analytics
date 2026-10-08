"""Internal Learnora operational read APIs.

These endpoints are intentionally separate from learner/admin public APIs so
the internal frontend can authenticate with the internal staff token only.
"""
from fastapi import APIRouter, Depends, HTTPException
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
