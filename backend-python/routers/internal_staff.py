"""Learnora internal staff management API."""
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from .auth import hash_password, log_audit_event, norm_email, supabase
from .internal_auth import InternalStaffContext, get_current_staff, require_internal_permission
from .permissions import PermissionContext, require_platform_role

router=APIRouter(prefix="/api/internal/staff",tags=["Internal Staff"])
SAFE="id,user_id,employee_code,job_title,status,joined_at,left_at,created_by,created_at,updated_at"

class CreateStaffRequest(BaseModel):
    email:str
    name:str=Field(...,min_length=1,max_length=150)
    password:str=Field(...,min_length=8,max_length=72)
    job_title:Optional[str]=None
    employee_code:Optional[str]=None
    role_slug:str="support"

class UpdateStaffRequest(BaseModel):
    name:Optional[str]=None
    job_title:Optional[str]=None
    employee_code:Optional[str]=None
    status:Optional[str]=None

class AssignRoleRequest(BaseModel):
    role_slug:str

def staff_row(staff_id):
    r=supabase.table("learnora_staff_accounts").select(SAFE).eq("id",staff_id).limit(1).execute()
    return r.data[0] if r.data else None

def role_row(slug):
    r=supabase.table("learnora_staff_roles").select("id,name,slug,description,status").eq("slug",slug.strip().lower()).limit(1).execute()
    return r.data[0] if r.data else None

def payload(row):
    u=supabase.table("users").select("id,email,name,role").eq("id",row["user_id"]).limit(1).execute()
    a=supabase.table("learnora_staff_role_assignments").select("role_id").eq("staff_id",row["id"]).eq("status","active").execute()
    ids=[x["role_id"] for x in (a.data or [])]
    roles=supabase.table("learnora_staff_roles").select("id,name,slug,description").in_("id",ids).execute().data if ids else []
    m=supabase.table("learnora_staff_team_members").select("team_id,team_role,status").eq("staff_id",row["id"]).eq("status","active").execute()
    return {"staff":row,"user":u.data[0] if u.data else {}, "roles":roles or [],"teams":m.data or []}

@router.get("")
def list_staff(staff:InternalStaffContext=Depends(require_internal_permission("staff.view"))):
    r=supabase.table("learnora_staff_accounts").select(SAFE).order("created_at",desc=True).execute()
    return {"success":True,"staff":[payload(x) for x in (r.data or [])]}

@router.get("/roles/catalog")
def roles(staff:InternalStaffContext=Depends(get_current_staff),_:InternalStaffContext=Depends(require_permission("staff.roles"))):
    r=supabase.table("learnora_staff_roles").select("id,name,slug,description,is_system_role,status").order("name").execute()
    return {"success":True,"roles":r.data or []}

@router.get("/departments/catalog")
def departments(staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.departments"))):
    r=supabase.table("learnora_departments").select("id,name,slug,description,status").order("name").execute()
    return {"success":True,"departments":r.data or []}

@router.get("/{staff_id}")
def get_staff(staff_id:str,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.view"))):
    row=staff_row(staff_id)
    if not row:raise HTTPException(404,"Staff account not found")
    return {"success":True,**payload(row)}

@router.post("",status_code=201)
def create_staff(body:CreateStaffRequest,request:Request,admin:PermissionContext=Depends(require_platform_role("super_admin"))):
    email=norm_email(body.email); role=role_row(body.role_slug)
    if not role:raise HTTPException(400,"Unknown staff role")
    if supabase.table("users").select("id").eq("email",email).limit(1).execute().data:raise HTTPException(409,"A Learnora identity already exists for this email")
    now=datetime.now(timezone.utc).isoformat()
    creator=supabase.table("users").select("id").eq("email",admin.user.email).limit(1).execute()
    ur=supabase.table("users").insert({"email":email,"name":body.name.strip(),"password_hash":hash_password(body.password),"role":"staff","is_paid":False,"sub_status":"active","email_verified":True}).execute()
    if not ur.data:raise HTTPException(500,"Unable to create staff identity")
    uid=ur.data[0]["id"]; created_by=creator.data[0]["id"] if creator.data else None
    sr=supabase.table("learnora_staff_accounts").insert({"user_id":uid,"employee_code":body.employee_code,"job_title":body.job_title,"status":"active","joined_at":now,"created_by":created_by}).execute()
    if not sr.data:
        supabase.table("users").delete().eq("id",uid).execute(); raise HTTPException(500,"Unable to create staff account")
    supabase.table("learnora_staff_role_assignments").insert({"staff_id":sr.data[0]["id"],"role_id":role["id"]}).execute()
    log_audit_event(action="internal_staff_created",email=admin.user.email,account_type="admin",role=admin.user.role,request=request,metadata={"staff_id":sr.data[0]["id"]})
    return {"success":True,**payload(sr.data[0])}

@router.patch("/{staff_id}")
def update_staff(staff_id:str,body:UpdateStaffRequest,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.update"))):
    row=staff_row(staff_id)
    if not row:raise HTTPException(404,"Staff account not found")
    if body.name is not None:supabase.table("users").update({"name":body.name.strip()}).eq("id",row["user_id"]).execute()
    updates={k:v for k,v in {"job_title":body.job_title,"employee_code":body.employee_code,"status":body.status}.items() if v is not None}
    if body.status=="deactivated":updates["left_at"]=datetime.now(timezone.utc).isoformat()
    if updates:supabase.table("learnora_staff_accounts").update(updates).eq("id",staff_id).execute()
    return {"success":True,**payload(staff_row(staff_id))}

@router.post("/{staff_id}/roles")
def assign_role(staff_id:str,body:AssignRoleRequest,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.roles"))):
    row=staff_row(staff_id); role=role_row(body.role_slug)
    if not row or not role:raise HTTPException(404,"Staff account or role not found")
    r=supabase.table("learnora_staff_role_assignments").upsert({"staff_id":staff_id,"role_id":role["id"],"status":"active"},on_conflict="staff_id,role_id").execute()
    return {"success":True,"assignment":r.data[0] if r.data else None}

@router.delete("/{staff_id}/roles/{role_slug}")
def remove_role(staff_id:str,role_slug:str,staff:InternalStaffContext=Depends(get_current_staff),_:PermissionContext=Depends(require_permission("staff.roles"))):
    role=role_row(role_slug)
    if not role:raise HTTPException(404,"Role not found")
    r=supabase.table("learnora_staff_role_assignments").update({"status":"inactive"}).eq("staff_id",staff_id).eq("role_id",role["id"]).execute()
    return {"success":True,"updated":len(r.data or [])}
