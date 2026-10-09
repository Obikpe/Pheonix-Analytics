"""Persistent Learnora learning progress API.

Progress is stored in Supabase, never in the ephemeral Vercel filesystem.
All writes are scoped to the authenticated learner and an actual enrolment.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress"],
)


class LessonProgressIn(BaseModel):
    progress_percent: int = Field(default=0, ge=0, le=100)
    completed: bool = False
    last_position_seconds: int = Field(default=0, ge=0)


class LessonNoteIn(BaseModel):
    content: str = Field(default="", max_length=20000)


def _course_for_lesson(lesson_id: str):
    result = (
        supabase
        .table("learnora_lessons")
        .select(
            "id,module_id,course_modules!inner(course_id)"
        )
        .eq("id", lesson_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Lesson not found.")

    row = result.data[0]
    return str(row["course_modules"]["course_id"])


def _enrolment(user_id: str, course_id: str):
    result = (
        supabase
        .table("learnora_enrolments")
        .select(
            "id,user_id,course_id,organisation_id,cohort_id,status,"
            "enrolled_at,completed_at"
        )
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .in_("status", ["active", "completed"])
        .order("enrolled_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _course_summary(user_id: str, course_id: str):
    enrolment = _enrolment(user_id, course_id)
    if not enrolment:
        raise HTTPException(
            403,
            "You are not enrolled in this course.",
        )

    modules = (
        supabase
        .table("course_modules")
        .select("id,title,order_index,status")
        .eq("course_id", course_id)
        .neq("status", "archived")
        .order("order_index")
        .execute()
    ).data or []

    module_ids = [row["id"] for row in modules]

    lessons = []
    if module_ids:
        lessons = (
            supabase
            .table("learnora_lessons")
            .select(
                "id,module_id,title,order_index,lesson_type,"
                "content,duration_minutes,status"
            )
            .in_("module_id", module_ids)
            .neq("status", "archived")
            .order("order_index")
            .execute()
        ).data or []

    progress = (
        supabase
        .table("learnora_lesson_progress")
        .select(
            "lesson_id,progress_percent,completed,"
            "last_position_seconds,first_started_at,"
            "last_accessed_at,completed_at"
        )
        .eq("user_id", user_id)
        .execute()
    ).data or []

    progress_map = {
        str(row["lesson_id"]): row
        for row in progress
    }

    completed = sum(
        1
        for lesson in lessons
        if progress_map.get(str(lesson["id"]), {}).get("completed")
    )

    total = len(lessons)
    percent = round((completed / total) * 100) if total else 0

    return {
        "course_id": course_id,
        "enrolment": enrolment,
        "total_lessons": total,
        "completed_lessons": completed,
        "progress_percent": percent,
        "completed": total > 0 and completed == total,
        "modules": [
            {
                **module,
                "lessons": [
                    {
                        **lesson,
                        "progress": progress_map.get(
                            str(lesson["id"])
                        ),
                    }
                    for lesson in lessons
                    if str(lesson["module_id"]) == str(module["id"])
                ],
            }
            for module in modules
        ],
    }


@router.get("/me")
def my_progress(
    user: CurrentUser = Depends(get_current_user),
):
    enrolments = (
        supabase
        .table("learnora_enrolments")
        .select(
            "id,course_id,organisation_id,cohort_id,status,"
            "enrolled_at,completed_at"
        )
        .eq("user_id", user.id)
        .in_("status", ["active", "completed"])
        .order("enrolled_at", desc=True)
        .execute()
    ).data or []

    course_ids = [row["course_id"] for row in enrolments]

    courses = []
    if course_ids:
        courses = (
            supabase
            .table("learnora_courses")
            .select(
                "id,title,slug,short_description,level,status,"
                "ownership,thumbnail_url,estimated_hours"
            )
            .in_("id", course_ids)
            .execute()
        ).data or []

    course_map = {
        str(row["id"]): row
        for row in courses
    }

    progress_rows = (
        supabase
        .table("learnora_lesson_progress")
        .select(
            "lesson_id,progress_percent,completed,"
            "last_accessed_at"
        )
        .eq("user_id", user.id)
        .execute()
    ).data or []

    lesson_ids = [row["lesson_id"] for row in progress_rows]

    lesson_course_map = {}
    if lesson_ids:
        lessons = (
            supabase
            .table("learnora_lessons")
            .select(
                "id,course_modules!inner(course_id)"
            )
            .in_("id", lesson_ids)
            .execute()
        ).data or []

        lesson_course_map = {
            str(row["id"]): str(row["course_modules"]["course_id"])
            for row in lessons
        }

    summaries = []
    for enrolment in enrolments:
        course_id = str(enrolment["course_id"])
        rows = [
            row
            for row in progress_rows
            if lesson_course_map.get(str(row["lesson_id"])) == course_id
        ]
        completed = sum(1 for row in rows if row.get("completed"))

        summaries.append({
            "enrolment": enrolment,
            "course": course_map.get(course_id),
            "completed_lessons": completed,
            "tracked_lessons": len(rows),
        })

    return {
        "success": True,
        "courses": summaries,
    }


@router.get("/courses/{course_id}")
def course_progress(
    course_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    return {
        "success": True,
        "progress": _course_summary(
            str(user.id),
            course_id,
        ),
    }


@router.get("/lessons/{lesson_id}/media")
def lesson_media(
    lesson_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    course_id = _course_for_lesson(lesson_id)
    if not _enrolment(str(user.id), course_id):
        raise HTTPException(403, "You are not enrolled in this course.")

    videos = (
        supabase.table("lesson_videos")
        .select("*")
        .eq("lesson_id", lesson_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    for video in videos:
        video["signed_url"] = None
        if video.get("provider") == "supabase" and video.get("storage_path"):
            try:
                signed = supabase.storage.from_("learnora-course-media").create_signed_url(
                    video["storage_path"],
                    3600,
                )
                data = getattr(signed, "data", None) or signed
                if isinstance(data, dict):
                    video["signed_url"] = data.get("signedUrl") or data.get("signed_url")
            except Exception:
                video["signed_url"] = None

    resources = (
        supabase.table("lesson_resources")
        .select("*")
        .eq("lesson_id", lesson_id)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    for resource in resources:
        resource["signed_url"] = None
        if resource.get("storage_path"):
            try:
                signed = supabase.storage.from_("learnora-course-media").create_signed_url(
                    resource["storage_path"],
                    3600,
                )
                data = getattr(signed, "data", None) or signed
                if isinstance(data, dict):
                    resource["signed_url"] = data.get("signedUrl") or data.get("signed_url")
            except Exception:
                resource["signed_url"] = None

    return {
        "success": True,
        "lesson_id": lesson_id,
        "videos": videos,
        "resources": resources,
    }


@router.put("/lessons/{lesson_id}")
def update_lesson_progress(
    lesson_id: str,
    body: LessonProgressIn,
    user: CurrentUser = Depends(get_current_user),
):
    course_id = _course_for_lesson(lesson_id)
    enrolment = _enrolment(str(user.id), course_id)

    if not enrolment:
        raise HTTPException(
            403,
            "You are not enrolled in this course.",
        )

    now = datetime.now(timezone.utc).isoformat()

    completed = bool(
        body.completed
        or body.progress_percent >= 100
    )
    percent = 100 if completed else body.progress_percent

    existing = (
        supabase
        .table("learnora_lesson_progress")
        .select("id,first_started_at")
        .eq("user_id", user.id)
        .eq("lesson_id", lesson_id)
        .limit(1)
        .execute()
    )

    payload = {
        "user_id": user.id,
        "lesson_id": lesson_id,
        "enrolment_id": enrolment["id"],
        "progress_percent": percent,
        "completed": completed,
        "last_position_seconds": body.last_position_seconds,
        "last_accessed_at": now,
        "completed_at": now if completed else None,
    }

    if not existing.data:
        payload["first_started_at"] = now
        result = (
            supabase
            .table("learnora_lesson_progress")
            .insert(payload)
            .execute()
        )
    else:
        result = (
            supabase
            .table("learnora_lesson_progress")
            .update(payload)
            .eq("id", existing.data[0]["id"])
            .execute()
        )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to save lesson progress.",
        )

    summary = _course_summary(
        str(user.id),
        course_id,
    )

    if summary["completed"] and enrolment["status"] == "active":
        completed_at = datetime.now(timezone.utc).isoformat()
        updated = (
            supabase
            .table("learnora_enrolments")
            .update({
                "status": "completed",
                "completed_at": completed_at,
            })
            .eq("id", enrolment["id"])
            .eq("status", "active")
            .execute()
        )
        if updated.data:
            summary["enrolment"] = updated.data[0]

    return {
        "success": True,
        "progress": result.data[0],
        "course_progress": summary,
    }


# Legacy-compatible route retained for existing clients. The authenticated
# user's identity is authoritative; a caller cannot request another user's
# progress by changing the email in the URL.
@router.get("/{user_email}/{track_id}")
def legacy_user_progress(
    user_email: str,
    track_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    if user_email.lower().strip() != str(user.email).lower().strip():
        raise HTTPException(
            403,
            "You can only view your own progress.",
        )

    if track_id.lower() == "all":
        return my_progress(user)

    courses = (
        supabase
        .table("learnora_courses")
        .select(
            "id,title,slug,short_description,level,status,ownership"
        )
        .eq("status", "published")
        .execute()
    ).data or []

    selected = [
        course
        for course in courses
        if str(course.get("slug", "")).lower() == track_id.lower()
    ]

    if not selected:
        selected = [
            course
            for course in courses
            if track_id.lower()
            in str(course.get("title", "")).lower()
        ]

    results = []
    for course in selected:
        try:
            summary = _course_summary(
                str(user.id),
                str(course["id"]),
            )
        except HTTPException:
            continue
        results.append(summary)

    return {
        "success": True,
        "track": track_id,
        "courses": results,
    }
