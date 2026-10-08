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


from pydantic import BaseModel, Field
from typing import Optional

class ModuleWrite(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None

class LessonWrite(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    lesson_type: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_preview: Optional[bool] = None
    status: Optional[str] = None

@router.post("/courses/{course_id}/modules")
def create_module(course_id: str, payload: ModuleWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    if not payload.title:
        raise ValueError("title is required")
    row = supabase.table("course_modules").insert({
        "course_id": course_id,
        "title": payload.title.strip(),
        "description": payload.description,
        "order_index": payload.order_index or 0,
        "status": payload.status or "draft",
    }).execute()
    return {"success": True, "module": (row.data or [None])[0]}

@router.patch("/modules/{module_id}")
def update_module(module_id: str, payload: ModuleWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"]:
        data["title"] = data["title"].strip()
    if not data:
        return {"success": True, "module": (supabase.table("course_modules").select("*").eq("id", module_id).limit(1).execute().data or [None])[0]}
    row = supabase.table("course_modules").update(data).eq("id", module_id).execute()
    return {"success": True, "module": (row.data or [None])[0]}

@router.post("/modules/{module_id}/lessons")
def create_lesson(module_id: str, payload: LessonWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    if not payload.title:
        raise ValueError("title is required")
    row = supabase.table("learnora_lessons").insert({
        "module_id": module_id,
        "title": payload.title.strip(),
        "slug": payload.slug,
        "description": payload.description,
        "order_index": payload.order_index or 0,
        "lesson_type": payload.lesson_type or "mixed",
        "content": payload.content,
        "duration_minutes": payload.duration_minutes,
        "is_preview": payload.is_preview or False,
        "status": payload.status or "draft",
    }).execute()
    return {"success": True, "lesson": (row.data or [None])[0]}

@router.patch("/lessons/{lesson_id}")
def update_lesson(lesson_id: str, payload: LessonWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"]:
        data["title"] = data["title"].strip()
    if not data:
        return {"success": True, "lesson": (supabase.table("learnora_lessons").select("*").eq("id", lesson_id).limit(1).execute().data or [None])[0]}
    row = supabase.table("learnora_lessons").update(data).eq("id", lesson_id).execute()
    return {"success": True, "lesson": (row.data or [None])[0]}

@router.post("/modules/{module_id}/archive")
def archive_module(module_id: str, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    row = supabase.table("course_modules").update({"status":"archived"}).eq("id", module_id).execute()
    return {"success": True, "module": (row.data or [None])[0]}

@router.post("/lessons/{lesson_id}/archive")
def archive_lesson(lesson_id: str, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    row = supabase.table("learnora_lessons").update({"status":"archived"}).eq("id", lesson_id).execute()
    return {"success": True, "lesson": (row.data or [None])[0]}
