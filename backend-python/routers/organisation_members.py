"""Organisation membership API with lifecycle and hard capacity enforcement."""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from .auth import supabase
from .permissions import PermissionContext, require_permission
from services.capacity import ensure_org_capacity
from services.audit import audit

router=APIRouter(prefix="/api/organisations",tags=["Organisation Members"])
ALLOWED_ROLES={"owner","admin","instructor","learner"}
ALLOWED_STATUS={"active","invited","suspended"}

class AddOrganisationMember(BaseModel):
    user_id: UUID
    role: str=Field(default="learner",min_length=1,max_length=50)

class UpdateOrganisationMember(BaseModel):
    role: Optional[str]=None
    status: Optional[str]=None

def _role(v):
    v=v.strip().lower()
    if v not in ALLOWED_ROLES: raise HTTPException(400,"Invalid organisation role.")
    return v

def _status(v):
    v=v.strip().lower()
    if v not in ALLOWED_STATUS: raise HTTPException(400,"Invalid membership status.")
    return v

def _scope(context,org_id):
    target=str(org_id)
    if context.is_platform_admin:return target
    if not context.organisation_id or str(context.organisation_id)!=target:
        raise HTTPException(403,"You do not have access to this organisation.")
    return target

def _org(org_id):
    r=supabase.table("organisations").select("*").eq("id",org_id).limit(1).execute()
    if not r.data: raise HTTPException(404,"Organisation not found.")
    return r.data[0]

def _member(org_id,member_id):
    r=supabase.table("organisation_members").select("id,organisation_id,user_id,role,status,joined_at").eq("id",member_id).eq("organisation_id",org_id).limit(1).execute()
    return r.data[0] if r.data else None

def _user(uid):
    r=supabase.table("users").select("id,email,name,role").eq("id",uid).limit(1).execute()
    return r.data[0] if r.data else None

def _format(m,u):
    return {"membership_id":m["id"],"organisation_id":m["organisation_id"],"user_id":m["user_id"],"role":m["role"],"status":m["status"],"joined_at":m["joined_at"],"user":u}

@router.get("/{organisation_id}/members")
def list_members(organisation_id:UUID,status:Optional[str]=Query(None),role:Optional[str]=Query(None),context:PermissionContext=Depends(require_permission("organisations.members"))):
    oid=_scope(context,organisation_id); _org(oid)
    if status: status=_status(status)
    if role: role=_role(role)
    q=supabase.table("organisation_members").select("id,organisation_id,user_id,role,status,joined_at").eq("organisation_id",oid)
    if status:q=q.eq("status",status)
    if role:q=q.eq("role",role)
    rows=q.order("joined_at",desc=False).execute().data or []
    return {"success":True,"organisation_id":oid,"count":len(rows),"members":[_format(m,_user(str(m["user_id"]))) for m in rows]}

@router.get("/{organisation_id}/members/{member_id}")
def get_member(organisation_id:UUID,member_id:UUID,context:PermissionContext=Depends(require_permission("organisations.members"))):
    oid=_scope(context,organisation_id); _org(oid); m=_member(oid,str(member_id))
    if not m:raise HTTPException(404,"Organisation member not found.")
    return {"success":True,"member":_format(m,_user(str(m["user_id"])))}

@router.post("/{organisation_id}/members")
def add_member(organisation_id:UUID,payload:AddOrganisationMember,context:PermissionContext=Depends(require_permission("organisations.members"))):
    oid=_scope(context,organisation_id); _org(oid); role=_role(payload.role); uid=str(payload.user_id)
    u=_user(uid)
    if not u:raise HTTPException(404,"User not found.")
    existing=supabase.table("organisation_members").select("id,organisation_id,user_id,role,status,joined_at").eq("organisation_id",oid).eq("user_id",uid).limit(1).execute()
    if existing.data:
        m=existing.data[0]
        if m["status"]=="active":raise HTTPException(409,"User is already an active member.")
        ensure_org_capacity(oid,"learners" if role=="learner" else "instructors" if role=="instructor" else "learners",1)
        r=supabase.table("organisation_members").update({"role":role,"status":"active"}).eq("id",m["id"]).execute()
    else:
        ensure_org_capacity(oid,"learners" if role=="learner" else "instructors" if role=="instructor" else "learners",1)
        r=supabase.table("organisation_members").insert({"organisation_id":oid,"user_id":uid,"role":role,"status":"active"}).execute()
    if not r.data:raise HTTPException(500,"Failed to save organisation membership.")
    m=r.data[0]; audit(actor_user_id=context.user_id,action="organisation_member_added",resource_type="organisation_member",resource_id=m["id"],organisation_id=oid,metadata={"role":role})
    return {"success":True,"member":_format(m,u)}

