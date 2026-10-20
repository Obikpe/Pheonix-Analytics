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

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase, log_audit_event
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


# Supported models are configuration-driven; the UI can adapt without
# introducing organisation-specific routes or hard-coded tenant exceptions.
ORGANISATION_TYPES = {
    "academy", "corporate", "university", "school", "bootcamp",
    "nonprofit", "custom", "community",
}
ORGANISATION_CAPABILITIES = {
    "academy": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "bootcamp": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "community": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "corporate": {"instructor_led": False, "programmes": False, "cohorts": False, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "university": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "school": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "nonprofit": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
    "custom": {"instructor_led": True, "programmes": True, "cohorts": True, "teams": True, "individual_course_assignment": True, "team_course_assignment": True},
}


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------


SAFE_ORGANISATION_COLUMNS = (
    "id, name, slug, organisation_type, description, "
    "logo_url, brand_primary, brand_secondary, template, "
    "is_active, settings, created_at, updated_at"
)




def _normalise_slug(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace(" ", "-")
    )


def _with_capabilities(organisation: dict):
    result = dict(organisation)
    org_type = str(result.get("organisation_type") or "custom").strip().lower()
    capabilities = dict(ORGANISATION_CAPABILITIES.get(org_type, ORGANISATION_CAPABILITIES["custom"]))
    settings = result.get("settings") or {}
    overrides = settings.get("capabilities") if isinstance(settings, dict) else None
    if isinstance(overrides, dict):
        for key in capabilities:
            if isinstance(overrides.get(key), bool):
                capabilities[key] = overrides[key]
    result["capabilities"] = capabilities
    return result


def _validate_organisation_type(value: str) -> str:
    normalised = value.strip().lower()
    if normalised not in ORGANISATION_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported organisation type. Allowed values: {', '.join(sorted(ORGANISATION_TYPES))}.",
        )
    return normalised


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

    return _with_capabilities(rows[0]) if rows else None


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
        "created_by": context.user_id,
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
    if "capacity" in changes and changes["capacity"] is not None:
        try:
            changes["capacity"] = int(changes["capacity"])
        except (TypeError, ValueError):
            raise HTTPException(400, "Cohort capacity must be a positive integer.")
        if changes["capacity"] < 1:
            raise HTTPException(400, "Cohort capacity must be a positive integer.")
        active_members = (
            supabase.table("cohort_members").select("id")
            .eq("cohort_id", cohort_id).eq("status", "active").execute()
        ).data or []
        if len(active_members) > changes["capacity"]:
            raise HTTPException(409, "Cohort capacity cannot be lower than its current active membership.")
    if "instructor_capacity" in changes and changes["instructor_capacity"] is not None:
        try:
            changes["instructor_capacity"] = int(changes["instructor_capacity"])
        except (TypeError, ValueError):
            raise HTTPException(400, "Instructor capacity must be a non-negative integer.")
        if changes["instructor_capacity"] < 0:
            raise HTTPException(400, "Instructor capacity must be a non-negative integer.")
    if "programme_id" in changes:
        programme_id = changes["programme_id"]
        changes["programme_id"] = str(programme_id).strip() if programme_id and str(programme_id).strip() else None
        if changes["programme_id"]:
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
            ensure_cohort_capacity(cohort_id)
            membership = supabase.table("cohort_members").update({"status": "active", "joined_at": now}).eq("id", existing.data[0]["id"]).execute()
            if not membership.data:
                raise HTTPException(500, "Cohort membership could not be reactivated.")
            member_row = membership.data[0]
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
        existing_enrolment = supabase.table("learnora_enrolments").select("id").eq("user_id", body.user_id).eq("course_id", assignment["course_id"]).eq("organisation_id", organisation_id).in_("status", ["active", "completed"]).limit(1).execute()
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
    organisation = _assert_organisation_scope(context, organisation_id)
    if body.status not in {"active", "completed", "withdrawn"}:
        raise HTTPException(400, "Invalid cohort membership status.")
    cohort = (
        supabase.table("cohorts")
        .select("id,status")
        .eq("id", cohort_id)
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    ).data or []
    if not cohort:
        raise HTTPException(404, "Cohort not found.")

    membership = (
        supabase.table("cohort_members")
        .select("id,user_id,status")
        .eq("id", membership_id)
        .eq("cohort_id", cohort_id)
        .limit(1)
        .execute()
    ).data or []
    if not membership:
        raise HTTPException(404, "Cohort membership not found.")

    if body.status == "active":
        _require_active_organisation(organisation)
        if cohort[0].get("status") not in {"draft", "upcoming", "active"}:
            raise HTTPException(409, "This cohort is closed to new members.")
        active_learner = (
            supabase.table("organisation_members")
            .select("id")
            .eq("organisation_id", organisation_id)
            .eq("user_id", membership[0]["user_id"])
            .eq("role", "learner")
            .eq("status", "active")
            .limit(1)
            .execute()
        ).data or []
        if not active_learner:
            raise HTTPException(400, "Only active learners in this organisation can be active cohort members.")
        if membership[0].get("status") != "active":
            ensure_cohort_capacity(cohort_id)

    result = (
        supabase.table("cohort_members")
        .update({"status": body.status})
        .eq("id", membership_id)
        .eq("cohort_id", cohort_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Cohort membership update failed.")
    return {"success": True, "member": result.data[0]}


@router.post("/{organisation_id}/members/{user_id}/courses", status_code=201)
def assign_course_to_member(
    organisation_id: str,
    user_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    membership = (
        supabase.table("organisation_members")
        .select("id,role,status")
        .eq("organisation_id", organisation_id)
        .eq("user_id", user_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    ).data or []
    if not membership:
        raise HTTPException(404, "Active organisation member not found.")
    if membership[0].get("role") != "learner":
        raise HTTPException(400, "Individual course assignments are only available for learner memberships.")

    course_id = str(body.get("course_id") or "")
    if not course_id:
        raise HTTPException(400, "course_id is required.")
    course_rows = (
        supabase.table("learnora_courses")
        .select("id,title,status,ownership,organisation_id,creator_id")
        .eq("id", course_id)
        .limit(1)
        .execute()
    ).data or []
    if not course_rows or course_rows[0].get("status") != "published":
        raise HTTPException(404, "Only published courses can be assigned.")
    course = course_rows[0]
    if course.get("ownership") == "organisation" and str(course.get("organisation_id")) != str(organisation_id):
        raise HTTPException(403, "An organisation cannot assign another organisation's private course.")
    if course.get("ownership") == "creator":
        creator = (
            supabase.table("learnora_creator_accounts")
            .select("id,status")
            .eq("id", course.get("creator_id"))
            .limit(1)
            .execute()
        ).data or []
        if not creator or creator[0].get("status") not in {"approved", "active"}:
            raise HTTPException(403, "This creator is not approved for course distribution.")
    if course.get("ownership") not in {"learnora", "creator", "organisation"}:
        raise HTTPException(403, "This course cannot be assigned through an organisation workspace.")

    now = datetime.now(timezone.utc).isoformat()
    if course.get("ownership") != "organisation":
        access = (
            supabase.table("course_access")
            .select("id,status")
            .eq("organisation_id", organisation_id)
            .eq("course_id", course_id)
            .limit(1)
            .execute()
        ).data or []
        if not access or access[0].get("status") != "active":
            ensure_org_capacity(organisation_id, "courses")
            if access:
                supabase.table("course_access").update({
                    "status": "active", "access_type": "scoped",
                    "assigned_by": context.user_id, "assigned_at": now,
                }).eq("id", access[0]["id"]).execute()
            else:
                inserted_access = supabase.table("course_access").insert({
                    "course_id": course_id, "organisation_id": organisation_id,
                    "access_type": "scoped", "status": "active",
                    "assigned_by": context.user_id, "assigned_at": now,
                }).execute()
                if not inserted_access.data:
                    raise HTTPException(500, "Course access could not be created.")

    existing = (
        supabase.table("learnora_enrolments")
        .select("id,status")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .eq("organisation_id", organisation_id)
        .in_("status", ["active", "completed"])
        .limit(1)
        .execute()
    ).data or []
    if existing:
        existing_row = existing[0]
        if existing_row.get("source_type") != "individual_assignment":
            updated = (
                supabase.table("learnora_enrolments")
                .update({"source_type": "individual_assignment"})
                .eq("id", existing_row["id"])
                .execute()
            ).data or []
            if updated:
                existing_row = updated[0]
        return {"success": True, "enrolment": existing_row, "created": False}
    inserted = supabase.table("learnora_enrolments").insert({
        "user_id": user_id, "course_id": course_id,
        "organisation_id": organisation_id, "status": "active",
        "enrolled_at": now, "source_type": "individual_assignment",
    }).execute()
    if not inserted.data:
        raise HTTPException(500, "Individual course assignment could not be saved.")
    return {"success": True, "enrolment": inserted.data[0], "created": True}


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
    access = (supabase.table("course_access").select("id,status,access_type").eq("organisation_id", organisation_id).eq("course_id", course_id).limit(1).execute()).data
    now = datetime.now(timezone.utc).isoformat()
    has_active_access = bool(access and access[0].get("status") == "active")
    if not has_active_access and course.get("ownership") != "organisation":
        ensure_org_capacity(organisation_id, "courses")
    if not has_active_access or access[0].get("access_type") != "assigned":
        if access:
            access_result = supabase.table("course_access").update({"status": "active", "access_type": "assigned", "assigned_by": context.user_id, "assigned_at": now}).eq("id", access[0]["id"]).execute()
            access_row = (access_result.data or access)[0]
        else:
            access_result = supabase.table("course_access").insert({
                "course_id": course_id, "organisation_id": organisation_id, "access_type": "assigned",
                "status": "active", "assigned_by": context.user_id, "assigned_at": now,
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
        if course.get("ownership") != "organisation":
            ensure_org_capacity(organisation_id, "courses")
        if access:
            supabase.table("course_access").update({"status": "active", "access_type": "scoped"}).eq("id", access[0]["id"]).execute()
        else:
            supabase.table("course_access").insert({
                "course_id": course_id, "organisation_id": organisation_id,
                "access_type": "scoped", "status": "active",
                "assigned_by": context.user_id, "assigned_at": datetime.now(timezone.utc).isoformat(),
            }).execute()

    existing = (supabase.table("cohort_course_assignments").select("id,status").eq("cohort_id", cohort_id).eq("course_id", course_id).limit(1).execute()).data
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        updated = supabase.table("cohort_course_assignments").update({"status": "active", "updated_at": now}).eq("id", existing[0]["id"]).execute()
        assignment_row = (updated.data or existing)[0]
    else:
        inserted = supabase.table("cohort_course_assignments").insert({
            "cohort_id": cohort_id, "course_id": course_id, "assigned_by": context.user_id,
            "status": "active", "assigned_at": now, "updated_at": now,
        }).execute()
        if not inserted.data:
            raise HTTPException(500, "Course assignment could not be saved.")
        assignment_row = inserted.data[0]

    cohort_members = (supabase.table("cohort_members").select("user_id").eq("cohort_id", cohort_id).eq("status", "active").execute()).data or []
    active_learners = (
        supabase.table("organisation_members").select("user_id")
        .eq("organisation_id", organisation_id).eq("role", "learner").eq("status", "active").execute()
    ).data or []
    active_learner_ids = {str(row["user_id"]) for row in active_learners}
    cohort_members = [row for row in cohort_members if str(row["user_id"]) in active_learner_ids]
    created = 0
    for cohort_member in cohort_members:
        existing_enrolment = (supabase.table("learnora_enrolments").select("id").eq("user_id", cohort_member["user_id"]).eq("course_id", course_id).eq("organisation_id", organisation_id).in_("status", ["active", "completed"]).limit(1).execute()).data
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


@router.get("/{organisation_id}/team-course-assignments")
def list_team_course_assignments(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _assert_organisation_scope(context, organisation_id)
    teams = (
        supabase.table("organisation_teams")
        .select("id,name,slug")
        .eq("organisation_id", organisation_id)
        .execute()
    ).data or []
    team_ids = [str(row["id"]) for row in teams]
    if not team_ids:
        return {"success": True, "assignments": []}
    assignments = (
        supabase.table("team_course_assignments")
        .select("id,team_id,course_id,status,assigned_by,assigned_at,updated_at")
        .in_("team_id", team_ids)
        .order("assigned_at", desc=True)
        .execute()
    ).data or []
    course_ids = list({str(row["course_id"]) for row in assignments})
    courses = (
        supabase.table("learnora_courses")
        .select("id,title,slug,status,ownership")
        .in_("id", course_ids)
        .execute()
    ).data or [] if course_ids else []
    team_map = {str(row["id"]): row for row in teams}
    course_map = {str(row["id"]): row for row in courses}
    return {
        "success": True,
        "assignments": [
            {**row, "team": team_map.get(str(row["team_id"])), "course": course_map.get(str(row["course_id"]))}
            for row in assignments
        ],
    }


@router.post("/{organisation_id}/teams/{team_id}/courses", status_code=201)
def assign_course_to_team(
    organisation_id: str,
    team_id: str,
    body: dict,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    team_rows = (
        supabase.table("organisation_teams")
        .select("id,organisation_id,status")
        .eq("id", team_id)
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    ).data or []
    if not team_rows or team_rows[0].get("status") != "active":
        raise HTTPException(404, "Active team not found in this organisation.")

    course_id = str(body.get("course_id") or "")
    if not course_id:
        raise HTTPException(400, "course_id is required.")
    course_rows = (
        supabase.table("learnora_courses")
        .select("id,title,status,ownership,organisation_id,creator_id")
        .eq("id", course_id)
        .limit(1)
        .execute()
    ).data or []
    if not course_rows or course_rows[0].get("status") != "published":
        raise HTTPException(404, "Only published courses can be assigned.")
    course = course_rows[0]
    if course.get("ownership") == "organisation" and str(course.get("organisation_id")) != str(organisation_id):
        raise HTTPException(403, "An organisation cannot assign another organisation's private course.")
    if course.get("ownership") not in {"learnora", "creator", "organisation"}:
        raise HTTPException(403, "This course cannot be assigned through an organisation workspace.")
    if course.get("ownership") == "creator":
        creator = (
            supabase.table("learnora_creator_accounts")
            .select("id,status")
            .eq("id", course.get("creator_id"))
            .limit(1)
            .execute()
        ).data or []
        if not creator or creator[0].get("status") not in {"approved", "active"}:
            raise HTTPException(403, "This creator is not approved for course distribution.")

    existing = (
        supabase.table("team_course_assignments")
        .select("id,status")
        .eq("team_id", team_id)
        .eq("course_id", course_id)
        .limit(1)
        .execute()
    ).data or []
    now = datetime.now(timezone.utc).isoformat()
    if not existing or existing[0].get("status") != "active":
        access = (
            supabase.table("course_access")
            .select("id,status")
            .eq("organisation_id", organisation_id)
            .eq("course_id", course_id)
            .limit(1)
            .execute()
        ).data or []
        if not access or access[0].get("status") != "active":
            if course.get("ownership") != "organisation":
                ensure_org_capacity(organisation_id, "courses")
            if access:
                supabase.table("course_access").update({
                    "status": "active", "access_type": "scoped",
                    "assigned_by": context.user_id, "assigned_at": now,
                }).eq("id", access[0]["id"]).execute()
            else:
                supabase.table("course_access").insert({
                    "course_id": course_id, "organisation_id": organisation_id,
                    "access_type": "scoped", "status": "active",
                    "assigned_by": context.user_id, "assigned_at": now,
                }).execute()

        if existing:
            updated = (
                supabase.table("team_course_assignments")
                .update({"status": "active", "updated_at": now})
                .eq("id", existing[0]["id"])
                .execute()
            )
            assignment = (updated.data or existing)[0]
        else:
            inserted = supabase.table("team_course_assignments").insert({
                "team_id": team_id, "course_id": course_id,
                "assigned_by": context.user_id, "status": "active",
                "assigned_at": now, "updated_at": now,
            }).execute()
            if not inserted.data:
                raise HTTPException(500, "Team course assignment could not be saved.")
            assignment = inserted.data[0]
    else:
        assignment = existing[0]

    members = (
        supabase.table("organisation_team_members")
        .select("user_id")
        .eq("team_id", team_id)
        .eq("status", "active")
        .execute()
    ).data or []
    active_org_members = (
        supabase.table("organisation_members")
        .select("user_id")
        .eq("organisation_id", organisation_id)
        .eq("role", "learner")
        .eq("status", "active")
        .execute()
    ).data or []
    active_user_ids = {str(row["user_id"]) for row in active_org_members}
    members = [row for row in members if str(row["user_id"]) in active_user_ids]
    created = 0
    for member in members:
        current = (
            supabase.table("learnora_enrolments")
            .select("id")
            .eq("user_id", member["user_id"])
            .eq("course_id", course_id)
            .eq("organisation_id", organisation_id)
            .in_("status", ["active", "completed"])
            .limit(1)
            .execute()
        ).data or []
        if current:
            continue
        enrolled = supabase.table("learnora_enrolments").insert({
            "user_id": member["user_id"], "course_id": course_id,
            "organisation_id": organisation_id, "status": "active",
            "enrolled_at": now, "source_type": "team_assignment",
        }).execute()
        if enrolled.data:
            created += 1

    return {"success": True, "assignment": assignment, "enrolments_created": created}


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
    if body.status == "active":
        ensure_org_capacity(organisation_id, "teams")
    slug = _normalise_slug(body.slug or body.name)
    existing = supabase.table("organisation_teams").select("id").eq("organisation_id", organisation_id).eq("slug", slug).limit(1).execute()
    if existing.data:
        raise HTTPException(409, "A team with this slug already exists in the organisation.")
    manager_user_id = body.manager_user_id.strip() if body.manager_user_id and body.manager_user_id.strip() else None
    if manager_user_id:
        manager = supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", manager_user_id).eq("status", "active").limit(1).execute()
        if not manager.data:
            raise HTTPException(400, "The team manager must be an active organisation member.")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("organisation_teams").insert({
        "organisation_id": organisation_id,
        "name": body.name.strip(),
        "slug": slug,
        "description": body.description,
        "status": body.status,
        "manager_user_id": manager_user_id,
        "created_by": context.user_id,
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
    existing_team = (
        supabase.table("organisation_teams")
        .select("id,status")
        .eq("id", team_id)
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    ).data or []
    if not existing_team:
        raise HTTPException(404, "Team not found.")
    if changes.get("status") == "active" and existing_team[0].get("status") != "active":
        ensure_org_capacity(organisation_id, "teams")
    if "manager_user_id" in changes:
        manager_user_id = changes["manager_user_id"]
        manager_user_id = manager_user_id.strip() if isinstance(manager_user_id, str) and manager_user_id.strip() else None
        changes["manager_user_id"] = manager_user_id
        if manager_user_id:
            manager = supabase.table("organisation_members").select("id").eq("organisation_id", organisation_id).eq("user_id", manager_user_id).eq("status", "active").limit(1).execute()
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
    team = supabase.table("organisation_teams").select("id,organisation_id").eq("id", team_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not team.data:
        raise HTTPException(404, "Team not found.")
    rows = supabase.table("organisation_team_members").select("id,team_id,user_id,role,status,joined_at").eq("team_id", team_id).eq("status", "active").order("joined_at", desc=True).execute()
    active_org_members = (
        supabase.table("organisation_members").select("user_id")
        .eq("organisation_id", organisation_id).eq("status", "active").execute()
    ).data or []
    active_user_ids = {str(row["user_id"]) for row in active_org_members}
    visible = [row for row in (rows.data or []) if str(row["user_id"]) in active_user_ids]
    return {"success": True, "members": visible}


@router.post("/{organisation_id}/teams/{team_id}/members", status_code=201)
def add_team_member(
    organisation_id: str,
    team_id: str,
    body: TeamMemberCreate,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    organisation = _assert_organisation_scope(context, organisation_id)
    _require_active_organisation(organisation)
    team = supabase.table("organisation_teams").select("id,status").eq("id", team_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not team.data:
        raise HTTPException(404, "Team not found.")
    if team.data[0].get("status") != "active":
        raise HTTPException(409, "This team is inactive and cannot accept members.")
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
    organisation = _assert_organisation_scope(context, organisation_id)
    changes = {key: value for key, value in body.items() if key in {"role", "status"}}
    if not changes:
        raise HTTPException(400, "No supported team membership fields were supplied.")
    if "role" in changes and changes["role"] not in {"member", "lead", "manager"}:
        raise HTTPException(400, "Invalid team role.")
    if "status" in changes and changes["status"] not in {"active", "inactive"}:
        raise HTTPException(400, "Invalid team membership status.")
    team = supabase.table("organisation_teams").select("id,status").eq("id", team_id).eq("organisation_id", organisation_id).limit(1).execute()
    if not team.data:
        raise HTTPException(404, "Team not found.")
    existing_member = (
        supabase.table("organisation_team_members")
        .select("id,user_id,status")
        .eq("id", membership_id)
        .eq("team_id", team_id)
        .limit(1)
        .execute()
    ).data or []
    if not existing_member:
        raise HTTPException(404, "Team membership not found.")
    target_status = changes.get("status", existing_member[0].get("status"))
    if target_status == "active":
        _require_active_organisation(organisation)
        if team.data[0].get("status") != "active":
            raise HTTPException(409, "An inactive team cannot accept active memberships.")
        active_member = (
            supabase.table("organisation_members")
            .select("id")
            .eq("organisation_id", organisation_id)
            .eq("user_id", existing_member[0]["user_id"])
            .eq("status", "active")
            .limit(1)
            .execute()
        ).data or []
        if not active_member:
            raise HTTPException(400, "Team members must be active members of this organisation.")
    result = supabase.table("organisation_team_members").update(changes).eq("id", membership_id).eq("team_id", team_id).execute()
    if not result.data:
        raise HTTPException(404, "Team membership not found.")
    return {"success": True, "member": result.data[0]}


@router.post("/team-workspace/{team_id}/members", status_code=201)
def add_member_from_team_workspace(team_id: str, body: TeamMemberCreate, user: CurrentUser = Depends(get_current_user)):
    workspace = get_my_team_workspace(team_id, user)
    if not workspace.get("can_manage_team"):
        raise HTTPException(403, "Only team leads, team managers or organisation administrators can manage this team.")
    if body.role not in {"member", "lead", "manager"}:
        raise HTTPException(400, "Invalid team role.")
    organisation_id = str(workspace["team"]["organisation_id"])
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
    organisation_memberships = (
        supabase.table("organisation_members")
        .select("organisation_id,role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .execute()
    ).data or []
    organisation_ids = list({str(row["organisation_id"]) for row in organisation_memberships if row.get("organisation_id")})
    if not organisation_ids:
        return {"success": True, "teams": []}
    active_organisations = (
        supabase.table("organisations").select("id").in_("id", organisation_ids).eq("is_active", True).execute()
    ).data or []
    organisation_ids = [str(row["id"]) for row in active_organisations]
    if not organisation_ids:
        return {"success": True, "teams": []}
    organisation_roles = {str(row["organisation_id"]): row.get("role") for row in organisation_memberships if str(row.get("organisation_id")) in organisation_ids}
    team_memberships = (
        supabase.table("organisation_team_members")
        .select("team_id,role,status,joined_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .execute()
    ).data or []
    membership_map = {str(row["team_id"]): row for row in team_memberships}
    teams = (
        supabase.table("organisation_teams")
        .select("id,organisation_id,name,slug,description,status,manager_user_id")
        .in_("organisation_id", organisation_ids)
        .eq("status", "active")
        .order("name")
        .execute()
    ).data or []
    visible = []
    for team in teams:
        role = organisation_roles.get(str(team["organisation_id"]))
        membership = membership_map.get(str(team["id"]))
        is_assigned_manager = str(team.get("manager_user_id") or "") == str(user.id)
        if membership or is_assigned_manager or role in {"owner", "admin"}:
            visible.append({**team, "membership": membership, "organisation_role": role})
    return {"success": True, "teams": visible}


@router.get("/team-workspace/{team_id}")
def get_my_team_workspace(team_id: str, user: CurrentUser = Depends(get_current_user)):
    team_result = (
        supabase.table("organisation_teams")
        .select("id,organisation_id,name,slug,description,status,manager_user_id")
        .eq("id", team_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not team_result.data:
        raise HTTPException(404, "Team not found.")
    team = team_result.data[0]
    organisation_id = str(team["organisation_id"])
    organisation = (
        supabase.table("organisations").select("id,is_active").eq("id", organisation_id).limit(1).execute()
    ).data
    if not organisation or not organisation[0].get("is_active"):
        raise HTTPException(403, "This organisation workspace is inactive.")
    organisation_membership = (
        supabase.table("organisation_members")
        .select("id,role,status")
        .eq("organisation_id", organisation_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .execute()
    ).data
    if not organisation_membership:
        raise HTTPException(403, "You are not an active member of this organisation.")
    team_membership = (
        supabase.table("organisation_team_members")
        .select("id,role,status,joined_at")
        .eq("team_id", team_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .execute()
    ).data
    organisation_role = organisation_membership[0].get("role")
    if not team_membership and organisation_role not in {"owner", "admin"}:
        raise HTTPException(403, "You are not a member of this team.")
    members = (supabase.table("organisation_team_members").select("id,user_id,role,status,joined_at").eq("team_id", team_id).eq("status", "active").order("joined_at").execute()).data or []
    active_org_members = (supabase.table("organisation_members").select("user_id").eq("organisation_id", organisation_id).eq("status", "active").execute()).data or []
    active_user_ids = {str(row["user_id"]) for row in active_org_members}
    members = [row for row in members if str(row["user_id"]) in active_user_ids]
    user_ids = list({str(row["user_id"]) for row in members})
    users = (supabase.table("users").select("id,name").in_("id", user_ids).execute()).data or [] if user_ids else []
    user_map = {str(row["id"]): row for row in users}
    enriched_members = [{**row, "user": user_map.get(str(row["user_id"]))} for row in members]
    return {
        "success": True,
        "team": team,
        "organisation_role": organisation_role,
        "team_membership": team_membership[0] if team_membership else None,
        "can_manage_team": (
            bool(team_membership and team_membership[0].get("role") in {"lead", "manager"})
            or str(team.get("manager_user_id") or "") == str(user.id)
            or organisation_role in {"owner", "admin"}
        ),
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
            "organisations": [_with_capabilities(row) for row in (response.data or [])],
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
    organisation_type = _validate_organisation_type(payload.organisation_type)
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

    organisation = _with_capabilities(response.data[0])

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
        updates["organisation_type"] = _validate_organisation_type(
            payload.organisation_type
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

    organisation = _with_capabilities(response.data[0])

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