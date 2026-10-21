"""Track-scoped course and lesson assignments for organisation-managed cohorts.

Cohort learners use cohort_accounts and cohort_members; they are not required
to have a public.users or organisation_members row. Every learner-facing read
checks the active cohort membership and the explicit course/lesson assignment.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from routers.auth import CurrentUser, get_current_user, supabase
from routers.permissions import PermissionContext, require_permission
from services.audit import audit

router = APIRouter(tags=["Cohort learning"])


class TrackCourseIn(BaseModel):
    course_id: UUID


class LearnerCourseAssignmentIn(BaseModel):
    course_id: UUID
    tutor_user_id: Optional[UUID] = None
    lesson_ids: list[UUID] = Field(default_factory=list, max_length=500)


def _scope(context: PermissionContext, organisation_id: str) -> None:
    if context.is_platform_admin:
        return
    if str(context.organisation_id or "") != str(organisation_id):
        raise HTTPException(403, "Organisation access denied.")


def _cohort(organisation_id: str, cohort_id: str) -> dict:
    result = (
        supabase.table("cohorts")
        .select("id,organisation_id,status")
        .eq("id", cohort_id)
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Cohort not found.")
    row = result.data[0]
    if row.get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(409, "This cohort is closed to learning assignments.")
    return row


def _published_course(course_id: str, organisation_id: str) -> dict:
    result = (
        supabase.table("learnora_courses")
        .select("id,title,slug,short_description,description,ownership,organisation_id,status,thumbnail_url,estimated_hours,creator_id")
        .eq("id", course_id)
        .limit(1)
        .execute()
    )
    if not result.data or result.data[0].get("status") != "published":
        raise HTTPException(404, "Published course not found.")
    course = result.data[0]
    if course.get("ownership") == "organisation" and str(course.get("organisation_id")) != str(organisation_id):
        raise HTTPException(403, "An organisation cannot assign another organisation's course.")
    if course.get("ownership") not in {"learnora", "creator", "organisation"}:
        raise HTTPException(403, "This course cannot be assigned to a cohort.")
    if course.get("ownership") == "creator":
        creator_id = course.get("creator_id")
        creator = (
            supabase.table("learnora_creator_accounts")
            .select("id,status")
            .eq("id", creator_id)
            .limit(1)
            .execute()
        ) if creator_id else None
        if not creator or not creator.data or creator.data[0].get("status") not in {"approved", "active"}:
            raise HTTPException(403, "This creator is not approved for course distribution.")
    return course


def _member(cohort_id: str, member_id: str) -> dict:
    result = (
        supabase.table("cohort_members")
        .select("id,cohort_id,user_id,cohort_account_id,track_id,status")
        .eq("id", member_id)
        .eq("cohort_id", cohort_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Cohort learner not found.")
    member = result.data[0]
    if member.get("status") != "active":
        raise HTTPException(409, "Only active cohort learners can receive course assignments.")
    if not member.get("track_id"):
        raise HTTPException(409, "The learner has no fixed track assignment.")
    return member


def _validate_lesson_ids(course_id: str, lesson_ids: list[str]) -> None:
    if len(set(lesson_ids)) != len(lesson_ids):
        raise HTTPException(400, "Duplicate lesson IDs are not allowed.")
    if not lesson_ids:
        return
    lessons = (
        supabase.table("learnora_lessons")
        .select("id,module_id,status")
        .in_("id", lesson_ids)
        .execute()
    ).data or []
    if len(lessons) != len(lesson_ids):
        raise HTTPException(400, "One or more lessons do not exist.")
    if any(row.get("status") != "published" for row in lessons):
        raise HTTPException(400, "Only published lessons can be assigned.")
    module_ids = list({str(row["module_id"]) for row in lessons})
    modules = (
        supabase.table("course_modules")
        .select("id,course_id")
        .in_("id", module_ids)
        .execute()
    ).data or []
    course_by_module = {str(row["id"]): str(row["course_id"]) for row in modules}
    if any(course_by_module.get(str(row["module_id"])) != course_id for row in lessons):
        raise HTTPException(400, "Every assigned lesson must belong to the selected course.")


@router.get("/api/organisations/{organisation_id}/cohorts/{cohort_id}/tracks/{track_id}/courses")
def list_track_courses(
    organisation_id: str,
    cohort_id: str,
    track_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _scope(context, organisation_id)
    _cohort(organisation_id, cohort_id)
    option = (
        supabase.table("cohort_track_options")
        .select("id,status")
        .eq("cohort_id", cohort_id)
        .eq("track_id", track_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not option.data:
        raise HTTPException(404, "Track is not enabled for this cohort.")
    rows = (
        supabase.table("cohort_track_courses")
        .select("id,cohort_id,track_id,course_id,status,assigned_by,created_at,updated_at")
        .eq("cohort_id", cohort_id)
        .eq("track_id", track_id)
        .order("created_at")
        .execute()
    ).data or []
    course_ids = list({str(row["course_id"]) for row in rows})
    courses = (
        supabase.table("learnora_courses")
        .select("id,title,slug,short_description,status,thumbnail_url,estimated_hours")
        .in_("id", course_ids)
        .execute()
    ).data or [] if course_ids else []
    course_map = {str(row["id"]): row for row in courses}
    return {"success": True, "courses": [{**row, "course": course_map.get(str(row["course_id"]))} for row in rows]}


@router.post("/api/organisations/{organisation_id}/cohorts/{cohort_id}/tracks/{track_id}/courses", status_code=201)
def add_course_to_track(
    organisation_id: str,
    cohort_id: str,
    track_id: str,
    body: TrackCourseIn,
    context: PermissionContext = Depends(require_permission("courses.assign")),
):
    _scope(context, organisation_id)
    _cohort(organisation_id, cohort_id)
    option = (
        supabase.table("cohort_track_options")
        .select("id,status")
        .eq("cohort_id", cohort_id)
        .eq("track_id", track_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not option.data:
        raise HTTPException(404, "Track is not enabled for this cohort.")
    _published_course(str(body.course_id), organisation_id)
    now = datetime.now(timezone.utc).isoformat()
    try:
        result = supabase.table("cohort_track_courses").upsert({
            "cohort_id": cohort_id,
            "track_id": track_id,
            "course_id": str(body.course_id),
            "status": "active",
            "assigned_by": context.user_id,
            "updated_at": now,
        }, on_conflict="cohort_id,track_id,course_id").execute()
    except Exception:
        raise HTTPException(409, "Course could not be added to this track.")
    if not result.data:
        raise HTTPException(500, "Track course assignment could not be saved.")
    return {"success": True, "course_assignment": result.data[0]}


@router.patch("/api/organisations/{organisation_id}/cohorts/{cohort_id}/tracks/{track_id}/courses/{course_id}")
def update_track_course(
    organisation_id: str,
    cohort_id: str,
    track_id: str,
    course_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("courses.assign")),
):
    _scope(context, organisation_id)
    _cohort(organisation_id, cohort_id)
    status = body.get("status")
    if status not in {"active", "inactive"}:
        raise HTTPException(400, "Status must be active or inactive.")
    if status == "inactive":
        assigned = (
            supabase.table("cohort_member_course_assignments")
            .select("id")
            .eq("cohort_id", cohort_id)
            .eq("track_id", track_id)
            .eq("course_id", course_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        if assigned.data:
            raise HTTPException(409, "This course is assigned to learners. Remove or deactivate learner assignments first.")
    result = (
        supabase.table("cohort_track_courses")
        .update({"status": status, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("cohort_id", cohort_id)
        .eq("track_id", track_id)
        .eq("course_id", course_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Track course assignment not found.")
    return {"success": True, "course_assignment": result.data[0]}


@router.post("/api/organisations/{organisation_id}/cohorts/{cohort_id}/learners/{member_id}/courses", status_code=201)
def assign_course_to_learner(
    organisation_id: str,
    cohort_id: str,
    member_id: str,
    body: LearnerCourseAssignmentIn,
    context: PermissionContext = Depends(require_permission("courses.assign")),
):
    _scope(context, organisation_id)
    _cohort(organisation_id, cohort_id)
    member = _member(cohort_id, member_id)
    course_id = str(body.course_id)
    _published_course(course_id, organisation_id)
    enabled = (
        supabase.table("cohort_track_courses")
        .select("id")
        .eq("cohort_id", cohort_id)
        .eq("track_id", member["track_id"])
        .eq("course_id", course_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not enabled.data:
        raise HTTPException(400, "This course is not enabled for the learner's fixed track.")
    tutor_id = str(body.tutor_user_id) if body.tutor_user_id else None
    if tutor_id:
        tutor = (
            supabase.table("organisation_members")
            .select("id")
            .eq("organisation_id", organisation_id)
            .eq("user_id", tutor_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        if not tutor.data:
            raise HTTPException(400, "The assigned tutor must be an active member of this organisation.")
    lesson_ids = [str(value) for value in body.lesson_ids]
    _validate_lesson_ids(course_id, lesson_ids)
    now = datetime.now(timezone.utc).isoformat()
    try:
        result = supabase.table("cohort_member_course_assignments").upsert({
            "cohort_member_id": member_id,
            "cohort_id": cohort_id,
            "track_id": member["track_id"],
            "course_id": course_id,
            "tutor_user_id": tutor_id,
            "status": "active",
            "assigned_by": context.user_id,
            "updated_at": now,
        }, on_conflict="cohort_member_id,course_id").execute()
    except Exception:
        raise HTTPException(409, "The course assignment failed validation or conflicts with an existing assignment.")
    if not result.data:
        raise HTTPException(500, "Course assignment could not be saved.")
    assignment = result.data[0]
    existing_lessons = (
        supabase.table("cohort_member_lesson_assignments")
        .select("id,lesson_id")
        .eq("course_assignment_id", assignment["id"])
        .execute()
    ).data or []
    if existing_lessons:
        supabase.table("cohort_member_lesson_assignments").update({
            "status": "inactive", "updated_at": now,
        }).eq("course_assignment_id", assignment["id"]).execute()
    for lesson_id in lesson_ids:
        supabase.table("cohort_member_lesson_assignments").upsert({
            "course_assignment_id": assignment["id"],
            "lesson_id": lesson_id,
            "status": "active",
            "updated_at": now,
        }, on_conflict="course_assignment_id,lesson_id").execute()
    audit(
        actor_user_id=context.user_id,
        action="cohort_learner_course_assigned",
        resource_type="cohort_member_course_assignment",
        resource_id=assignment["id"],
        organisation_id=organisation_id,
        metadata={"cohort_id": cohort_id, "track_id": member["track_id"], "course_id": course_id, "lesson_count": len(lesson_ids), "tutor_assigned": bool(tutor_id)},
    )
    return {"success": True, "assignment": assignment, "assigned_lesson_ids": lesson_ids}


@router.get("/api/organisations/{organisation_id}/cohorts/{cohort_id}/learners/{member_id}/courses")
def list_learner_course_assignments(
    organisation_id: str,
    cohort_id: str,
    member_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _scope(context, organisation_id)
    _cohort(organisation_id, cohort_id)
    _member(cohort_id, member_id)
    rows = (
        supabase.table("cohort_member_course_assignments")
        .select("*")
        .eq("cohort_member_id", member_id)
        .order("assigned_at")
        .execute()
    ).data or []
    course_ids = list({str(row["course_id"]) for row in rows})
    courses = (
        supabase.table("learnora_courses")
        .select("id,title,slug,status,thumbnail_url,estimated_hours")
        .in_("id", course_ids)
        .execute()
    ).data or [] if course_ids else []
    course_map = {str(row["id"]): row for row in courses}
    assignment_ids = [str(row["id"]) for row in rows]
    lessons = (
        supabase.table("cohort_member_lesson_assignments")
        .select("course_assignment_id,lesson_id,status")
        .in_("course_assignment_id", assignment_ids)
        .eq("status", "active")
        .execute()
    ).data or [] if assignment_ids else []
    lessons_by_assignment = {}
    for lesson in lessons:
        lessons_by_assignment.setdefault(str(lesson["course_assignment_id"]), []).append(lesson["lesson_id"])
    return {"success": True, "assignments": [{**row, "course": course_map.get(str(row["course_id"])), "lesson_ids": lessons_by_assignment.get(str(row["id"]), [])} for row in rows]}


def _active_cohort_member(user: CurrentUser) -> tuple[dict, dict]:
    if user.account_type != "cohort" or not user.id:
        raise HTTPException(403, "This endpoint is only available to cohort learners.")
    account_result = (
        supabase.table("cohort_accounts")
        .select("id,cohort_id,organisation_id,status,first_name,last_name,username")
        .eq("id", str(user.id))
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not account_result.data:
        raise HTTPException(403, "Cohort learner account is inactive.")
    account = account_result.data[0]
    cohort_result = (
        supabase.table("cohorts")
        .select("id,status,organisation_id")
        .eq("id", account["cohort_id"])
        .eq("organisation_id", account["organisation_id"])
        .limit(1)
        .execute()
    )
    if not cohort_result.data or cohort_result.data[0].get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(403, "This cohort is closed.")
    organisation = (
        supabase.table("organisations")
        .select("id,is_active")
        .eq("id", account["organisation_id"])
        .limit(1)
        .execute()
    )
    if not organisation.data or not organisation.data[0].get("is_active"):
        raise HTTPException(403, "This organisation is inactive.")
    member_result = (
        supabase.table("cohort_members")
        .select("id,cohort_id,cohort_account_id,track_id,status")
        .eq("cohort_id", account["cohort_id"])
        .eq("cohort_account_id", account["id"])
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not member_result.data:
        raise HTTPException(403, "Active cohort membership was not found.")
    return account, member_result.data[0]


@router.get("/api/cohort-learning/me/courses")
def my_cohort_courses(user: CurrentUser = Depends(get_current_user)):
    account, member = _active_cohort_member(user)
    rows = (
        supabase.table("cohort_member_course_assignments")
        .select("id,course_id,track_id,tutor_user_id,status,assigned_at")
        .eq("cohort_member_id", member["id"])
        .eq("status", "active")
        .order("assigned_at")
        .execute()
    ).data or []
    course_ids = list({str(row["course_id"]) for row in rows})
    courses = (
        supabase.table("learnora_courses")
        .select("id,title,slug,short_description,description,thumbnail_url,estimated_hours,level,status")
        .in_("id", course_ids)
        .eq("status", "published")
        .execute()
    ).data or [] if course_ids else []
    course_map = {str(row["id"]): row for row in courses}
    return {
        "success": True,
        "learner": {"id": account["id"], "first_name": account["first_name"], "last_name": account["last_name"], "username": account["username"], "cohort_id": account["cohort_id"], "track_id": member["track_id"]},
        "courses": [{**row, "course": course_map.get(str(row["course_id"]))} for row in rows if str(row["course_id"]) in course_map],
    }


@router.get("/api/cohort-learning/me/courses/{course_id}/lessons")
def my_cohort_course_lessons(course_id: str, user: CurrentUser = Depends(get_current_user)):
    _, member = _active_cohort_member(user)
    assignment_result = (
        supabase.table("cohort_member_course_assignments")
        .select("id,course_id,status")
        .eq("cohort_member_id", member["id"])
        .eq("course_id", course_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not assignment_result.data:
        raise HTTPException(403, "This course has not been assigned to you.")
    assignment = assignment_result.data[0]
    allowed = (
        supabase.table("cohort_member_lesson_assignments")
        .select("lesson_id")
        .eq("course_assignment_id", assignment["id"])
        .eq("status", "active")
        .execute()
    ).data or []
    lesson_ids = [str(row["lesson_id"]) for row in allowed]
    if not lesson_ids:
        return {"success": True, "lessons": []}
    lessons = (
        supabase.table("learnora_lessons")
        .select("id,module_id,title,slug,description,order_index,lesson_type,duration_minutes,is_preview,status")
        .in_("id", lesson_ids)
        .eq("status", "published")
        .order("order_index")
        .execute()
    ).data or []
    module_ids = list({str(row["module_id"]) for row in lessons})
    modules = (
        supabase.table("course_modules")
        .select("id,title,order_index,course_id")
        .in_("id", module_ids)
        .eq("course_id", course_id)
        .execute()
    ).data or [] if module_ids else []
    module_map = {str(row["id"]): row for row in modules}
    return {"success": True, "lessons": [{**row, "module": module_map.get(str(row["module_id"]))} for row in lessons if str(row["module_id"]) in module_map]}


@router.get("/api/cohort-learning/me/courses/{course_id}/lessons/{lesson_id}")
def my_cohort_lesson_content(course_id: str, lesson_id: str, user: CurrentUser = Depends(get_current_user)):
    _, member = _active_cohort_member(user)
    assignment_result = (
        supabase.table("cohort_member_course_assignments")
        .select("id")
        .eq("cohort_member_id", member["id"])
        .eq("course_id", course_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not assignment_result.data:
        raise HTTPException(403, "This course has not been assigned to you.")
    assignment_id = assignment_result.data[0]["id"]
    allowed = (
        supabase.table("cohort_member_lesson_assignments")
        .select("id")
        .eq("course_assignment_id", assignment_id)
        .eq("lesson_id", lesson_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not allowed.data:
        raise HTTPException(403, "This lesson has not been assigned to you.")
    lesson_result = (
        supabase.table("learnora_lessons")
        .select("id,module_id,title,slug,description,order_index,lesson_type,content,duration_minutes,is_preview,status")
        .eq("id", lesson_id)
        .eq("status", "published")
        .limit(1)
        .execute()
    )
    if not lesson_result.data:
        raise HTTPException(404, "Published lesson not found.")
    lesson = lesson_result.data[0]
    module = (
        supabase.table("course_modules")
        .select("id,course_id,title")
        .eq("id", lesson["module_id"])
        .eq("course_id", course_id)
        .limit(1)
        .execute()
    )
    if not module.data:
        raise HTTPException(403, "Lesson does not belong to the assigned course.")
    return {"success": True, "lesson": lesson, "module": module.data[0]}


class LessonProgressIn(BaseModel):
    progress_percent: int = Field(default=0, ge=0, le=100)
    completed: bool = False
    last_position_seconds: int = Field(default=0, ge=0)


def _active_course_assignment(user: CurrentUser, course_id: str) -> tuple[dict, dict]:
    account, member = _active_cohort_member(user)
    result = (
        supabase.table("cohort_member_course_assignments")
        .select("id,course_id,status")
        .eq("cohort_member_id", member["id"])
        .eq("course_id", course_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(403, "This course has not been assigned to you.")
    return account, result.data[0]


@router.get("/api/cohort-learning/me/courses/{course_id}/progress")
def my_cohort_course_progress(course_id: str, user: CurrentUser = Depends(get_current_user)):
    account, assignment = _active_course_assignment(user, course_id)
    rows = (
        supabase.table("cohort_account_lesson_progress")
        .select("lesson_id,progress_percent,completed,last_position_seconds,first_started_at,last_accessed_at,completed_at,updated_at")
        .eq("cohort_account_id", str(account["id"]))
        .eq("course_assignment_id", str(assignment["id"]))
        .order("updated_at", desc=True)
        .execute()
    ).data or []
    return {"success": True, "course_id": course_id, "progress": rows}


@router.put("/api/cohort-learning/me/courses/{course_id}/lessons/{lesson_id}/progress")
def update_my_cohort_lesson_progress(
    course_id: str,
    lesson_id: str,
    body: LessonProgressIn,
    user: CurrentUser = Depends(get_current_user),
):
    account, assignment = _active_course_assignment(user, course_id)
    member = _active_cohort_member(user)[1]
    allowed = (
        supabase.table("cohort_member_lesson_assignments")
        .select("id")
        .eq("course_assignment_id", str(assignment["id"]))
        .eq("lesson_id", lesson_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not allowed.data:
        raise HTTPException(403, "This lesson has not been assigned to you.")

    completed = bool(body.completed or body.progress_percent == 100)
    progress_percent = 100 if completed else body.progress_percent
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "cohort_account_id": str(account["id"]),
        "cohort_member_id": str(member["id"]),
        "cohort_id": str(account["cohort_id"]),
        "course_assignment_id": str(assignment["id"]),
        "lesson_id": lesson_id,
        "progress_percent": progress_percent,
        "completed": completed,
        "last_position_seconds": body.last_position_seconds,
        "last_accessed_at": now,
        "updated_at": now,
    }
    try:
        result = supabase.table("cohort_account_lesson_progress").upsert(
            payload, on_conflict="cohort_account_id,lesson_id"
        ).execute()
    except Exception:
        raise HTTPException(409, "Progress could not be saved. Please retry.")
    if not result.data:
        raise HTTPException(500, "Progress could not be saved.")
    return {"success": True, "progress": result.data[0]}
