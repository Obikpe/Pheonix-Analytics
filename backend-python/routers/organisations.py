"""
Learnora organisation management.

This router belongs to the new multi-tenant Learnora architecture.

Important:
- Do not hard-code Witstart into this router.
- Organisation access is controlled through the new permission system.
- Legacy admin roles remain supported elsewhere while migration is in progress.
"""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .auth import CurrentUser, supabase, log_audit_event
from .permissions import (
    PermissionContext,
    get_permission_context,
    require_permission,
)
from services.capacity import ensure_org_capacity, ensure_cohort_capacity


router = APIRouter(
    prefix="/api/organisations",
    tags=["Organisations"],
)


# ---------------------------------------------------------------------------
# MODELS
# ---------------------------------------------------------------------------


class CreateOrganisation(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=100)
    organisation_type: str = Field(
        default="academy",
        min_length=2,
        max_length=50,
    )
    template: str = Field(
        default="academy",
        min_length=2,
        max_length=50,
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
    )
    logo_url: Optional[str] = Field(
        default=None,
        max_length=1000,
    )
    brand_primary: Optional[str] = Field(
        default=None,
        max_length=50,
    )
    brand_secondary: Optional[str] = Field(
        default=None,
        max_length=50,
    )


class ProgrammeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=4000)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "draft"


class CohortCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=4000)
    programme_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    instructor_capacity: Optional[int] = Field(default=None, ge=0)
    status: str = "draft"


class TeamCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=4000)
    manager_user_id: Optional[str] = None
    status: str = "active"


class CohortMemberCreate(BaseModel):
    user_id: str


class TeamMemberCreate(BaseModel):
    user_id: str
    role: str = "member"


class StructureStatusUpdate(BaseModel):
    status: str


class UpdateOrganisation(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    slug: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    organisation_type: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    template: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
    )
    logo_url: Optional[str] = Field(
        default=None,
        max_length=1000,
    )
    brand_primary: Optional[str] = Field(
        default=None,
        max_length=50,
    )
    brand_secondary: Optional[str] = Field(
        default=None,
        max_length=50,
    )
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------


SAFE_ORGANISATION_COLUMNS = (
    "id, name, slug, organisation_type, description, "
    "logo_url, brand_primary, brand_secondary, template, "
    "is_active, settings, created_at, updated_at"
)




def _actor_user_uuid(context: PermissionContext) -> Optional[str]:
    """Return a UUID actor for UUID foreign keys; legacy integer admin IDs are not UUIDs."""
    actor_id = getattr(context.user, "id", None)
    try:
        return str(UUID(str(actor_id))) if actor_id is not None else None
    except (ValueError, TypeError, AttributeError):
        return None


def _normalise_slug(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace(" ", "-")
    )


def _get_organisation(organisation_id: str):
    response = (
        supabase
        .table("organisations")
        .select(SAFE_ORGANISATION_COLUMNS)
        .eq("id", organisation_id)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return rows[0] if rows else None


def _ensure_slug_available(
    slug: str,
    exclude_id: Optional[str] = None,
):
    query = (
        supabase
        .table("organisations")
        .select("id")
        .eq("slug", slug)
    )

    if exclude_id:
        query = query.neq("id", exclude_id)

    existing = query.limit(1).execute()

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="An organisation with this slug already exists.",
        )


def _assert_organisation_scope(context: PermissionContext, organisation_id: str):
    organisation = _get_organisation(organisation_id)
    if not organisation:
        raise HTTPException(404, "Organisation not found.")
    if not context.is_platform_admin and str(context.organisation_id or "") != str(organisation_id):
        raise HTTPException(403, "You do not have access to this organisation.")
    return organisation


def _require_active_organisation(organisation: dict):
    if not organisation.get("is_active"):
        raise HTTPException(409, "This organisation workspace is inactive until its contract is approved and activated.")


