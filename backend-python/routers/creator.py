"""Learnora creator application, courses and earnings API."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase
from .permissions import PermissionContext, require_permission

router = APIRouter(prefix="/api/creator", tags=["Creator"])


class CreatorApplicationIn(BaseModel):
    application_data: dict = Field(default_factory=dict)


class CreatorCourseIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=160)
    description: str = Field(default="", max_length=10000)
    short_description: str = Field(default="", max_length=500)
    level: str = Field(default="beginner", max_length=50)

class CreatorModuleIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(default="", max_length=3000)
    order_index: int = Field(default=0, ge=0)


class CreatorLessonIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    content: str = Field(..., min_length=20, max_length=20000)
    description: str = Field(default="", max_length=3000)
    lesson_type: str = Field(default="article", max_length=30)
    duration_minutes: int | None = Field(default=None, ge=0)
    order_index: int = Field(default=0, ge=0)


def _normalise_slug(value: str) -> str:
    return "-".join(value.strip().lower().split())


def _get_creator(user_id: str):
    result = (
        supabase
        .table("learnora_creator_accounts")
        .select("id,user_id,status,display_name,bio,payout_currency,commission_rate,approved_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


@router.post("/apply", status_code=201)
def apply(
    body: CreatorApplicationIn,
    user: CurrentUser = Depends(get_current_user),
):
    existing = (
        supabase
        .table("learnora_creator_applications")
        .select("id,status")
        .eq("user_id", user.id)
        .in_("status", ["submitted", "under_review", "approved"])
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(409, "You already have an active creator application.")

    account = _get_creator(str(user.id))
    if account and account["status"] in {"application", "approved", "suspended"}:
        raise HTTPException(409, "A creator account already exists for this user.")

    result = (
        supabase
        .table("learnora_creator_applications")
        .insert({
            "user_id": user.id,
            "application_data": body.application_data,
            "status": "submitted",
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to submit creator application.")

    return {"success": True, "application": result.data[0]}


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    applications = (
        supabase
        .table("learnora_creator_applications")
        .select("id,status,application_data,created_at,reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    application = applications.data[0] if applications.data else None
    if not creator:
        return {"success": True, "creator": None, "application": application, "sales": []}

    sales = (
        supabase
        .table("learnora_creator_sales")
        .select("*")
        .eq("creator_id", creator["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "creator": creator, "application": application, "sales": sales.data or []}


@router.get("/courses")
def list_creator_courses(user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator or creator.get("status") not in {"approved", "active"}:
        return {"success": True, "creator": creator, "courses": []}
    result = (
        supabase
        .table("learnora_courses")
        .select("id,title,slug,short_description,description,level,status,ownership,thumbnail_url,estimated_hours,created_at,updated_at")
        .eq("creator_id", creator["id"])
        .eq("ownership", "creator")
        .order("created_at", desc=True)
        .execute()
    )
    courses = result.data or []
    course_ids = [row["id"] for row in courses]
    modules = (
        supabase.table("course_modules")
        .select("id,course_id,title,description,order_index,status")
        .in_("course_id", course_ids)
        .neq("status", "archived")
        .order("order_index")
        .execute()
    ).data or [] if course_ids else []
    module_ids = [row["id"] for row in modules]
    lessons = (
        supabase.table("learnora_lessons")
        .select("id,module_id,title,description,content,lesson_type,duration_minutes,order_index,status")
        .in_("module_id", module_ids)
        .neq("status", "archived")
        .order("order_index")
        .execute()
    ).data or [] if module_ids else []
    lessons_by_module = {}
    for lesson in lessons:
        lessons_by_module.setdefault(str(lesson["module_id"]), []).append(lesson)
    modules_by_course = {}
    for module in modules:
        module["lessons"] = lessons_by_module.get(str(module["id"]), [])
        modules_by_course.setdefault(str(module["course_id"]), []).append(module)
    return {
        "success": True,
        "courses": [{**course, "modules": modules_by_course.get(str(course["id"]), [])} for course in courses],
    }


@router.post("/courses", status_code=201)
def create_course(
    body: CreatorCourseIn,
    user: CurrentUser = Depends(get_current_user),
):
    creator = _get_creator(str(user.id))
    if not creator or creator["status"] != "approved":
        raise HTTPException(403, "Approved creator account required.")

    slug = _normalise_slug(body.slug)
    if not slug:
        raise HTTPException(400, "Course slug is required.")
    if body.level.strip().lower() not in {"beginner", "intermediate", "advanced", "mixed"}:
        raise HTTPException(400, "Course level must be beginner, intermediate, advanced or mixed.")

    existing = (
        supabase
        .table("learnora_courses")
        .select("id")
        .is_("organisation_id", "null")
        .eq("ownership", "creator")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(409, "That course slug is already in use.")

    result = (
        supabase
        .table("learnora_courses")
        .insert({
            "title": body.title.strip(),
            "slug": slug,
            "description": body.description.strip() or None,
            "short_description": body.short_description.strip() or None,
            "level": body.level.strip().lower(),
            "status": "draft",
            "ownership": "creator",
            "creator_id": creator["id"],
            "created_by": user.id,
            "settings": {"is_free": True, "access_type": "free"},
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to create creator course.")

    return {"success": True, "course": result.data[0]}


@router.post("/courses/{course_id}/modules", status_code=201)
def create_creator_module(course_id: str, body: CreatorModuleIn, user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator or creator.get("status") != "approved":
        raise HTTPException(403, "Approved creator account required.")
    course = (supabase.table("learnora_courses").select("id,status").eq("id", course_id).eq("creator_id", creator["id"]).eq("ownership", "creator").limit(1).execute()).data
    if not course:
        raise HTTPException(404, "Creator course not found.")
    if course[0].get("status") != "draft":
        raise HTTPException(409, "Only draft courses can be edited.")
    result = supabase.table("course_modules").insert({
        "course_id": course_id, "title": body.title.strip(),
        "description": body.description.strip() or None,
        "order_index": body.order_index, "status": "draft",
    }).execute()
    if not result.data:
        raise HTTPException(500, "Module could not be created.")
    return {"success": True, "module": result.data[0]}


@router.post("/modules/{module_id}/lessons", status_code=201)
def create_creator_lesson(module_id: str, body: CreatorLessonIn, user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator or creator.get("status") != "approved":
        raise HTTPException(403, "Approved creator account required.")
    module = (supabase.table("course_modules").select("id,course_id").eq("id", module_id).limit(1).execute()).data
    if not module:
        raise HTTPException(404, "Module not found.")
    course = (supabase.table("learnora_courses").select("id,status").eq("id", module[0]["course_id"]).eq("creator_id", creator["id"]).eq("ownership", "creator").limit(1).execute()).data
    if not course:
        raise HTTPException(404, "Creator course not found.")
    if course[0].get("status") != "draft":
        raise HTTPException(409, "Only draft courses can be edited.")
    if body.lesson_type not in {"article", "text", "practice", "mixed"}:
        raise HTTPException(400, "Lesson type must be article, text, practice or mixed.")
    slug = _normalise_slug(body.title)
    result = supabase.table("learnora_lessons").insert({
        "module_id": module_id, "title": body.title.strip(), "slug": slug,
        "description": body.description.strip() or None, "content": body.content.strip(),
        "lesson_type": body.lesson_type, "duration_minutes": body.duration_minutes,
        "order_index": body.order_index, "is_preview": False, "status": "draft",
    }).execute()
    if not result.data:
        raise HTTPException(500, "Lesson could not be created.")
    return {"success": True, "lesson": result.data[0]}


@router.post("/courses/{course_id}/publish")
def publish_creator_course(course_id: str, user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator or creator.get("status") != "approved":
        raise HTTPException(403, "Approved creator account required.")
    course = (supabase.table("learnora_courses").select("id,status,settings").eq("id", course_id).eq("creator_id", creator["id"]).eq("ownership", "creator").limit(1).execute()).data
    if not course:
        raise HTTPException(404, "Creator course not found.")
    if course[0].get("status") == "published":
        return {"success": True, "course": course[0], "already_published": True}
    modules = (supabase.table("course_modules").select("id,title").eq("course_id", course_id).neq("status", "archived").order("order_index").execute()).data or []
    if not modules:
        raise HTTPException(409, "Add at least one module before publishing.")
    module_ids = [row["id"] for row in modules]
    lessons = (supabase.table("learnora_lessons").select("id,module_id,title,content,status").in_("module_id", module_ids).neq("status", "archived").order("order_index").execute()).data or []
    if not lessons:
        raise HTTPException(409, "Add at least one lesson before publishing.")
    lesson_counts = {str(module_id): 0 for module_id in module_ids}
    for lesson in lessons:
        lesson_counts[str(lesson["module_id"])] = lesson_counts.get(str(lesson["module_id"]), 0) + 1
        if not str(lesson.get("content") or "").strip():
            raise HTTPException(409, "Every lesson needs written content before this course can be published.")
    if any(count == 0 for count in lesson_counts.values()):
        raise HTTPException(409, "Every module must contain at least one lesson before publishing.")
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("course_modules").update({"status": "published", "updated_at": now}).eq("course_id", course_id).neq("status", "archived").execute()
    supabase.table("learnora_lessons").update({"status": "published", "updated_at": now}).in_("module_id", module_ids).neq("status", "archived").execute()
    updated = supabase.table("learnora_courses").update({"status": "published", "updated_at": now}).eq("id", course_id).eq("creator_id", creator["id"]).execute()
    if not updated.data:
        raise HTTPException(500, "Course could not be published.")
    return {"success": True, "course": updated.data[0]}


@router.get("/earnings")
def earnings(user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator:
        raise HTTPException(404, "Creator account not found.")

    result = (
        supabase
        .table("learnora_creator_ledger")
        .select("*")
        .eq("creator_id", creator["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "ledger": result.data or []}


@router.post("/admin/applications/{application_id}/review")
def review_application(
    application_id: str,
    status: str,
    context: PermissionContext = Depends(
        require_permission("users.update")
    ),
):
    if status not in {"approved", "declined"}:
        raise HTTPException(400, "Status must be approved or declined.")

    application = (
        supabase
        .table("learnora_creator_applications")
        .select("*")
        .eq("id", application_id)
        .limit(1)
        .execute()
    )
    if not application.data:
        raise HTTPException(404, "Creator application not found.")

    row = application.data[0]
    now = datetime.now(timezone.utc).isoformat()

    updated = (
        supabase
        .table("learnora_creator_applications")
        .update({
            "status": status,
            "reviewed_by": context.user_id,
            "reviewed_at": now,
        })
        .eq("id", application_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(500, "Unable to update creator application.")

    if status == "approved":
        existing = (
            supabase
            .table("learnora_creator_accounts")
            .select("id")
            .eq("user_id", row["user_id"])
            .limit(1)
            .execute()
        )

        application_data = row.get("application_data") or {}
        payload = {
            "user_id": row["user_id"],
            "status": "approved",
            "approved_by": context.user_id,
            "approved_at": now,
            "application_id": application_id,
            "display_name": str(application_data.get("display_name") or "").strip() or None,
            "bio": str(application_data.get("bio") or "").strip() or None,
        }

        if existing.data:
            account = (
                supabase
                .table("learnora_creator_accounts")
                .update(payload)
                .eq("id", existing.data[0]["id"])
                .execute()
            )
        else:
            account = (
                supabase
                .table("learnora_creator_accounts")
                .insert(payload)
                .execute()
            )

        if not account.data:
            raise HTTPException(500, "Creator account activation failed.")

    return {"success": True, "status": status}
