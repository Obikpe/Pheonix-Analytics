"""Learning evidence, skills and credentials API."""
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from .auth import CurrentUser,get_current_user,supabase
from .permissions import PermissionContext,require_permission

router=APIRouter(prefix="/api/evidence",tags=["Learning Evidence"])

class EvidenceIn(BaseModel):
    skill_id:str
    evidence_type:str
    source_id:str|None=None
    score:float|None=None
    notes:str|None=None

class ProjectSubmissionIn(BaseModel):
    title:str|None=None
    description:str|None=None
    repository_url:str|None=None
    live_url:str|None=None
    submission_url:str|None=None

@router.get("/me")
def my_evidence(user:CurrentUser=Depends(get_current_user)):
    skills=supabase.table("learner_skills").select("*").eq("user_id",user.id).execute()
    evidence=supabase.table("skill_evidence").select("*").eq("user_id",user.id).order("created_at",desc=True).execute()
    badges=supabase.table("learner_badges").select("*").eq("user_id",user.id).execute()
    certificates=supabase.table("certificates").select("*").eq("user_id",user.id).order("issued_at",desc=True).execute()
    return {"success":True,"skills":skills.data or [],"evidence":evidence.data or [],"badges":badges.data or [],"certificates":certificates.data or []}

@router.post("/me",status_code=201)
def add_evidence(body:EvidenceIn,user:CurrentUser=Depends(get_current_user)):
    r=supabase.table("skill_evidence").insert({"user_id":user.id,**body.model_dump()}).execute()
    if not r.data:raise HTTPException(500,"Unable to save skill evidence.")
    return {"success":True,"evidence":r.data[0]}

@router.post("/projects/{project_id}/submissions",status_code=201)
def submit_project(project_id:str,body:ProjectSubmissionIn,user:CurrentUser=Depends(get_current_user)):
    project=supabase.table("projects").select("id").eq("id",project_id).limit(1).execute()
    if not project.data:raise HTTPException(404,"Project not found.")
    r=supabase.table("project_submissions").insert({"project_id":project_id,"user_id":user.id,**body.model_dump(),"status":"submitted","submitted_at":"now()"}).execute()
    if not r.data:raise HTTPException(500,"Unable to save project submission.")
    return {"success":True,"submission":r.data[0]}
