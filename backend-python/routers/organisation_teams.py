"""Customer organisation team management."""
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from .auth import supabase
from .permissions import PermissionContext,require_permission
from services.capacity import ensure_org_capacity
from services.audit import audit

router=APIRouter(prefix="/api/organisation-teams",tags=["Organisation Teams"])
class TeamIn(BaseModel):
    organisation_id:str
    name:str
    slug:str
    description:str|None=None
    manager_user_id:str|None=None
class TeamMemberIn(BaseModel):
    user_id:str
    role:str="member"

def scope(context,oid):
    if context.is_platform_admin:return
    if str(context.organisation_id)!=str(oid):raise HTTPException(403,"Organisation access denied.")

@router.post("",status_code=201)
def create_team(body:TeamIn,context:PermissionContext=Depends(require_permission("organisations.update"))):
    scope(context,body.organisation_id); ensure_org_capacity(body.organisation_id,"teams",1)
    r=supabase.table("organisation_teams").insert({**body.model_dump(),"created_by":context.user_id}).execute()
    if not r.data:raise HTTPException(500,"Unable to create team.")
    audit(actor_user_id=context.user_id,action="organisation_team_created",resource_type="organisation_team",resource_id=r.data[0]["id"],organisation_id=body.organisation_id)
    return {"success":True,"team":r.data[0]}

@router.get("/{organisation_id}")
def list_teams(organisation_id:str,context:PermissionContext=Depends(require_permission("organisations.view"))):
    scope(context,organisation_id)
    r=supabase.table("organisation_teams").select("*").eq("organisation_id",organisation_id).order("created_at",desc=True).execute()
    return {"success":True,"teams":r.data or []}

@router.post("/{team_id}/members",status_code=201)
def add_member(team_id:str,body:TeamMemberIn,context:PermissionContext=Depends(require_permission("organisations.members"))):
    t=supabase.table("organisation_teams").select("organisation_id").eq("id",team_id).limit(1).execute()
    if not t.data:raise HTTPException(404,"Team not found.")
    scope(context,t.data[0]["organisation_id"])
    r=supabase.table("organisation_team_members").upsert({"team_id":team_id,**body.model_dump()},on_conflict="team_id,user_id").execute()
    if not r.data:raise HTTPException(500,"Unable to add team member.")
    return {"success":True,"member":r.data[0]}

@router.get("/{team_id}/members")
def team_members(team_id:str,context:PermissionContext=Depends(require_permission("organisations.view"))):
    t=supabase.table("organisation_teams").select("organisation_id").eq("id",team_id).limit(1).execute()
    if not t.data:raise HTTPException(404,"Team not found.")
    scope(context,t.data[0]["organisation_id"])
    r=supabase.table("organisation_team_members").select("*").eq("team_id",team_id).eq("status","active").execute()
    return {"success":True,"members":r.data or []}