@router.get("/{organisation_id}/programmes")
def list_organisation_programmes(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _assert_organisation_scope(context, organisation_id)
    rows = supabase.table("learnora_programmes").select("*").eq("organisation_id", organisation_id).order("created_at", desc=True).execute()
    return {"success": True, "programmes": rows.data or []}


@router.post("/{organisation_id}/programmes", status_code=201)
def create_organisation_programme(
    organisation_id: str,
    body: ProgrammeCreate,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    if body.status not in {"draft", "upcoming", "active"}:
        raise HTTPException(400, "A new programme must be draft, upcoming or active.")
    ensure_org_capacity(organisation_id, "programmes")
    slug = _normalise_slug(body.slug or body.name)
    existing = supabase.table("learnora_programmes").select("id").eq("organisation_id", organisation_id).eq("slug", slug).limit(1).execute()
    if existing.data:
        raise HTTPException(409, "A programme with this slug already exists in the organisation.")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("learnora_programmes").insert({
        "organisation_id": organisation_id,
        "name": body.name.strip(),
        "slug": slug,
        "description": body.description,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "status": body.status,
        "created_by": _actor_user_uuid(context),
        "created_at": now,
        "updated_at": now,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Programme creation failed.")
    return {"success": True, "programme": result.data[0]}


@router.patch("/{organisation_id}/programmes/{programme_id}")
def update_organisation_programme(
    organisation_id: str,
    programme_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    allowed = {"name", "description", "start_date", "end_date", "status"}
    changes = {key: value for key, value in body.items() if key in allowed}
    if not changes:
        raise HTTPException(400, "No supported programme fields were supplied.")
    if "status" in changes and changes["status"] not in {"draft", "upcoming", "active", "completed", "archived"}:
        raise HTTPException(400, "Invalid programme status.")
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("learnora_programmes").update(changes).eq("id", programme_id).eq("organisation_id", organisation_id).execute()
    if not result.data:
        raise HTTPException(404, "Programme not found.")
    return {"success": True, "programme": result.data[0]}


@router.get("/{organisation_id}/cohorts")
def list_organisation_cohorts(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _assert_organisation_scope(context, organisation_id)
    rows = supabase.table("cohorts").select("*").eq("organisation_id", organisation_id).order("created_at", desc=True).execute()
    return {"success": True, "cohorts": rows.data or []}


@router.post("/{organisation_id}/cohorts", status_code=201)
def create_organisation_cohort(
    organisation_id: str,
    body: CohortCreate,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    if body.status not in {"draft", "upcoming", "active"}:
        raise HTTPException(400, "A new cohort must be draft, upcoming or active.")
    if body.programme_id:
        programme = supabase.table("learnora_programmes").select("id").eq("id", body.programme_id).eq("organisation_id", organisation_id).limit(1).execute()
        if not programme.data:
            raise HTTPException(400, "The selected programme does not belong to this organisation.")
    ensure_org_capacity(organisation_id, "cohorts")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("cohorts").insert({
        "organisation_id": organisation_id,
        "programme_id": body.programme_id,
        "name": body.name.strip(),
        "description": body.description,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "capacity": body.capacity,
        "instructor_capacity": body.instructor_capacity,
        "status": body.status,
        "created_at": now,
        "updated_at": now,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Cohort creation failed.")
    return {"success": True, "cohort": result.data[0]}


@router.patch("/{organisation_id}/cohorts/{cohort_id}")
def update_organisation_cohort(
    organisation_id: str,
    cohort_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    allowed = {"name", "description", "programme_id", "start_date", "end_date", "capacity", "instructor_capacity", "status"}
    changes = {key: value for key, value in body.items() if key in allowed}
    if not changes:
        raise HTTPException(400, "No supported cohort fields were supplied.")
    if "status" in changes and changes["status"] not in {"draft", "upcoming", "active", "ending", "completed", "expired", "closed", "archived"}:
        raise HTTPException(400, "Invalid cohort status.")
    if changes.get("programme_id"):
        programme = supabase.table("learnora_programmes").select("id").eq("id", changes["programme_id"]).eq("organisation_id", organisation_id).limit(1).execute()
        if not programme.data:
            raise HTTPException(400, "The selected programme does not belong to this organisation.")
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("cohorts").update(changes).eq("id", cohort_id).eq("organisation_id", organisation_id).execute()
    if not result.data:
        raise HTTPException(404, "Cohort not found.")
    return {"success": True, "cohort": result.data[0]}


@router.get("/{organisation_id}/cohorts/{cohort_id}/members")
def list_cohort_members(
    organisation_id: str,
    cohort_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _assert_organisation_scope(context, organisation_id)
    cohort = supabase.table("cohorts").select("id").eq("id", cohort_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not cohort.data:
        raise HTTPException(404, "Cohort not found.")
    rows = supabase.table("cohort_members").select("id,cohort_id,user_id,joined_at,status").eq("cohort_id", cohort_id).order("joined_at", desc=True).execute()
    return {"success": True, "members": rows.data or []}


@router.post("/{organisation_id}/cohorts/{cohort_id}/members", status_code=201)
def add_cohort_member(
    organisation_id: str,
    cohort_id: str,
    body: CohortMemberCreate,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    cohort = supabase.table("cohorts").select("id,status").eq("id", cohort_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not cohort.data:
        raise HTTPException(404, "Cohort not found.")
    if cohort.data[0].get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(409, "This cohort is closed to new members.")
    member = supabase.table("organisation_members").select("id,role,status").eq("organisation_id", organisation_id).eq("user_id", body.user_id).eq("status", "active").limit(1).execute()
    if not member.data or member.data[0].get("role") != "learner":
        raise HTTPException(400, "Only active learners in this organisation can be added to a cohort.")
    existing = supabase.table("cohort_members").select("id,status").eq("cohort_id", cohort_id).eq("user_id", body.user_id).limit(1).execute()
    now = datetime.now(timezone.utc).isoformat()
    if existing.data:
        if existing.data[0].get("status") != "active":
            membership = supabase.table("cohort_members").update({"status": "active", "joined_at": now}).eq("id", existing.data[0]["id"]).execute()
            member_row = (membership.data or [existing.data[0]])[0]
        else:
            member_row = existing.data[0]
    else:
        ensure_cohort_capacity(cohort_id)
        membership = supabase.table("cohort_members").insert({
            "cohort_id": cohort_id,
            "user_id": body.user_id,
            "joined_at": now,
            "status": "active",
        }).execute()
        if not membership.data:
            raise HTTPException(500, "Cohort membership could not be saved.")
        member_row = membership.data[0]

    assignments = supabase.table("cohort_course_assignments").select("course_id").eq("cohort_id", cohort_id).eq("status", "active").execute()
    created_enrolments = 0
    for assignment in assignments.data or []:
        existing_enrolment = supabase.table("learnora_enrolments").select("id").eq("user_id", body.user_id).eq("course_id", assignment["course_id"]).in_("status", ["active", "completed"]).limit(1).execute()
        if existing_enrolment.data:
            continue
        enrolment = supabase.table("learnora_enrolments").insert({
            "user_id": body.user_id,
            "course_id": assignment["course_id"],
            "organisation_id": organisation_id,
            "cohort_id": cohort_id,
            "status": "active",
            "enrolled_at": now,
            "source_type": "cohort_assignment",
        }).execute()
        if enrolment.data:
            created_enrolments += 1
    return {"success": True, "member": member_row, "enrolments_created": created_enrolments}


@router.patch("/{organisation_id}/cohorts/{cohort_id}/members/{membership_id}")
def update_cohort_member(
    organisation_id: str,
    cohort_id: str,
    membership_id: str,
    body: StructureStatusUpdate,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    _assert_organisation_scope(context, organisation_id)
    if body.status not in {"active", "completed", "withdrawn"}:
        raise HTTPException(400, "Invalid cohort membership status.")
    cohort = supabase.table("cohorts").select("id").eq("id", cohort_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not cohort.data:
        raise HTTPException(404, "Cohort not found.")
    result = supabase.table("cohort_members").update({"status": body.status}).eq("id", membership_id).eq("cohort_id", cohort_id).execute()
    if not result.data:
        raise HTTPException(404, "Cohort membership not found.")
    return {"success": True, "member": result.data[0]}


@router.get("/{organisation_id}/assigned-courses")
def list_organisation_assigned_courses(organisation_id: str, context: PermissionContext = Depends(require_permission("organisations.view"))):
    _assert_organisation_scope(context, organisation_id)
    access_rows = (supabase.table("course_access").select("id,course_id,access_type,status,assigned_by,assigned_at").eq("organisation_id", organisation_id).eq("status", "active").order("assigned_at", desc=True).execute()).data or []
    course_ids = list({str(row["course_id"]) for row in access_rows})
    course_map = {}
    if course_ids:
        course_rows = (supabase.table("learnora_courses").select("id,title,slug,ownership,status").in_("id", course_ids).execute()).data or []
        course_map = {str(row["id"]): row for row in course_rows}
    return {"success": True, "courses": [{**row, "course": course_map.get(str(row["course_id"]))} for row in access_rows]}


@router.post("/{organisation_id}/assigned-courses", status_code=201)
def assign_course_to_organisation(organisation_id: str, body: dict, context: PermissionContext = Depends(require_permission("organisations.update"))):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    course_id = str(body.get("course_id") or "")
    if not course_id:
        raise HTTPException(400, "course_id is required.")
    course_rows = (supabase.table("learnora_courses").select("id,title,status,ownership,organisation_id,creator_id").eq("id", course_id).limit(1).execute()).data
    if not course_rows or course_rows[0].get("status") != "published":
        raise HTTPException(404, "Only published courses can be assigned.")
    course = course_rows[0]
    if course.get("ownership") == "organisation" and str(course.get("organisation_id")) != str(organisation_id):
        raise HTTPException(403, "An organisation cannot assign another organisation's private course.")
    if course.get("ownership") not in {"learnora", "creator", "organisation"}:
        raise HTTPException(403, "This course cannot be assigned through an organisation workspace.")
    if course.get("ownership") == "creator":
        creator = (supabase.table("learnora_creator_accounts").select("id,status").eq("id", course.get("creator_id")).limit(1).execute()).data
        if not creator or creator[0].get("status") not in {"approved", "active"}:
            raise HTTPException(403, "This creator is not approved for course distribution.")
    access = (supabase.table("course_access").select("id,status").eq("organisation_id", organisation_id).eq("course_id", course_id).limit(1).execute()).data
    now = datetime.now(timezone.utc).isoformat()
    if not access or access[0].get("status") != "active":
        ensure_org_capacity(organisation_id, "courses")
        if access:
            access_result = supabase.table("course_access").update({"status": "active", "access_type": "assigned", "assigned_by": _actor_user_uuid(context), "assigned_at": now}).eq("id", access[0]["id"]).execute()
            access_row = (access_result.data or access)[0]
        else:
            access_result = supabase.table("course_access").insert({
                "course_id": course_id, "organisation_id": organisation_id, "access_type": "assigned",
                "status": "active", "assigned_by": _actor_user_uuid(context), "assigned_at": now,
            }).execute()
            if not access_result.data:
                raise HTTPException(500, "Course access could not be created.")
            access_row = access_result.data[0]
    else:
        access_row = access[0]

    learners = (supabase.table("organisation_members").select("user_id").eq("organisation_id", organisation_id).eq("role", "learner").eq("status", "active").execute()).data or []
    created = 0
    for learner in learners:
        existing_enrolment = (supabase.table("learnora_enrolments").select("id").eq("user_id", learner["user_id"]).eq("course_id", course_id).in_("status", ["active", "completed"]).limit(1).execute()).data
        if existing_enrolment:
            continue
        enrolment = supabase.table("learnora_enrolments").insert({
            "user_id": learner["user_id"], "course_id": course_id, "organisation_id": organisation_id,
            "status": "active", "enrolled_at": now, "source_type": "organisation_assignment",
        }).execute()
        if enrolment.data:
            created += 1
    return {"success": True, "course_access": access_row, "enrolments_created": created}


@router.get("/{organisation_id}/available-courses")
def list_organisation_available_courses(organisation_id: str, context: PermissionContext = Depends(require_permission("organisations.view"))):
    _assert_organisation_scope(context, organisation_id)
    rows = (supabase.table("learnora_courses").select("id,title,slug,ownership,organisation_id,creator_id,status").eq("status", "published").order("title").execute()).data or []
    creator_ids = list({str(row["creator_id"]) for row in rows if row.get("creator_id")})
    creator_map = {}
    if creator_ids:
        creators = (supabase.table("learnora_creator_accounts").select("id,status").in_("id", creator_ids).execute()).data or []
        creator_map = {str(row["id"]): row for row in creators}
    available = []
    for course in rows:
        ownership = course.get("ownership")
        if ownership == "learnora":
            available.append(course)
        elif ownership == "creator" and creator_map.get(str(course.get("creator_id")), {}).get("status") in {"approved", "active"}:
            available.append(course)
        elif ownership == "organisation" and str(course.get("organisation_id")) == str(organisation_id):
            available.append(course)
    return {"success": True, "courses": available}


@router.get("/{organisation_id}/cohort-courses")
def list_organisation_cohort_courses(organisation_id: str, context: PermissionContext = Depends(require_permission("organisations.view"))):
    _assert_organisation_scope(context, organisation_id)
    cohort_rows = (supabase.table("cohorts").select("id,name").eq("organisation_id", organisation_id).execute()).data or []
    cohort_ids = [str(row["id"]) for row in cohort_rows]
    if not cohort_ids:
        return {"success": True, "assignments": []}
    rows = (supabase.table("cohort_course_assignments").select("*").in_("cohort_id", cohort_ids).order("assigned_at", desc=True).execute()).data or []
    course_ids = list({str(row["course_id"]) for row in rows})
    course_map = {}
    if course_ids:
        courses = (supabase.table("learnora_courses").select("id,title,slug,status").in_("id", course_ids).execute()).data or []
        course_map = {str(row["id"]): row for row in courses}
    cohort_map = {str(row["id"]): row for row in cohort_rows}
    return {"success": True, "assignments": [{**row, "course": course_map.get(str(row["course_id"])), "cohort": cohort_map.get(str(row["cohort_id"]))} for row in rows]}


@router.post("/{organisation_id}/cohorts/{cohort_id}/courses", status_code=201)
def assign_course_to_cohort(organisation_id: str, cohort_id: str, body: dict, context: PermissionContext = Depends(require_permission("organisations.update"))):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    course_id = str(body.get("course_id") or "")
    if not course_id:
        raise HTTPException(400, "course_id is required.")
    cohort = (supabase.table("cohorts").select("id,status").eq("id", cohort_id).eq("organisation_id", organisation_id).limit(1).execute()).data
    if not cohort:
        raise HTTPException(404, "Cohort not found.")
    if cohort[0].get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(409, "This cohort is closed to course assignment.")
    course_rows = (supabase.table("learnora_courses").select("id,title,status,ownership,organisation_id,creator_id").eq("id", course_id).limit(1).execute()).data
    if not course_rows or course_rows[0].get("status") != "published":
        raise HTTPException(404, "Only published courses can be assigned.")
    course = course_rows[0]
    if course.get("ownership") == "organisation" and str(course.get("organisation_id")) != str(organisation_id):
        raise HTTPException(403, "An organisation cannot assign another organisation's private course.")
    if course.get("ownership") not in {"learnora", "creator", "organisation"}:
        raise HTTPException(403, "This course cannot be assigned through an organisation workspace.")
    if course.get("ownership") == "creator":
        creator = (supabase.table("learnora_creator_accounts").select("id,status").eq("id", course.get("creator_id")).limit(1).execute()).data
        if not creator or creator[0].get("status") not in {"approved", "active"}:
            raise HTTPException(403, "This creator is not approved for course distribution.")

    access = (supabase.table("course_access").select("id,status").eq("organisation_id", organisation_id).eq("course_id", course_id).limit(1).execute()).data
    if not access or access[0].get("status") != "active":
        ensure_org_capacity(organisation_id, "courses")
        if access:
            supabase.table("course_access").update({"status": "active", "access_type": "assigned"}).eq("id", access[0]["id"]).execute()
        else:
            supabase.table("course_access").insert({
                "course_id": course_id, "organisation_id": organisation_id,
                "access_type": "assigned", "status": "active",
                "assigned_by": _actor_user_uuid(context), "assigned_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

    existing = (supabase.table("cohort_course_assignments").select("id,status").eq("cohort_id", cohort_id).eq("course_id", course_id).limit(1).execute()).data
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        updated = supabase.table("cohort_course_assignments").update({"status": "active", "updated_at": now}).eq("id", existing[0]["id"]).execute()
        assignment_row = (updated.data or existing)[0]
    else:
        inserted = supabase.table("cohort_course_assignments").insert({
            "cohort_id": cohort_id, "course_id": course_id, "assigned_by": _actor_user_uuid(context),
            "status": "active", "assigned_at": now, "updated_at": now,
        }).execute()
        if not inserted.data:
            raise HTTPException(500, "Course assignment could not be saved.")
        assignment_row = inserted.data[0]

    cohort_members = (supabase.table("cohort_members").select("user_id").eq("cohort_id", cohort_id).eq("status", "active").execute()).data or []
    created = 0
    for cohort_member in cohort_members:
        existing_enrolment = (supabase.table("learnora_enrolments").select("id").eq("user_id", cohort_member["user_id"]).eq("course_id", course_id).in_("status", ["active", "completed"]).limit(1).execute()).data
        if existing_enrolment:
            continue
        enrolled = supabase.table("learnora_enrolments").insert({
            "user_id": cohort_member["user_id"], "course_id": course_id,
            "organisation_id": organisation_id, "cohort_id": cohort_id,
            "status": "active", "enrolled_at": now, "source_type": "cohort_assignment",
        }).execute()
        if enrolled.data:
            created += 1
    return {"success": True, "assignment": assignment_row, "enrolments_created": created}


@router.get("/{organisation_id}/teams")
def list_organisation_teams(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _assert_organisation_scope(context, organisation_id)
    rows = supabase.table("organisation_teams").select("*").eq("organisation_id", organisation_id).order("created_at", desc=True).execute()
    return {"success": True, "teams": rows.data or []}


@router.post("/{organisation_id}/teams", status_code=201)
def create_organisation_team(
    organisation_id: str,
    body: TeamCreate,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    if body.status not in {"active", "inactive"}:
        raise HTTPException(400, "A new team must be active or inactive.")
    ensure_org_capacity(organisation_id, "teams")
    slug = _normalise_slug(body.slug or body.name)
    existing = supabase.table("organisation_teams").select("id").eq("organisation_id", organisation_id).eq("slug", slug).limit(1).execute()
    if existing.data:
        raise HTTPException(409, "A team with this slug already exists in the organisation.")
    if body.manager_user_id:
        manager = supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", body.manager_user_id).eq("status", "active").limit(1).execute()
        if not manager.data:
            raise HTTPException(400, "The team manager must be an active organisation member.")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("organisation_teams").insert({
        "organisation_id": organisation_id,
        "name": body.name.strip(),
        "slug": slug,
        "description": body.description,
        "status": body.status,
        "manager_user_id": body.manager_user_id,
        "created_by": _actor_user_uuid(context),
        "created_at": now,
        "updated_at": now,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Team creation failed.")
    return {"success": True, "team": result.data[0]}


@router.patch("/{organisation_id}/teams/{team_id}")
def update_organisation_team(
    organisation_id: str,
    team_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    allowed = {"name", "description", "manager_user_id", "status"}
    changes = {key: value for key, value in body.items() if key in allowed}
    if not changes:
        raise HTTPException(400, "No supported team fields were supplied.")
    if "status" in changes and changes["status"] not in {"active", "inactive", "archived"}:
        raise HTTPException(400, "Invalid team status.")
    if changes.get("manager_user_id"):
        manager = supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", changes["manager_user_id"]).eq("status", "active").limit(1).execute()
        if not manager.data:
            raise HTTPException(400, "The team manager must be an active organisation member.")
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = supabase.table("organisation_teams").update(changes).eq("id", team_id).eq("organisation_id", organisation_id).execute()
    if not result.data:
        raise HTTPException(404, "Team not found.")
    return {"success": True, "team": result.data[0]}


@router.get("/{organisation_id}/teams/{team_id}/members")
def list_team_members(
    organisation_id: str,
    team_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _assert_organisation_scope(context, organisation_id)
    team = supabase.table("organisation_teams").select("id").eq("id", team_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not team.data:
        raise HTTPException(404, "Team not found.")
    rows = supabase.table("organisation_team_members").select("id,team_id,user_id,role,status,joined_at").eq("team_id", team_id).order("joined_at", desc=True).execute()
    return {"success": True, "members": rows.data or []}


@router.post("/{organisation_id}/teams/{team_id}/members", status_code=201)
def add_team_member(
    organisation_id: str,
    team_id: str,
    body: TeamMemberCreate,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    team = supabase.table("organisation_teams").select("id").eq("id", team_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not team.data:
        raise HTTPException(404, "Team not found.")
    if body.role not in {"member", "lead", "manager"}:
        raise HTTPException(400, "Invalid team role.")
    member = supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", body.user_id).eq("status", "active").limit(1).execute()
    if not member.data:
        raise HTTPException(400, "The team member must be an active organisation member.")
    existing = (supabase.table("organisation_team_members")
        .select("id,team_id,user_id,role,status,joined_at")
        .eq("team_id", team_id).eq("user_id", body.user_id).limit(1).execute()).data
    now = datetime.now(timezone.utc).isoformat()
    if existing and existing[0].get("status") == "active":
        return {"success": True, "member": existing[0], "already_member": True}
    if existing:
        result = supabase.table("organisation_team_members").update({
            "role": body.role, "status": "active", "joined_at": now,
        }).eq("id", existing[0]["id"]).execute()
    else:
        result = supabase.table("organisation_team_members").insert({
            "team_id": team_id, "user_id": body.user_id, "role": body.role,
            "status": "active", "joined_at": now,
        }).execute()
    if not result.data:
        raise HTTPException(500, "Team membership could not be saved.")
    return {"success": True, "member": result.data[0], "already_member": False}


@router.patch("/{organisation_id}/teams/{team_id}/members/{membership_id}")
def update_team_member(
    organisation_id: str,
    team_id: str,
    membership_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    _assert_organisation_scope(context, organisation_id)
    changes = {key: value for key, value in body.items() if key in {"role", "status"}}
    if not changes:
        raise HTTPException(400, "No supported team membership fields were supplied.")
    if "role" in changes and changes["role"] not in {"member", "lead", "manager"}:
        raise HTTPException(400, "Invalid team role.")
    if "status" in changes and changes["status"] not in {"active", "inactive"}:
        raise HTTPException(400, "Invalid team membership status.")
    team = supabase.table("organisation_teams").select("id").eq("id", team_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not team.data:
        raise HTTPException(404, "Team not found.")
    result = supabase.table("organisation_team_members").update(changes).eq("id", membership_id).eq("team_id", team_id).execute()
    if not result.data:
        raise HTTPException(404, "Team membership not found.")
    return {"success": True, "member": result.data[0]}


@router.post("/team-workspace/{team_id}/members", status_code=201)
def add_member_from_team_workspace(team_id: str, body: TeamMemberCreate, user: CurrentUser = Depends(get_current_user)):
    workspace = get_my_team_workspace(team_id, user)
    if not workspace.get("can_manage_team"):
        raise HTTPException(403, "Only team leads, team managers or organisation administrators can manage this team.")
    organisation_id = str(user.organisation_id)
    if workspace.get("organisation_role") not in {"owner", "admin"} and body.role != "member":
        raise HTTPException(403, "Team leads can add members but cannot grant lead or manager roles.")
    org_member = (supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", body.user_id).eq("status", "active").limit(1).execute()).data
    if not org_member:
        raise HTTPException(400, "The person must already be an active member of this organisation.")
    existing = (supabase.table("organisation_team_members").select("id,team_id,user_id,role,status,joined_at").eq("team_id", team_id).eq("user_id", body.user_id).limit(1).execute()).data
    if existing and existing[0].get("status") == "active":
        return {"success": True, "member": existing[0], "already_member": True}
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        updated = supabase.table("organisation_team_members").update({"role": body.role, "status": "active", "joined_at": now}).eq("id", existing[0]["id"]).execute()
        row = (updated.data or existing)[0]
    else:
        inserted = supabase.table("organisation_team_members").insert({
            "team_id": team_id, "user_id": body.user_id, "role": body.role,
            "status": "active", "joined_at": now,
        }).execute()
        if not inserted.data:
            raise HTTPException(500, "Team membership could not be saved.")
        row = inserted.data[0]
    return {"success": True, "member": row, "already_member": False}


@router.get("/my-teams")
def list_my_organisation_teams(user: CurrentUser = Depends(get_current_user)):
    organisation_id = user.organisation_id
    if not organisation_id:
        return {"success": True, "teams": []}
    memberships = (supabase.table("organisation_team_members").select("team_id,role,status,joined_at").eq("user_id", user.id).eq("status", "active").execute()).data or []
    team_ids = [str(row["team_id"]) for row in memberships]
    if not team_ids:
        return {"success": True, "teams": []}
    teams = (supabase.table("organisation_teams").select("id,organisation_id,name,slug,description,status,manager_user_id").in_("id", team_ids).eq("organisation_id", str(organisation_id)).eq("status", "active").execute()).data or []
    membership_map = {str(row["team_id"]): row for row in memberships}
    return {"success": True, "teams": [{**team, "membership": membership_map.get(str(team["id"]))} for team in teams]}


@router.get("/team-workspace/{team_id}")
def get_my_team_workspace(team_id: str, user: CurrentUser = Depends(get_current_user)):
    organisation_id = user.organisation_id
    if not organisation_id:
        raise HTTPException(403, "You do not have an active organisation membership.")
    team_result = (supabase.table("organisation_teams").select("id,organisation_id,name,slug,description,status,manager_user_id").eq("id", team_id).eq("organisation_id", str(organisation_id)).eq("status", "active").limit(1).execute())
    if not team_result.data:
        raise HTTPException(404, "Team not found.")
    organisation_membership = (supabase.table("organisation_members").select("id,role,status").eq("organisation_id", str(organisation_id)).eq("user_id", user.id).eq("status", "active").limit(1).execute()).data
    if not organisation_membership:
        raise HTTPException(403, "You are not an active member of this organisation.")
    team_membership = (supabase.table("organisation_team_members").select("id,role,status,joined_at").eq("team_id", team_id).eq("user_id", user.id).eq("status", "active").limit(1).execute()).data
    organisation_role = organisation_membership[0].get("role")
    if not team_membership and organisation_role not in {"owner", "admin"}:
        raise HTTPException(403, "You are not a member of this team.")
    members = (supabase.table("organisation_team_members").select("id,user_id,role,status,joined_at").eq("team_id", team_id).eq("status", "active").order("joined_at").execute()).data or []
    user_ids = list({str(row["user_id"]) for row in members})
    users = (supabase.table("users").select("id,name").in_("id", user_ids).execute()).data or [] if user_ids else []
    user_map = {str(row["id"]): row for row in users}
    enriched_members = [{**row, "user": user_map.get(str(row["user_id"]))} for row in members]
    return {
        "success": True,
        "team": team_result.data[0],
        "organisation_role": organisation_role,
        "team_membership": team_membership[0] if team_membership else None,
        "can_manage_team": bool(team_membership and team_membership[0].get("role") in {"lead", "manager"}) or organisation_role in {"owner", "admin"},
        "members": enriched_members,
    }


# ---------------------------------------------------------------------------
# LIST ORGANISATIONS
# ---------------------------------------------------------------------------


@router.get("")
def list_organisations(
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    """
    List organisations.

    Super/platform administrators can see all organisations.

    Organisation-level users only receive their resolved organisation.
    """

    # Platform administrator:
    # return all organisations.
    if context.is_platform_admin:
        response = (
            supabase
            .table("organisations")
            .select(SAFE_ORGANISATION_COLUMNS)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "organisations": response.data or [],
        }

    # Organisation-level user:
    # return only the organisation they are authorised to access.
    if not context.organisation_id:
        raise HTTPException(
            status_code=403,
            detail="No organisation context is available.",
        )

    organisation = _get_organisation(
        str(context.organisation_id)
    )

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    return {
        "success": True,
        "organisations": [organisation],
    }


# ---------------------------------------------------------------------------
# GET ONE ORGANISATION
# ---------------------------------------------------------------------------


@router.get("/{organisation_id}")
def get_organisation(
    organisation_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    """
    Return one organisation.

    Platform administrators may inspect any organisation.

    Organisation-level users may inspect only their own organisation.
    """

    if not context.is_platform_admin:
        if (
            not context.organisation_id
            or str(context.organisation_id)
            != str(organisation_id)
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this organisation.",
            )

    organisation = _get_organisation(
        organisation_id
    )

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    return {
        "success": True,
        "organisation": organisation,
    }


# ---------------------------------------------------------------------------
# CREATE ORGANISATION
# ---------------------------------------------------------------------------


@router.post("", status_code=201)
def create_organisation(
    payload: CreateOrganisation,
    request: Request,
    context: PermissionContext = Depends(
        require_permission("organisations.create")
    ),
):
    """
    Create a new Learnora organisation.

    Only users with organisations.create may perform this action.
    """

    name = payload.name.strip()
    slug = _normalise_slug(payload.slug)
    organisation_type = payload.organisation_type.strip().lower()
    template = payload.template.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Organisation name is required.",
        )

    if not slug:
        raise HTTPException(
            status_code=400,
            detail="Organisation slug is required.",
        )

    _ensure_slug_available(slug)

    row = {
        "name": name,
        "slug": slug,
        "organisation_type": organisation_type,
        "template": template,
        "description": (
            payload.description.strip()
            if payload.description
            else None
        ),
        "logo_url": (
            payload.logo_url.strip()
            if payload.logo_url
            else None
        ),
        "brand_primary": (
            payload.brand_primary.strip()
            if payload.brand_primary
            else None
        ),
        "brand_secondary": (
            payload.brand_secondary.strip()
            if payload.brand_secondary
            else None
        ),
        "is_active": True,
    }

    try:
        response = (
            supabase
            .table("organisations")
            .insert(row)
            .execute()
        )
    except Exception as exc:
        print(
            f"Failed to create organisation: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create organisation.",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Organisation creation failed.",
        )

    organisation = response.data[0]

    log_audit_event(
        action="organisation_created",
        email=context.user.email,
        account_type=context.user.account_type,
        role=context.user.role,
        request=request,
        metadata={
            "organisation_id": organisation.get("id"),
            "organisation_name": organisation.get("name"),
            "organisation_slug": organisation.get("slug"),
            "created_by": context.user.email,
        },
    )

    return {
        "success": True,
        "message": "Organisation created successfully.",
        "organisation": organisation,
    }


# ---------------------------------------------------------------------------
# UPDATE ORGANISATION
# ---------------------------------------------------------------------------


@router.patch("/{organisation_id}")
def update_organisation(
    organisation_id: str,
    payload: UpdateOrganisation,
    request: Request,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    """
    Update an organisation.

    Platform administrators may update any organisation.

    Organisation-level users may update only their own
    organisation, subject to their organisation permissions.
    """

    if not context.is_platform_admin:
        if (
            not context.organisation_id
            or str(context.organisation_id)
            != str(organisation_id)
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this organisation.",
            )

    existing = _get_organisation(
        organisation_id
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    updates = {}

    if payload.name is not None:
        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Organisation name cannot be empty.",
            )

        updates["name"] = name

    if payload.slug is not None:
        slug = _normalise_slug(
            payload.slug
        )

        if not slug:
            raise HTTPException(
                status_code=400,
                detail="Organisation slug cannot be empty.",
            )

        _ensure_slug_available(
            slug,
            exclude_id=organisation_id,
        )

        updates["slug"] = slug

    if payload.organisation_type is not None:
        updates["organisation_type"] = (
            payload.organisation_type
            .strip()
            .lower()
        )

    if payload.template is not None:
        updates["template"] = (
            payload.template
            .strip()
            .lower()
        )

    if payload.description is not None:
        updates["description"] = (
            payload.description.strip()
            or None
        )

    if payload.logo_url is not None:
        updates["logo_url"] = (
            payload.logo_url.strip()
            or None
        )

    if payload.brand_primary is not None:
        updates["brand_primary"] = (
            payload.brand_primary.strip()
            or None
        )

    if payload.brand_secondary is not None:
        updates["brand_secondary"] = (
            payload.brand_secondary.strip()
            or None
        )

    if payload.is_active is not None:
        updates["is_active"] = payload.is_active

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied.",
        )

    try:
        response = (
            supabase
            .table("organisations")
            .update(updates)
            .eq("id", organisation_id)
            .execute()
        )
    except Exception as exc:
        print(
            f"Failed to update organisation: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update organisation.",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Organisation update failed.",
        )

    organisation = response.data[0]

    log_audit_event(
        action="organisation_updated",
        email=context.user.email,
        account_type=context.user.account_type,
        role=context.user.role,
        request=request,
        metadata={
            "organisation_id": organisation_id,
            "changes": updates,
            "updated_by": context.user.email,
        },
    )

    return {
        "success": True,
        "message": "Organisation updated successfully.",
        "organisation": organisation,
    }