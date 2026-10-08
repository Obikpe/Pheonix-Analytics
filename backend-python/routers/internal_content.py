from fastapi import APIRouter, Depends, HTTPException
import re
import secrets
from .auth import supabase
from .internal_auth import InternalStaffContext, require_internal_permission
from pydantic import BaseModel, Field
from typing import Optional, Literal

router = APIRouter(prefix="/api/internal/content", tags=["Internal Content"])

@router.get("/courses")
def courses(staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    rows = supabase.table("learnora_courses").select("id,title,slug,organisation_id,ownership,status,created_at,updated_at").order("created_at", desc=True).execute()
    return {"success": True, "courses": rows.data or []}

class CourseWrite(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=200)
    short_description: Optional[str] = Field(None, max_length=1000)
    description: Optional[str] = Field(None, max_length=10000)
    level: Optional[str] = Field(None, max_length=40)
    status: Optional[Literal["draft", "published", "archived"]] = None
    ownership: Optional[str] = Field(None, max_length=40)
    thumbnail_url: Optional[str] = Field(None, max_length=2000)
    estimated_hours: Optional[float] = Field(None, ge=0)

@router.get("/courses/{course_id}")
def get_course(course_id: str, staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    row = supabase.table("learnora_courses").select("*").eq("id", course_id).limit(1).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Course not found.")
    return {"success": True, "course": row.data[0]}

@router.patch("/courses/{course_id}")
def update_course(course_id: str, payload: CourseWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    if not supabase.table("learnora_courses").select("id").eq("id", course_id).limit(1).execute().data:
        raise HTTPException(status_code=404, detail="Course not found.")
    data = payload.model_dump(exclude_unset=True)
    for key in ("title", "slug", "short_description", "description", "level", "ownership", "thumbnail_url"):
        if key in data and isinstance(data[key], str):
            data[key] = data[key].strip() or None
    if data.get("slug"):
        data["slug"] = data["slug"].lower().replace(" ", "-")
        duplicate = supabase.table("learnora_courses").select("id").eq("slug", data["slug"]).neq("id", course_id).limit(1).execute()
        if duplicate.data:
            raise HTTPException(status_code=400, detail="A course with this slug already exists.")
    if not data:
        raise HTTPException(status_code=400, detail="No changes supplied.")
    row = supabase.table("learnora_courses").update(data).eq("id", course_id).execute()
    if not row.data:
        raise HTTPException(status_code=500, detail="Course update failed.")
    return {"success": True, "course": row.data[0]}

@router.post("/courses/{course_id}/archive")
def archive_course(course_id: str, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    row = supabase.table("learnora_courses").update({"status": "archived"}).eq("id", course_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Course not found.")
    return {"success": True, "course": row.data[0]}

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
from typing import Optional, Literal

class ModuleWrite(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    status: Optional[Literal["draft", "published", "archived"]] = None

class LessonWrite(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    lesson_type: Optional[Literal["video", "article", "text", "practice", "quiz", "assignment", "project", "mixed"]] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_preview: Optional[bool] = None
    status: Optional[Literal["draft", "published", "archived"]] = None

class ReorderItem(BaseModel):
    id: str
    order_index: int = Field(..., ge=0)

class VideoUploadRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: Literal["video/mp4", "video/webm", "video/quicktime", "video/mpeg", "video/x-msvideo"]
    file_size_bytes: int = Field(..., gt=0, le=2147483648)
    title: Optional[str] = Field(None, max_length=200)

class VideoWrite(BaseModel):
    provider: Literal["supabase", "cloudflare", "mux", "bunny", "vimeo", "youtube", "external", "other"] = "supabase"
    storage_path: Optional[str] = None
    external_video_id: Optional[str] = None
    title: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    file_size_bytes: Optional[int] = Field(None, ge=0)
    mime_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str = "pending"
    is_private: bool = True

class ResourceWrite(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    resource_type: str = Field(..., min_length=1, max_length=80)
    storage_path: Optional[str] = None
    external_url: Optional[str] = None
    file_size_bytes: Optional[int] = Field(None, ge=0)

def _course_for_module(module_id: str):
    row = supabase.table("course_modules").select("id,course_id").eq("id", module_id).limit(1).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Module not found.")
    return row.data[0]

def _module_for_lesson(lesson_id: str):
    row = supabase.table("learnora_lessons").select("id,module_id").eq("id", lesson_id).limit(1).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return row.data[0]

@router.post("/courses/{course_id}/modules")
def create_module(course_id: str, payload: ModuleWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    if not payload.title:
        raise HTTPException(status_code=400, detail="title is required")
    course = supabase.table("learnora_courses").select("id").eq("id", course_id).limit(1).execute()
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found.")
    row = supabase.table("course_modules").insert({"course_id": course_id, "title": payload.title.strip(), "description": payload.description, "order_index": payload.order_index or 0, "status": payload.status or "draft"}).execute()
    if not row.data:
        raise HTTPException(status_code=500, detail="Module creation returned no record.")
    return {"success": True, "module": row.data[0]}

@router.patch("/modules/{module_id}")
def update_module(module_id: str, payload: ModuleWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    _course_for_module(module_id)
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"]:
        data["title"] = data["title"].strip()
    if not data:
        raise HTTPException(status_code=400, detail="No changes supplied.")
    row = supabase.table("course_modules").update(data).eq("id", module_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Module not found.")
    return {"success": True, "module": row.data[0]}

@router.post("/modules/{module_id}/lessons")
def create_lesson(module_id: str, payload: LessonWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    if not payload.title:
        raise HTTPException(status_code=400, detail="title is required")
    _course_for_module(module_id)
    row = supabase.table("learnora_lessons").insert({"module_id": module_id, "title": payload.title.strip(), "slug": payload.slug, "description": payload.description, "order_index": payload.order_index or 0, "lesson_type": payload.lesson_type or "mixed", "content": payload.content, "duration_minutes": payload.duration_minutes, "is_preview": payload.is_preview or False, "status": payload.status or "draft"}).execute()
    if not row.data:
        raise HTTPException(status_code=500, detail="Lesson creation returned no record.")
    return {"success": True, "lesson": row.data[0]}

@router.patch("/lessons/{lesson_id}")
def update_lesson(lesson_id: str, payload: LessonWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    _module_for_lesson(lesson_id)
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"]:
        data["title"] = data["title"].strip()
    if not data:
        raise HTTPException(status_code=400, detail="No changes supplied.")
    row = supabase.table("learnora_lessons").update(data).eq("id", lesson_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return {"success": True, "lesson": row.data[0]}

@router.post("/modules/{module_id}/archive")
def archive_module(module_id: str, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    _course_for_module(module_id)
    row = supabase.table("course_modules").update({"status": "archived"}).eq("id", module_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Module not found.")
    return {"success": True, "module": row.data[0]}

@router.post("/lessons/{lesson_id}/archive")
def archive_lesson(lesson_id: str, staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    _module_for_lesson(lesson_id)
    row = supabase.table("learnora_lessons").update({"status": "archived"}).eq("id", lesson_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return {"success": True, "lesson": row.data[0]}

@router.patch("/courses/{course_id}/modules/reorder")
def reorder_modules(course_id: str, items: list[ReorderItem], staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    course = supabase.table("learnora_courses").select("id").eq("id", course_id).limit(1).execute()
    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found.")
    for item in items:
        supabase.table("course_modules").update({"order_index": item.order_index}).eq("id", item.id).eq("course_id", course_id).execute()
    return {"success": True}

@router.patch("/modules/{module_id}/lessons/reorder")
def reorder_lessons(module_id: str, items: list[ReorderItem], staff: InternalStaffContext = Depends(require_internal_permission("content.manage"))):
    _course_for_module(module_id)
    for item in items:
        supabase.table("learnora_lessons").update({"order_index": item.order_index}).eq("id", item.id).eq("module_id", module_id).execute()
    return {"success": True}

@router.post("/lessons/{lesson_id}/video-upload")
def create_video_upload(
    lesson_id: str,
    payload: VideoUploadRequest,
    staff: InternalStaffContext = Depends(require_internal_permission("content.video")),
):
    lesson = supabase.table("learnora_lessons").select("id,module_id").eq("id", lesson_id).limit(1).execute()
    if not lesson.data:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    module = supabase.table("course_modules").select("id,course_id").eq("id", lesson.data[0]["module_id"]).limit(1).execute()
    if not module.data:
        raise HTTPException(status_code=404, detail="Parent module not found.")
    course_id = str(module.data[0]["course_id"])
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "-", payload.filename.strip()).strip(".-") or "video"
    path = f"courses/{course_id}/lessons/{lesson_id}/{secrets.token_hex(12)}-{safe_name}"
    try:
        response = supabase.storage.from_("learnora-course-media").create_signed_upload_url(
            path,
            options={"upsert": "false"},
        )
        data = getattr(response, "data", None) or response
        if isinstance(data, dict):
            token = data.get("token")
            signed_url = data.get("signedUrl") or data.get("signed_url")
            response_path = data.get("path") or path
        else:
            token = getattr(data, "token", None)
            signed_url = getattr(data, "signed_url", None) or getattr(data, "signedUrl", None)
            response_path = getattr(data, "path", None) or path
        if not token:
            raise RuntimeError("Supabase did not return an upload token.")
        return {
            "success": True,
            "bucket": "learnora-course-media",
            "path": response_path,
            "token": token,
            "signed_url": signed_url,
            "title": payload.title or payload.filename,
            "content_type": payload.content_type,
            "file_size_bytes": payload.file_size_bytes,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unable to create video upload URL: {str(exc)}")

@router.post("/lessons/{lesson_id}/videos")
def create_video(lesson_id: str, payload: VideoWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.video"))):
    _module_for_lesson(lesson_id)
    row = supabase.table("lesson_videos").insert({"lesson_id": lesson_id, **payload.model_dump()}).execute()
    if not row.data:
        raise HTTPException(status_code=500, detail="Video metadata could not be saved.")
    return {"success": True, "video": row.data[0]}

@router.patch("/videos/{video_id}")
def update_video(video_id: str, payload: VideoWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.video"))):
    row = supabase.table("lesson_videos").update(payload.model_dump()).eq("id", video_id).execute()
    if not row.data:
        raise HTTPException(status_code=404, detail="Video not found.")
    return {"success": True, "video": row.data[0]}

@router.post("/lessons/{lesson_id}/resources")
def create_resource(lesson_id: str, payload: ResourceWrite, staff: InternalStaffContext = Depends(require_internal_permission("content.resources"))):
    _module_for_lesson(lesson_id)
    row = supabase.table("lesson_resources").insert({"lesson_id": lesson_id, **payload.model_dump()}).execute()
    if not row.data:
        raise HTTPException(status_code=500, detail="Resource metadata could not be saved.")
    return {"success": True, "resource": row.data[0]}
