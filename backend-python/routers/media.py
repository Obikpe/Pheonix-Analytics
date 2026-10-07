"""Provider-neutral lesson media metadata API. Files are stored outside the Vercel app."""
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from .auth import supabase
from .permissions import PermissionContext,require_permission
from ..services.audit import audit

router=APIRouter(prefix="/api/media",tags=["Learning Media"])
class VideoIn(BaseModel):
    provider:str="supabase"
    storage_path:str|None=None
    external_video_id:str|None=None
    title:str|None=None
    duration_seconds:int|None=None
    file_size_bytes:int|None=None
    mime_type:str|None=None
    thumbnail_url:str|None=None
    status:str="pending"
    is_private:bool=True

class ResourceIn(BaseModel):
    title:str
    resource_type:str
    storage_path:str|None=None
    external_url:str|None=None
    file_size_bytes:int|None=None

def _course_for_lesson(lesson_id):
    r=supabase.table("learnora_lessons").select("id,course_modules!inner(course_id)").eq("id",lesson_id).limit(1).execute()
    if not r.data:raise HTTPException(404,"Lesson not found.")
    return r.data[0]["course_modules"]["course_id"]

@router.get("/lessons/{lesson_id}")
def lesson_media(lesson_id:str,context:PermissionContext=Depends(require_permission("courses.view"))):
    _course_for_lesson(lesson_id)
    v=supabase.table("lesson_videos").select("*").eq("lesson_id",lesson_id).order("created_at").execute()
    r=supabase.table("lesson_resources").select("*").eq("lesson_id",lesson_id).order("created_at").execute()
    return {"success":True,"videos":v.data or [],"resources":r.data or []}

@router.post("/lessons/{lesson_id}/videos",status_code=201)
def add_video(lesson_id:str,body:VideoIn,context:PermissionContext=Depends(require_permission("content.video"))):
    _course_for_lesson(lesson_id)
    if body.provider not in {"supabase","cloudflare","mux","bunny","vimeo","youtube","external","other"}:raise HTTPException(400,"Unsupported video provider.")
    r=supabase.table("lesson_videos").insert({"lesson_id":lesson_id,**body.model_dump()}).execute()
    if not r.data:raise HTTPException(500,"Unable to save video metadata.")
    audit(actor_user_id=context.user_id,action="lesson_video_added",resource_type="lesson_video",resource_id=r.data[0]["id"],metadata={"lesson_id":lesson_id,"provider":body.provider})
    return {"success":True,"video":r.data[0]}

@router.patch("/videos/{video_id}")
def update_video(video_id:str,body:VideoIn,context:PermissionContext=Depends(require_permission("content.video"))):
    r=supabase.table("lesson_videos").update(body.model_dump()).eq("id",video_id).execute()
    if not r.data:raise HTTPException(404,"Video not found.")
    return {"success":True,"video":r.data[0]}

@router.post("/lessons/{lesson_id}/resources",status_code=201)
def add_resource(lesson_id:str,body:ResourceIn,context:PermissionContext=Depends(require_permission("content.resources"))):
    _course_for_lesson(lesson_id)
    r=supabase.table("lesson_resources").insert({"lesson_id":lesson_id,**body.model_dump()}).execute()
    if not r.data:raise HTTPException(500,"Unable to save resource metadata.")
    return {"success":True,"resource":r.data[0]}