@router.patch("/{organisation_id}/members/{member_id}")
def update_member(organisation_id:UUID,member_id:UUID,payload:UpdateOrganisationMember,context:PermissionContext=Depends(require_permission("organisations.members"))):
    oid=_scope(context,organisation_id); _org(oid); m=_member(oid,str(member_id))
    if not m:raise HTTPException(404,"Organisation member not found.")
    updates={}
    if payload.role is not None:updates["role"]=_role(payload.role)
    if payload.status is not None:updates["status"]=_status(payload.status)
    if not updates:raise HTTPException(400,"No membership changes supplied.")
    if m["role"]=="owner" and (updates.get("role") not in (None,"owner") or updates.get("status") in {"suspended"}):
        owners=supabase.table("organisation_members").select("id").eq("organisation_id",oid).eq("role","owner").eq("status","active").execute().data or []
        if len(owners)<=1:raise HTTPException(400,"The organisation must retain at least one active owner.")
    if updates.get("role") in {"learner","instructor"} and updates.get("role")!=m["role"] and m["status"]=="active":
        ensure_org_capacity(oid,"learners" if updates["role"]=="learner" else "instructors",1)
    r=supabase.table("organisation_members").update(updates).eq("id",str(member_id)).eq("organisation_id",oid).execute()
    if not r.data:raise HTTPException(500,"Failed to update organisation membership.")
    updated=r.data[0]; audit(actor_user_id=context.user_id,action="organisation_member_updated",resource_type="organisation_member",resource_id=member_id,organisation_id=oid,metadata={"changes":updates})
    return {"success":True,"member":_format(updated,_user(str(updated["user_id"])))}

@router.delete("/{organisation_id}/members/{member_id}")
def remove_member(organisation_id:UUID,member_id:UUID,context:PermissionContext=Depends(require_permission("organisations.members"))):
    oid=_scope(context,organisation_id); _org(oid); m=_member(oid,str(member_id))
    if not m:raise HTTPException(404,"Organisation member not found.")
    if m["role"]=="owner" and m["status"]=="active":
        owners=supabase.table("organisation_members").select("id").eq("organisation_id",oid).eq("role","owner").eq("status","active").execute().data or []
        if len(owners)<=1:raise HTTPException(400,"The final active owner cannot be removed.")
    r=supabase.table("organisation_members").update({"status":"suspended"}).eq("id",str(member_id)).eq("organisation_id",oid).execute()
    if not r.data:raise HTTPException(500,"Failed to suspend organisation membership.")
    audit(actor_user_id=context.user_id,action="organisation_member_suspended",resource_type="organisation_member",resource_id=member_id,organisation_id=oid)
    return {"success":True,"membership_id":str(member_id),"status":"suspended"}

@router.get("/{organisation_id}/members/summary")
def summary(organisation_id:UUID,context:PermissionContext=Depends(require_permission("organisations.members"))):
    oid=_scope(context,organisation_id); _org(oid)
    rows=supabase.table("organisation_members").select("role,status").eq("organisation_id",oid).execute().data or []
    out={"total":len(rows),"active":0,"invited":0,"suspended":0,"owners":0,"admins":0,"instructors":0,"learners":0}
    for r in rows:
        if r["status"] in out:out[r["status"]]+=1
        if r["role"]+"s" in out:out[r["role"]+"s"]+=1
        elif r["role"]=="owner":out["owners"]+=1
    return {"success":True,"organisation_id":oid,"summary":out}
