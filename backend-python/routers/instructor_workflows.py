"""Permission-checked instructor assessment review workflows.

Instructors may review submissions only for courses they own as approved
independent creators or courses within their active organisation when they
hold the instructor role and the required course-view permission.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase
from .permissions import PermissionContext, get_permission_context

router = APIRouter(prefix="/api/instructor", tags=["Instructor"])


class SubmissionReviewIn(BaseModel):
    score: float = Field(..., ge=0, le=100)
    feedback: str = Field(..., min_length=1, max_length=10000)


def _creator_account(user_id: str):
    response = (
        supabase.table("learnora_creator_accounts")
        .select("id,status")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def _course_for_instructor(course_id: str, user: CurrentUser, context: PermissionContext):
    response = (
        supabase.table("learnora_courses")
        .select("id,title,organisation_id,ownership,creator_id,status")
        .eq("id", course_id)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(404, "Course not found.")
    course = response.data[0]

    # Independent creator courses are always scoped to the authenticated creator.
    if course.get("ownership") == "creator":
        creator = _creator_account(str(user.id))
        if (
            not creator
            or creator.get("status") != "approved"
            or str(course.get("creator_id")) != str(creator.get("id"))
        ):
            raise HTTPException(403, "You cannot access assessments for this course.")
        return course

    # Organisation courses require an explicit tenant context and instructor-level
    # membership. A platform-wide course listing is not sufficient authorisation.
    if course.get("organisation_id"):
        if not context.organisation_id or str(context.organisation_id) != str(course["organisation_id"]):
            raise HTTPException(403, "Select the organisation that owns this course.")
        if context.organisation_role not in {"instructor", "admin", "owner"} and not context.is_super_admin:
            raise HTTPException(403, "Instructor access to this organisation is required.")
        if not context.has_permission("courses.view"):
            raise HTTPException(403, "Permission required: courses.view")
        return course

    # Learnora-owned global courses must not become editable simply because
    # someone has a generic instructor role.
    raise HTTPException(403, "You are not assigned to teach this course.")


@router.get("/submissions")
def list_submissions(
    course_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None, pattern="^(submitted|reviewed|returned|graded)$"),
    user: CurrentUser = Depends(get_current_user),
    context: PermissionContext = Depends(get_permission_context),
):
    """List submissions for courses this instructor is authorised to review."""
    if course_id:
        courses = [_course_for_instructor(course_id, user, context)]
    else:
        # Discover only candidate courses within the current creator or tenant
        # scope, then re-check every candidate through the same authorisation
        # function before returning submissions.
        candidates = []
        creator = _creator_account(str(user.id))
        if creator and creator.get("status") == "approved":
            candidates.extend(
                (supabase.table("learnora_courses")
                 .select("id")
                 .eq("ownership", "creator")
                 .eq("creator_id", creator["id"])
                 .execute()).data or []
            )
        if context.organisation_id and context.organisation_role in {"instructor", "admin", "owner"} and context.has_permission("courses.view"):
            candidates.extend(
                (supabase.table("learnora_courses")
                 .select("id")
                 .eq("organisation_id", context.organisation_id)
                 .execute()).data or []
            )
        courses = []
        seen = set()
        for candidate in candidates:
            cid = str(candidate["id"])
            if cid in seen:
                continue
            seen.add(cid)
            try:
                courses.append(_course_for_instructor(cid, user, context))
            except HTTPException:
                continue

    course_ids = [str(course["id"]) for course in courses]
    if not course_ids:
        return {"success": True, "count": 0, "submissions": []}

    assignments = (
        supabase.table("assignments")
        .select("id,course_id,title,max_score")
        .in_("course_id", course_ids)
        .execute()
    ).data or []
    assignment_by_id = {str(row["id"]): row for row in assignments}
    if not assignment_by_id:
        return {"success": True, "count": 0, "submissions": []}

    query = (
        supabase.table("assignment_submissions")
        .select("id,assignment_id,user_id,submission_text,file_url,status,score,feedback,submitted_at,graded_at")
        .in_("assignment_id", list(assignment_by_id.keys()))
        .order("submitted_at", desc=True)
        .limit(500)
    )
    if status:
        query = query.eq("status", status)
    submissions = query.execute().data or []
    output = []
    for submission in submissions:
        assignment = assignment_by_id.get(str(submission.get("assignment_id")))
        if not assignment:
            continue
        output.append({
            **submission,
            "assignment": assignment,
            "course": next(({"id": c["id"], "title": c.get("title")} for c in courses if str(c["id"]) == str(assignment["course_id"])), None),
        })
    return {"success": True, "count": len(output), "submissions": output}


@router.patch("/submissions/{submission_id}/review")
def review_submission(
    submission_id: str,
    body: SubmissionReviewIn,
    user: CurrentUser = Depends(get_current_user),
    context: PermissionContext = Depends(get_permission_context),
):
    """Grade an assignment submission and return feedback to its learner."""
    submission_response = (
        supabase.table("assignment_submissions")
        .select("id,assignment_id,user_id,status")
        .eq("id", submission_id)
        .limit(1)
        .execute()
    )
    if not submission_response.data:
        raise HTTPException(404, "Submission not found.")
    submission = submission_response.data[0]

    assignment_response = (
        supabase.table("assignments")
        .select("id,course_id,title,max_score")
        .eq("id", submission["assignment_id"])
        .limit(1)
        .execute()
    )
    if not assignment_response.data:
        raise HTTPException(404, "Assignment not found.")
    assignment = assignment_response.data[0]
    _course_for_instructor(str(assignment["course_id"]), user, context)

    if submission.get("status") not in {"submitted", "reviewed", "returned", "graded"}:
        raise HTTPException(409, "This submission is not available for review.")
    maximum = float(assignment.get("max_score") or 100)
    if body.score > maximum:
        raise HTTPException(422, f"Score cannot exceed the assignment maximum of {maximum:g}.")

    now = datetime.now(timezone.utc).isoformat()
    result = (
        supabase.table("assignment_submissions")
        .update({
            "score": body.score,
            "feedback": body.feedback.strip(),
            "status": "graded",
            "graded_at": now,
        })
        .eq("id", submission_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to save submission feedback.")
    return {"success": True, "submission": result.data[0], "assignment": assignment}
