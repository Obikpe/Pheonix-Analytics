"""Learning evidence, skills and project submissions API."""

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase

router = APIRouter(
    prefix="/api/evidence",
    tags=["Learning Evidence"],
)


class EvidenceIn(BaseModel):
    skill_id: UUID
    evidence_type: str = Field(..., min_length=2, max_length=50)
    source_id: UUID | None = None
    score: float | None = Field(default=None, ge=0, le=100)
    notes: str | None = Field(default=None, max_length=5000)


class ProjectSubmissionIn(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    repository_url: str | None = Field(default=None, max_length=1000)
    live_url: str | None = Field(default=None, max_length=1000)
    submission_url: str | None = Field(default=None, max_length=1000)


ALLOWED_EVIDENCE_TYPES = {
    "project",
    "assessment",
    "course",
    "certificate",
    "portfolio",
    "work",
    "manual",
}


def _enrolled(user_id, course_id):
    result = (
        supabase
        .table("learnora_enrolments")
        .select("id,status")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .in_("status", ["active", "completed"])
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


@router.get("/me")
def my_evidence(
    user: CurrentUser = Depends(get_current_user),
):
    skills = (
        supabase
        .table("learner_skills")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    evidence = (
        supabase
        .table("skill_evidence")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )

    badges = (
        supabase
        .table("learner_badges")
        .select("*")
        .eq("user_id", user.id)
        .execute()
    )

    certificates = (
        supabase
        .table("certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", desc=True)
        .execute()
    )

    return {
        "success": True,
        "skills": skills.data or [],
        "evidence": evidence.data or [],
        "badges": badges.data or [],
        "certificates": certificates.data or [],
    }


@router.post("/me", status_code=201)
def add_evidence(
    body: EvidenceIn,
    user: CurrentUser = Depends(get_current_user),
):
    evidence_type = body.evidence_type.strip().lower()

    if evidence_type not in ALLOWED_EVIDENCE_TYPES:
        raise HTTPException(
            400,
            "Unsupported evidence type.",
        )

    skill = (
        supabase
        .table("skills")
        .select("id,name")
        .eq("id", str(body.skill_id))
        .limit(1)
        .execute()
    )
    if not skill.data:
        raise HTTPException(
            404,
            "Skill not found.",
        )

    payload = {
        "user_id": user.id,
        "skill_id": str(body.skill_id),
        "evidence_type": evidence_type,
        "source_id": (
            str(body.source_id)
            if body.source_id
            else None
        ),
        "score": body.score,
        "notes": body.notes.strip() if body.notes else None,
    }

    result = (
        supabase
        .table("skill_evidence")
        .insert(payload)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to save skill evidence.",
        )

    return {
        "success": True,
        "evidence": result.data[0],
    }


@router.get("/projects/me")
def my_project_submissions(
    user: CurrentUser = Depends(get_current_user),
):
    """Return only the authenticated learner's own project submissions."""
    submissions = (
        supabase
        .table("project_submissions")
        .select(
            "id,project_id,title,description,repository_url,live_url,"
            "submission_url,status,feedback,score,submitted_at,reviewed_at"
        )
        .eq("user_id", user.id)
        .order("submitted_at", desc=True)
        .execute()
    ).data or []

    project_ids = list({
        str(row["project_id"])
        for row in submissions
        if row.get("project_id")
    })
    project_map = {}
    if project_ids:
        projects = (
            supabase
            .table("projects")
            .select("id,title,description,skills")
            .in_("id", project_ids)
            .execute()
        ).data or []
        project_map = {
            str(row["id"]): row
            for row in projects
        }

    return {
        "success": True,
        "submissions": [
            {
                **row,
                "project": project_map.get(str(row.get("project_id"))),
                "review_state": (
                    "reviewed"
                    if row.get("reviewed_at")
                    else "awaiting_review"
                ),
            }
            for row in submissions
        ],
    }


@router.post(
    "/projects/{project_id}/submissions",
    status_code=201,
)
def submit_project(
    project_id: str,
    body: ProjectSubmissionIn,
    user: CurrentUser = Depends(get_current_user),
):
    project = (
        supabase
        .table("projects")
        .select(
            "id,course_id,title,is_published"
        )
        .eq("id", project_id)
        .limit(1)
        .execute()
    )

    if not project.data:
        raise HTTPException(
            404,
            "Project not found.",
        )

    project_row = project.data[0]

    if not project_row.get("is_published"):
        raise HTTPException(
            409,
            "This project is not published.",
        )

    course_id = project_row.get("course_id")

    if course_id and not _enrolled(
        user.id,
        str(course_id),
    ):
        raise HTTPException(
            403,
            "You must be enrolled in the course before submitting this project.",
        )

    existing = (
        supabase
        .table("project_submissions")
        .select("id,status")
        .eq("project_id", project_id)
        .eq("user_id", user.id)
        .in_("status", ["submitted", "under_review", "approved"])
        .limit(1)
        .execute()
    )

    if existing.data:
        raise HTTPException(
            409,
            "You already have an active submission for this project.",
        )

    now = datetime.now(timezone.utc).isoformat()

    result = (
        supabase
        .table("project_submissions")
        .insert({
            "project_id": project_id,
            "user_id": user.id,
            **body.model_dump(),
            "status": "submitted",
            "submitted_at": now,
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to save project submission.",
        )

    return {
        "success": True,
        "submission": result.data[0],
    }
