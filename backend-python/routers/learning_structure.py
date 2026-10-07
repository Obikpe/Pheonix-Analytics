"""Programme, learning-path and cohort membership APIs."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from .auth import supabase
from .permissions import PermissionContext, require_permission
from ..services.capacity import ensure_cohort_capacity
from ..services.audit import audit

router=APIRouter(prefix="/api/learning",tags=["Learning Structure"])

class ProgrammeIn(BaseModel):
    organisation_id:str
    name:str
    slug:str
    description:str|None=None
    status:str="draft"
    start_date:str|None=None
    end_date:str|None=None

class CourseLinkIn(BaseModel):
    course_id:str
    order_index:int=0
    required:bool=True

class PathIn(BaseModel):
    name:str
    slug:str|None=None
    description:str|None=None
    organisation_id:str|None=None
    status:str="draft"

class CohortMemberIn(BaseModel):
    user_id:str

def _scope(context,oid):
    if context.is_platform_admin:return
    if str(context.organisation_id)!=str(oid):raise HTTPException(403,"Organisation access denied.")

@router.post("/programmes",status_code=201)
def create_programme(body:ProgrammeIn,context:PermissionContext=Depends(require_permission("courses.create"))):
    _scope(context,body.organisation_id)
    r=supabase.table("learnora_programmes").insert({**body.model_dump(),"created_by":context.user_id}).execute()
    if not r.data:raise HTTPException(500,"Unable to create programme.")
    audit(actor_user_id=context.user_id,action="programme_created",resource_type="programme",resource_id=r.data[0]["id"],organisation_id=body.organisation_id)
    return {"success":True,"programme":r.data[0]}

@router.get("/organisations/{organisation_id}/programmes")
def list_programmes(organisation_id:str,context:PermissionContext=Depends(require_permission("organisations.view"))):
    _scope(context,organisation_id)
    r=supabase.table("learnora_programmes").select("*").eq("organisation_id",organisation_id).order("created_at",desc=True).execute()
    return {"success":True,"programmes":r.data or []}

@router.post("/programmes/{programme_id}/courses",status_code=201)
def link_course(programme_id:str,body:CourseLinkIn,context:PermissionContext=Depends(require_permission("courses.assign"))):
    p=supabase.table("learnora_programmes").select("organisation_id").eq("id",programme_id).limit(1).execute()
    if not p.data:raise HTTPException(404,"Programme not found.")
    _scope(context,p.data[0]["organisation_id"])
    r=supabase.table("learnora_programme_courses").upsert({"programme_id":programme_id,**body.model_dump()},on_conflict="programme_id,course_id").execute()
    return {"success":True,"course":r.data[0] if r.data else None}

@router.get("/programmes/{programme_id}")
def get_programme(programme_id:str,context:PermissionContext=Depends(require_permission("organisations.view"))):
    p=supabase.table("learnora_programmes").select("*").eq("id",programme_id).limit(1).execute()
    if not p.data:raise HTTPException(404,"Programme not found.")
    _scope(context,p.data[0]["organisation_id"])
    c=supabase.table("learnora_programme_courses").select("*").eq("programme_id",programme_id).order("order_index").execute()
    return {"success":True,"programme":p.data[0],"courses":c.data or []}

@router.post("/paths",status_code=201)
def create_path(body:PathIn,context:PermissionContext=Depends(require_permission("courses.create"))):
    if body.organisation_id:_scope(context,body.organisation_id)
    payload=body.model_dump()
    payload.update({"owner_user_id":context.user_id,"created_by":context.user_id})
    r=supabase.table("learnora_learning_paths").insert(payload).execute()
    if not r.data:raise HTTPException(500,"Unable to create learning path.")
    return {"success":True,"path":r.data[0]}

@router.get("/paths")
def list_paths(context:PermissionContext=Depends(require_permission("courses.view"))):
    q=supabase.table("learnora_learning_paths").select("*").eq("owner_user_id",context.user_id)
    r=q.order("created_at",desc=True).execute()
    return {"success":True,"paths":r.data or []}

@router.post("/paths/{path_id}/courses",status_code=201)
def add_path_course(path_id:str,body:CourseLinkIn,context:PermissionContext=Depends(require_permission("courses.assign"))):
    p=supabase.table("learnora_learning_paths").select("owner_user_id,organisation_id").eq("id",path_id).limit(1).execute()
    if not p.data:raise HTTPException(404,"Learning path not found.")
    owner=p.data[0]
    if owner.get("owner_user_id")!=context.user_id and not context.is_platform_admin:raise HTTPException(403,"Learning path access denied.")
    r=supabase.table("learnora_learning_path_courses").upsert({"path_id":path_id,**body.model_dump()},on_conflict="path_id,course_id").execute()
    return {"success":True,"course":r.data[0] if r.data else None}

@router.post("/cohorts/{cohort_id}/members",status_code=201)
def add_cohort_member(cohort_id:str,body:CohortMemberIn,context:PermissionContext=Depends(require_permission("organisations.members"))):
    c=supabase.table("cohorts").select("id,organisation_id,capacity,status").eq("id",cohort_id).limit(1).execute()
    if not c.data:raise HTTPException(404,"Cohort not found.")
    _scope(context,c.data[0]["organisation_id"])
    if c.data[0].get("status") in {"completed","expired","closed","archived"}:raise HTTPException(409,"Cohort is no longer accepting members.")
    existing=supabase.table("cohort_members").select("id,status").eq("cohort_id",cohort_id).eq("user_id",body.user_id).limit(1).execute()
    if existing.data and existing.data[0]["status"]=="active":raise HTTPException(409,"User is already in this cohort.")
    ensure_cohort_capacity(cohort_id,1)
    if existing.data:r=supabase.table("cohort_members").update({"status":"active"}).eq("id",existing.data[0]["id"]).execute()
    else:r=supabase.table("cohort_members").insert({"cohort_id":cohort_id,"user_id":body.user_id,"status":"active"}).execute()
    if not r.data:raise HTTPException(500,"Unable to add cohort member.")
    audit(actor_user_id=context.user_id,action="cohort_member_added",resource_type="cohort_member",resource_id=r.data[0]["id"],organisation_id=c.data[0]["organisation_id"])
    return {"success":True,"member":r.data[0]}
