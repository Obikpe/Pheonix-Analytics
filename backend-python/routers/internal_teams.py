"""Learnora internal departments and teams API."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from .auth import log_audit_event, supabase
from .internal_auth import InternalStaffContext, get_current_staff
from .permissions import PermissionContext, require_permission

router=APIRouter(prefix="/api/internal",tags=["Internal Organisation"])

class DepartmentRequest(BaseModel):
    name:str=Field(...,min_length=2,max_length=120)
    slug:str=Field(...,min_length=2,max_length=80)
    description:Optional[str]=None
class TeamRequest(BaseModel):
    name:str=Field(...,min_length=2,max_length=120)
    slug:str=Field(...,min_length=2,max_length=80)
    description:Optional[str]=None
    department_id:Optional[str]=None
    manager_staff_id:Optional[str]=None
class TeamMemberRequest(BaseModel):
    staff_id:str
    team_role:str="member"

@router.get("/departments")
def departments(staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.departments"))):
    r=supabase.table("learnora_departments").select("*").order("name").execute()
    return {"success":True,"departments":r.data or []}

@router.post("/departments",status_code=201)
def create_department(body:DepartmentRequest,request:Request,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.departments"))):
    r=supabase.table("learnora_departments").insert({"name":body.name.strip(),"slug":body.slug.strip().lower(),"description":body.description.strip() if body.description else None}).execute()
    if not r.data:raise HTTPException(500,"Unable to create department")
    log_audit_event(action="internal_department_created",email=staff.email,account_type="staff",role="staff",request=request,metadata={"department_id":r.data[0]["id"]})
    return {"success":True,"department":r.data[0]}

@router.patch("/departments/{department_id}")
def update_department(department_id:str,body:DepartmentRequest,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.departments"))):
    r=supabase.table("learnora_departments").update({"name":body.name.strip(),"slug":body.slug.strip().lower(),"description":body.description.strip() if body.description else None}).eq("id",department_id).execute()
    if not r.data:raise HTTPException(404,"Department not found")
    return {"success":True,"department":r.data[0]}

@router.get("/teams")
def teams(staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.teams"))):
    r=supabase.table("learnora_staff_teams").select("*").order("name").execute()
    return {"success":True,"teams":r.data or []}

@router.post("/teams",status_code=201)
def create_team(body:TeamRequest,request:Request,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.teams"))):
    r=supabase.table("learnora_staff_teams").insert({"name":body.name.strip(),"slug":body.slug.strip().lower(),"description":body.description.strip() if body.description else None,"department_id":body.department_id,"manager_staff_id":body.manager_staff_id}).execute()
    if not r.data:raise HTTPException(500,"Unable to create team")
    return {"success":True,"team":r.data[0]}

@router.patch("/teams/{team_id}")
def update_team(team_id:str,body:TeamRequest,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.teams"))):
    r=supabase.table("learnora_staff_teams").update({"name":body.name.strip(),"slug":body.slug.strip().lower(),"description":body.description.strip() if body.description else None,"department_id":body.department_id,"manager_staff_id":body.manager_staff_id}).eq("id",team_id).execute()
    if not r.data:raise HTTPException(404,"Team not found")
    return {"success":True,"team":r.data[0]}

@router.get("/teams/{team_id}/members")
def members(team_id:str,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.teams"))):
    r=supabase.table("learnora_staff_team_members").select("*").eq("team_id",team_id).order("joined_at").execute()
    return {"success":True,"members":r.data or []}

@router.post("/teams/{team_id}/members",status_code=201)
def add_member(team_id:str,body:TeamMemberRequest,request:Request,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.teams"))):
    r=supabase.table("learnora_staff_team_members").upsert({"team_id":team_id,"staff_id":body.staff_id,"team_role":body.team_role.strip() or "member","status":"active","joined_at":datetime.now(timezone.utc).isoformat(),"left_at":None},on_conflict="team_id,staff_id").execute()
    if not r.data:raise HTTPException(500,"Unable to add team member")
    return {"success":True,"membership":r.data[0]}

@router.delete("/teams/{team_id}/members/{staff_id}")
def remove_member(team_id:str,staff_id:str,request:Request,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.teams"))):
    r=supabase.table("learnora_staff_team_members").update({"status":"inactive","left_at":datetime.now(timezone.utc).isoformat()}).eq("team_id",team_id).eq("staff_id",staff_id).execute()
    return {"success":True,"updated":len(r.data or [])}
