"""
Learnora V1 - Course Content API

Handles:
- Course modules
- Course lessons
- Module ordering
- Lesson ordering
- Publishing / archiving content

Architecture:
- Courses belong to Learnora or an organisation.
- Course access is separate from course ownership.
- Content permissions are enforced through the Learnora permission system.
- No organisation or academy is hard-coded.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import supabase
from services.notification_service import notify_course_updated
from .permissions import (
    PermissionContext,
    get_permission_context,
    require_permission,
)


router = APIRouter(
    prefix="/api/course-content",
    tags=["Course Content"],
)


# ============================================================
# MODELS
# ============================================================

class CreateModule(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    order_index: int = Field(default=0, ge=0)
    status: str = "published"


class UpdateModule(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None


class CreateLesson(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    order_index: int = Field(default=0, ge=0)
    lesson_type: str = "mixed"
    content: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_preview: bool = False
    status: str = "draft"


class UpdateLesson(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = Field(None, ge=0)
    lesson_type: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_preview: Optional[bool] = None
    status: Optional[str] = None


class ReorderItem(BaseModel):
    id: UUID
    order_index: int = Field(..., ge=0)


# ============================================================
# CONSTANTS
# ============================================================

MODULE_STATUSES = {
    "draft",
    "published",
    "archived",
}

LESSON_STATUSES = {
    "draft",
    "published",
    "archived",
}

LESSON_TYPES = {
    "video",
    "article",
    "text",
    "practice",
    "quiz",
    "assignment",
    "project",
    "mixed",
}


# ============================================================
# HELPERS
# ============================================================

def _get_course(course_id: str):
    try:
        result = (
            supabase
            .table("learnora_courses")
            .select(
                "id,"
                "organisation_id,"
                "title,"
                "slug,"
                "short_description,"
                "description,"
                "level,"
                "settings,"
                "ownership,"
                "status"
            )
            .eq("id", course_id)
            .limit(1)
            .execute()
        )

        records = result.data or []
        return records[0] if records else None

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load course: {str(exc)}",
        )


def _get_module(module_id: str):
    try:
        result = (
            supabase
            .table("course_modules")
            .select(
                "id,"
                "course_id,"
                "title,"
                "description,"
                "order_index,"
                "status,"
                "created_at,"
                "updated_at"
            )
            .eq("id", module_id)
            .limit(1)
            .execute()
        )

        records = result.data or []
        return records[0] if records else None

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load module: {str(exc)}",
        )


def _get_lesson(lesson_id: str):
    try:
        result = (
            supabase
            .table("learnora_lessons")
            .select(
                "id,"
                "module_id,"
                "title,"
                "slug,"
                "description,"
                "order_index,"
                "lesson_type,"
                "content,"
                "duration_minutes,"
                "is_preview,"
                "status,"
                "created_at,"
                "updated_at"
            )
            .eq("id", lesson_id)
            .limit(1)
            .execute()
        )

        records = result.data or []
        return records[0] if records else None

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load lesson: {str(exc)}",
        )


def _check_course_access(
    context: PermissionContext,
    course: dict,
):
    """
    Verify that the current organisation context is allowed
    to operate on the course.

    Platform admins may operate globally.

    Organisation users may operate on organisation-owned
    courses belonging to their organisation.

    Learnora-owned courses are controlled by Learnora.
    Organisation users may consume them through course_access,
    but do not modify the central Learnora course content.
    """

    if context.is_platform_admin:
        return

    organisation_id = context.organisation_id

    if not organisation_id:
        raise HTTPException(
            status_code=403,
            detail="An organisation context is required.",
        )

    course_org = course.get("organisation_id")

    if course.get("ownership") == "learnora":
        raise HTTPException(
            status_code=403,
            detail=(
                "This is a Learnora-owned course. "
                "Organisation users cannot modify its content."
            ),
        )

    if str(course_org) != str(organisation_id):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this course.",
        )


def _has_active_scoped_course_source(user_id: str, organisation_id: str, course_id: str, enrolment: dict) -> bool:
    """Require a live, tenant-scoped source for organisation-scoped enrolments.

    Organisation-wide grants are handled separately by course_access.access_type
    == 'assigned'. Explicit individual assignments remain valid; team/cohort
    enrolments remain valid only while the learner has a matching active
    membership and the team/cohort still has this course assigned.
    """
    if str(enrolment.get("source_type") or "").strip().lower() == "individual_assignment":
        return True

    learner_membership = (
        supabase.table("organisation_members")
        .select("id")
        .eq("organisation_id", organisation_id)
        .eq("user_id", user_id)
        .eq("role", "learner")
        .eq("status", "active")
        .limit(1)
        .execute()
    ).data or []
    if not learner_membership:
        return False

    cohort_memberships = (
        supabase.table("cohort_members")
        .select("cohort_id")
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    ).data or []
    cohort_ids = list({str(row["cohort_id"]) for row in cohort_memberships if row.get("cohort_id")})
    if cohort_ids:
        valid_cohorts = (
            supabase.table("cohorts")
            .select("id")
            .eq("organisation_id", organisation_id)
            .in_("id", cohort_ids)
            .in_("status", ["draft", "upcoming", "active", "ending"])
            .execute()
        ).data or []
        valid_cohort_ids = [str(row["id"]) for row in valid_cohorts]
        if valid_cohort_ids:
            cohort_assignments = (
                supabase.table("cohort_course_assignments")
                .select("id")
                .in_("cohort_id", valid_cohort_ids)
                .eq("course_id", course_id)
                .eq("status", "active")
                .limit(1)
                .execute()
            ).data or []
            if cohort_assignments:
                return True

    team_memberships = (
        supabase.table("organisation_team_members")
        .select("team_id")
        .eq("user_id", user_id)
        .eq("status", "active")
        .execute()
    ).data or []
    team_ids = list({str(row["team_id"]) for row in team_memberships if row.get("team_id")})
    if team_ids:
        valid_teams = (
            supabase.table("organisation_teams")
            .select("id")
            .eq("organisation_id", organisation_id)
            .eq("status", "active")
            .in_("id", team_ids)
            .execute()
        ).data or []
        valid_team_ids = [str(row["id"]) for row in valid_teams]
        if valid_team_ids:
            team_assignments = (
                supabase.table("team_course_assignments")
                .select("id")
                .in_("team_id", valid_team_ids)
                .eq("course_id", course_id)
                .eq("status", "active")
                .limit(1)
                .execute()
            ).data or []
            if team_assignments:
                return True

    return False


def _check_course_view_access(
    context: PermissionContext,
    course: dict,
):
    """
    Authorise reading course content without confusing ownership with access.

    Platform admins may read globally. Organisation-owned content is limited
    to its owning organisation. Learnora-owned content requires an active
    organisation course-access grant or an active individual enrolment.
    """
    if context.is_platform_admin:
        return

    course_id = str(course.get("id") or "")
    ownership = str(course.get("ownership") or "").strip().lower()
    course_org = course.get("organisation_id")
    organisation_id = context.organisation_id

    # Organisation/creator-owned content must never cross an organisation
    # boundary. A user with no organisation can only access an unscoped course
    # through an individual enrolment below.
    if ownership != "learnora":
        if course_org is not None:
            if not organisation_id or str(course_org) != str(organisation_id):
                raise HTTPException(403, "You do not have access to this course.")
            role = (context.organisation_role or "").strip().lower()
            legacy_role = str(getattr(context.user, "role", "") or "").strip().lower()
            if role not in {"learner"} and legacy_role not in {"normal", "witstart", "learner"}:
                return
            grant = (
                supabase.table("course_access")
                .select("id")
                .eq("course_id", course_id)
                .eq("organisation_id", str(organisation_id))
                .eq("status", "active")
                .eq("access_type", "assigned")
                .limit(1)
                .execute()
            ).data or []
            enrolments = (
                supabase.table("learnora_enrolments")
                .select("id,source_type,cohort_id,organisation_id,status")
                .eq("course_id", course_id)
                .eq("user_id", str(context.user_id))
                .eq("organisation_id", str(organisation_id))
                .in_("status", ["active", "completed"])
                .limit(20)
                .execute()
            ).data or []
            if grant:
                return
            if any(_has_active_scoped_course_source(str(context.user_id), str(organisation_id), course_id, row) for row in enrolments):
                return
            raise HTTPException(403, "You are not enrolled in or assigned to this course.")

    # Learnora-owned catalogue content is available to an organisation only
    # when that organisation has an active course-access record.
    if ownership == "learnora" and organisation_id:
        try:
            access_result = (
                supabase
                .table("course_access")
                .select("id")
                .eq("course_id", course_id)
                .eq("organisation_id", str(organisation_id))
                .eq("status", "active")
                .eq("access_type", "assigned")
                .limit(1)
                .execute()
            )
        except Exception:
            # Fail closed if the access grant cannot be verified.
            raise HTTPException(
                status_code=503,
                detail="Course access could not be verified.",
            )

        if access_result.data:
            return

    # Preserve individual course enrolments, including enrolments without an
    # organisation. Never accept an enrolment scoped to a different tenant.
    user_id = context.user_id
    if user_id:
        try:
            enrolment_result = (
                supabase
                .table("learnora_enrolments")
                .select("id,organisation_id,source_type,cohort_id,status")
                .eq("course_id", course_id)
                .eq("user_id", str(user_id))
                .in_("status", ["active", "completed"])
                .limit(20)
                .execute()
            )
        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Course enrolment could not be verified.",
            )

        for enrolment in enrolment_result.data or []:
            enrolment_org = enrolment.get("organisation_id")
            if organisation_id:
                if enrolment_org is None:
                    return
                if str(enrolment_org) == str(organisation_id) and _has_active_scoped_course_source(
                    str(user_id), str(organisation_id), course_id, enrolment
                ):
                    return
            elif enrolment_org is None:
                return

    raise HTTPException(
        status_code=403,
        detail="You do not have access to this course.",
    )


def _assert_module_unlocked(context: PermissionContext, module: dict):
    """Learners must pass every prior module assessment at 70% or higher."""
    if context.is_platform_admin:
        return
    role = (context.organisation_role or "").strip().lower()
    legacy_role = str(getattr(context.user, "role", "") or "").strip().lower()
    if role != "learner" and legacy_role not in {"normal", "witstart", "learner"}:
        return

    previous_modules = (
        supabase.table("course_modules")
        .select("id,title,order_index")
        .eq("course_id", str(module["course_id"]))
        .lt("order_index", module["order_index"])
        .neq("status", "archived")
        .order("order_index")
        .execute()
    ).data or []
    for previous in previous_modules:
        quizzes = (
            supabase.table("quizzes")
            .select("id")
            .eq("module_id", str(previous["id"]))
            .eq("is_published", True)
            .execute()
        ).data or []
        if not quizzes:
            raise HTTPException(
                status_code=409,
                detail=f'Module "{previous.get("title") or "previous module"}" has no published assessment yet.',
            )
        for quiz in quizzes:
            attempts = (
                supabase.table("quiz_attempts")
                .select("id")
                .eq("quiz_id", str(quiz["id"]))
                .eq("user_id", str(context.user_id))
                .eq("passed", True)
                .gte("score", 70)
                .limit(1)
                .execute()
            ).data or []
            if not attempts:
                raise HTTPException(
                    status_code=423,
                    detail=f'Pass the assessment for "{previous.get("title") or "the previous module"}" with at least 70% to unlock this module.',
                )


def _validate_module_status(status: str):
    if status not in MODULE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid module status. "
                f"Allowed values: {sorted(MODULE_STATUSES)}"
            ),
        )


def _validate_lesson_status(status: str):
    if status not in LESSON_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid lesson status. "
                f"Allowed values: {sorted(LESSON_STATUSES)}"
            ),
        )


def _validate_lesson_type(lesson_type: str):
    if lesson_type not in LESSON_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid lesson type. "
                f"Allowed values: {sorted(LESSON_TYPES)}"
            ),
        )


# ============================================================
# MODULES
# ============================================================

@router.get("/courses/{course_id}/modules")
def list_modules(
    course_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    course = _get_course(course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_view_access(context, course)

    try:
        result = (
            supabase
            .table("course_modules")
            .select(
                "id,"
                "course_id,"
                "title,"
                "description,"
                "order_index,"
                "status,"
                "created_at,"
                "updated_at"
            )
            .eq("course_id", course_id)
            .order("order_index")
            .execute()
        )

        modules = result.data or []

        return {
            "success": True,
            "course_id": course_id,
            "count": len(modules),
            "modules": modules,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load course modules: {str(exc)}",
        )


@router.get("/modules/{module_id}")
def get_module(
    module_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    module = _get_module(module_id)

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )

    _assert_module_unlocked(context, module)

    course = _get_course(str(module["course_id"]))
    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )
    _check_course_view_access(context, course)

    return {
        "success": True,
        "module": module,
    }


@router.post("/courses/{course_id}/modules")
def create_module(
    course_id: str,
    payload: CreateModule,
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    course = _get_course(course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_access(context, course)

    _validate_module_status(payload.status)

    try:
        result = (
            supabase
            .table("course_modules")
            .insert({
                "course_id": course_id,
                "title": payload.title.strip(),
                "description": payload.description,
                "order_index": payload.order_index,
                "status": payload.status,
            })
            .execute()
        )

        module = result.data[0] if result.data else None

        if not module:
            raise HTTPException(
                status_code=500,
                detail="Module creation returned no record.",
            )

        if course.get("status") == "published" and module.get("status") == "published":
            notify_course_updated(course, ["module_added"])

        return {
            "success": True,
            "message": "Module created successfully.",
            "module": module,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Module creation failed: {str(exc)}",
        )


@router.patch("/modules/{module_id}")
def update_module(
    module_id: str,
    payload: UpdateModule,
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    module = _get_module(module_id)

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )

    course = _get_course(str(module["course_id"]))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Parent course not found.",
        )

    _check_course_access(context, course)

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        _validate_module_status(update_data["status"])

    if "title" in update_data and update_data["title"]:
        update_data["title"] = update_data["title"].strip()

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied.",
        )

    try:
        result = (
            supabase
            .table("course_modules")
            .update(update_data)
            .eq("id", module_id)
            .execute()
        )

        updated = result.data[0] if result.data else None

        if not updated:
            raise HTTPException(
                status_code=500,
                detail="Module update returned no record.",
            )

        if course.get("status") == "published" and any(key in update_data for key in ("title", "description", "status")):
            notify_course_updated(course, ["module_updated"])

        return {
            "success": True,
            "message": "Module updated successfully.",
            "module": updated,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Module update failed: {str(exc)}",
        )


@router.delete("/modules/{module_id}")
def archive_module(
    module_id: str,
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    module = _get_module(module_id)

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )

    course = _get_course(str(module["course_id"]))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Parent course not found.",
        )

    _check_course_access(context, course)

    try:
        result = (
            supabase
            .table("course_modules")
            .update({"status": "archived"})
            .eq("id", module_id)
            .execute()
        )

        updated = result.data[0] if result.data else None

        if not updated:
            raise HTTPException(
                status_code=500,
                detail="Module archive returned no record.",
            )

        return {
            "success": True,
            "message": "Module archived successfully.",
            "module": updated,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Module archive failed: {str(exc)}",
        )


# ============================================================
# LESSONS
# ============================================================

@router.get("/modules/{module_id}/lessons")
def list_lessons(
    module_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    module = _get_module(module_id)

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )

    _assert_module_unlocked(context, module)

    course = _get_course(str(module["course_id"]))
    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )
    _check_course_view_access(context, course)

    try:
        result = (
            supabase
            .table("learnora_lessons")
            .select(
                "id,"
                "module_id,"
                "title,"
                "slug,"
                "description,"
                "order_index,"
                "lesson_type,"
                "content,"
                "duration_minutes,"
                "is_preview,"
                "status,"
                "created_at,"
                "updated_at"
            )
            .eq("module_id", module_id)
            .order("order_index")
            .execute()
        )

        lessons = result.data or []

        return {
            "success": True,
            "module_id": module_id,
            "count": len(lessons),
            "lessons": lessons,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load module lessons: {str(exc)}",
        )


@router.get("/lessons/{lesson_id}")
def get_lesson(
    lesson_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    lesson = _get_lesson(lesson_id)

    if not lesson:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found.",
        )

    module = _get_module(str(lesson["module_id"]))
    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )
    _assert_module_unlocked(context, module)
    course = _get_course(str(module["course_id"]))
    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )
    _check_course_view_access(context, course)

    return {
        "success": True,
        "lesson": lesson,
    }


@router.post("/modules/{module_id}/lessons")
def create_lesson(
    module_id: str,
    payload: CreateLesson,
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    module = _get_module(module_id)

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )

    course = _get_course(str(module["course_id"]))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Parent course not found.",
        )

    _check_course_access(context, course)

    _validate_lesson_status(payload.status)
    _validate_lesson_type(payload.lesson_type)

    try:
        result = (
            supabase
            .table("learnora_lessons")
            .insert({
                "module_id": module_id,
                "title": payload.title.strip(),
                "slug": payload.slug,
                "description": payload.description,
                "order_index": payload.order_index,
                "lesson_type": payload.lesson_type,
                "content": payload.content,
                "duration_minutes": payload.duration_minutes,
                "is_preview": payload.is_preview,
                "status": payload.status,
            })
            .execute()
        )

        lesson = result.data[0] if result.data else None

        if not lesson:
            raise HTTPException(
                status_code=500,
                detail="Lesson creation returned no record.",
            )

        if course.get("status") == "published" and lesson.get("status") == "published":
            notify_course_updated(course, ["lesson_added"])

        return {
            "success": True,
            "message": "Lesson created successfully.",
            "lesson": lesson,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lesson creation failed: {str(exc)}",
        )


@router.patch("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: str,
    payload: UpdateLesson,
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    lesson = _get_lesson(lesson_id)

    if not lesson:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found.",
        )

    module = _get_module(str(lesson["module_id"]))

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Parent module not found.",
        )

    course = _get_course(str(module["course_id"]))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Parent course not found.",
        )

    _check_course_access(context, course)

    update_data = payload.model_dump(exclude_unset=True)

    if "status" in update_data:
        _validate_lesson_status(update_data["status"])

    if "lesson_type" in update_data:
        _validate_lesson_type(update_data["lesson_type"])

    if "title" in update_data and update_data["title"]:
        update_data["title"] = update_data["title"].strip()

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied.",
        )

    try:
        result = (
            supabase
            .table("learnora_lessons")
            .update(update_data)
            .eq("id", lesson_id)
            .execute()
        )

        updated = result.data[0] if result.data else None

        if not updated:
            raise HTTPException(
                status_code=500,
                detail="Lesson update returned no record.",
            )

        if course.get("status") == "published" and any(key in update_data for key in ("title", "description", "content", "status", "duration_minutes")):
            notify_course_updated(course, ["lesson_updated"])

        return {
            "success": True,
            "message": "Lesson updated successfully.",
            "lesson": updated,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lesson update failed: {str(exc)}",
        )


@router.delete("/lessons/{lesson_id}")
def archive_lesson(
    lesson_id: str,
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    lesson = _get_lesson(lesson_id)

    if not lesson:
        raise HTTPException(
            status_code=404,
            detail="Lesson not found.",
        )

    module = _get_module(str(lesson["module_id"]))

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Parent module not found.",
        )

    course = _get_course(str(module["course_id"]))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Parent course not found.",
        )

    _check_course_access(context, course)

    try:
        result = (
            supabase
            .table("learnora_lessons")
            .update({"status": "archived"})
            .eq("id", lesson_id)
            .execute()
        )

        updated = result.data[0] if result.data else None

        if not updated:
            raise HTTPException(
                status_code=500,
                detail="Lesson archive returned no record.",
            )

        return {
            "success": True,
            "message": "Lesson archived successfully.",
            "lesson": updated,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lesson archive failed: {str(exc)}",
        )


# ============================================================
# REORDERING
# ============================================================

@router.patch("/courses/{course_id}/modules/reorder")
def reorder_modules(
    course_id: str,
    items: list[ReorderItem],
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    course = _get_course(course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_access(context, course)

    try:
        for item in items:
            (
                supabase
                .table("course_modules")
                .update({"order_index": item.order_index})
                .eq("id", str(item.id))
                .eq("course_id", course_id)
                .execute()
            )

        return {
            "success": True,
            "message": "Modules reordered successfully.",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Module reorder failed: {str(exc)}",
        )


@router.patch("/modules/{module_id}/lessons/reorder")
def reorder_lessons(
    module_id: str,
    items: list[ReorderItem],
    context: PermissionContext = Depends(
        require_permission("content.manage")
    ),
):
    module = _get_module(module_id)

    if not module:
        raise HTTPException(
            status_code=404,
            detail="Module not found.",
        )

    course = _get_course(str(module["course_id"]))

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Parent course not found.",
        )

    _check_course_access(context, course)

    try:
        for item in items:
            (
                supabase
                .table("learnora_lessons")
                .update({"order_index": item.order_index})
                .eq("id", str(item.id))
                .eq("module_id", module_id)
                .execute()
            )

        return {
            "success": True,
            "message": "Lessons reordered successfully.",
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lesson reorder failed: {str(exc)}",
        )

@router.get("/courses/{course_id}/structure")
def get_course_structure(
    course_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    """
    Return a complete course structure in one request.

    Course
      -> Modules
         -> Lessons

    This endpoint is intended for course-management interfaces
    and learner course navigation.
    """

    course = _get_course(course_id)

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_view_access(context, course)

    try:
        # --------------------------------------------------------
        # Load modules
        # --------------------------------------------------------

        modules_result = (
            supabase
            .table("course_modules")
            .select(
                "id,"
                "course_id,"
                "title,"
                "description,"
                "order_index,"
                "status,"
                "created_at,"
                "updated_at"
            )
            .eq("course_id", course_id)
            .order("order_index")
            .execute()
        )

        modules = modules_result.data or []

        # --------------------------------------------------------
        # Load all lessons for the course's modules
        # --------------------------------------------------------

        module_ids = [
            str(module["id"])
            for module in modules
        ]

        lessons_by_module = {
            module_id: []
            for module_id in module_ids
        }

        if module_ids:
            lessons_result = (
                supabase
                .table("learnora_lessons")
                .select(
                    "id,"
                    "module_id,"
                    "title,"
                    "slug,"
                    "description,"
                    "order_index,"
                    "lesson_type,"
                    "duration_minutes,"
                    "is_preview,"
                    "status,"
                    "created_at,"
                    "updated_at"
                )
                .in_("module_id", module_ids)
                .order("order_index")
                .execute()
            )

            lessons = lessons_result.data or []

            for lesson in lessons:
                module_id = str(lesson["module_id"])

                if module_id in lessons_by_module:
                    lessons_by_module[module_id].append(
                        lesson
                    )

        # --------------------------------------------------------
        # Build nested structure
        # --------------------------------------------------------

        structured_modules = []

        for module in modules:
            module_id = str(module["id"])

            structured_modules.append({
                **module,
                "lessons": lessons_by_module.get(
                    module_id,
                    []
                ),
            })

        # --------------------------------------------------------
        # Return complete structure
        # --------------------------------------------------------

        return {
            "success": True,
            "course": course,
            "modules": structured_modules,
            "module_count": len(structured_modules),
            "lesson_count": sum(
                len(module["lessons"])
                for module in structured_modules
            ),
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load course structure: "
                f"{str(exc)}"
            ),
        )