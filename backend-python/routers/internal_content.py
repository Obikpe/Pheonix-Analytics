from fastapi import APIRouter, Depends
from .auth import supabase
from .internal_auth import InternalStaffContext, require_internal_permission

router = APIRouter(prefix="/api/internal/content", tags=["Internal Content"])

@router.get("/courses")
def courses(staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    rows = supabase.table("learnora_courses").select("id,title,slug,organisation_id,ownership,status,created_at,updated_at").order("created_at", desc=True).execute()
    return {"success": True, "courses": rows.data or []}

@router.get("/courses/{course_id}/modules")
def modules(course_id: str, staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    rows = supabase.table("course_modules").select("*").eq("course_id", course_id).order("order_index").execute()
    return {"success": True, "modules": rows.data or []}

@router.get("/modules/{module_id}/lessons")
def lessons(module_id: str, staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    rows = supabase.table("learnora_lessons").select("*").eq("module_id", module_id).order("order_index").execute()
    return {"success": True, "lessons": rows.data or []}

@router.get("/lessons/{lesson_id}")
def lesson(lesson_id: str, staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    row = supabase.table("learnora_lessons").select("*").eq("id", lesson_id).limit(1).execute()
    return {"success": True, "lesson": (row.data or [None])[0]}

@router.get("/lessons/{lesson_id}/media")
def lesson_media(lesson_id: str, staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    videos = supabase.table("lesson_videos").select("*").eq("lesson_id", lesson_id).order("created_at", desc=True).execute()
    resources = supabase.table("lesson_resources").select("*").eq("lesson_id", lesson_id).order("created_at", desc=True).execute()
    return {"success": True, "videos": videos.data or [], "resources": resources.data or []}
