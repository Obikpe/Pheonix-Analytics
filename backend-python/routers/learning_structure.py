"""Programme, learning-path and cohort membership APIs."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .auth import supabase
from .permissions import PermissionContext, require_permission
from services.capacity import ensure_cohort_capacity
from services.cohort_membership import upsert_cohort_membership
from services.audit import audit

router = APIRouter(prefix="/api/learning", tags=["Learning Structure"])


class ProgrammeIn(BaseModel):
    organisation_id: str
    name: str
    slug: str
    description: str | None = None
    status: str = "draft"
    start_date: str | None = None
    end_date: str | None = None


class CourseLinkIn(BaseModel):
    course_id: str
    order_index: int = 0
    required: bool = True


class PathIn(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None
    organisation_id: str | None = None
    status: str = "draft"


class CohortMemberIn(BaseModel):
    user_id: str


def _scope(context, organisation_id):
    if context.is_platform_admin:
        return
    if str(context.organisation_id or "") != str(organisation_id):
        raise HTTPException(403, "Organisation access denied.")


@router.post("/programmes", status_code=201)
def create_programme(
    body: ProgrammeIn,
    context: PermissionContext = Depends(require_permission("courses.create")),
):
    _scope(context, body.organisation_id)
    result = supabase.table("learnora_programmes").insert({
        **body.model_dump(),
        "created_by": context.user_id,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Unable to create programme.")
    audit(
        actor_user_id=context.user_id,
        action="programme_created",
        resource_type="programme",
        resource_id=result.data[0]["id"],
        organisation_id=body.organisation_id,
    )
    return {"success": True, "programme": result.data[0]}


@router.get("/organisations/{organisation_id}/programmes")
def list_programmes(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _scope(context, organisation_id)
    result = (
        supabase.table("learnora_programmes")
        .select("*")
        .eq("organisation_id", organisation_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "programmes": result.data or []}


@router.post("/programmes/{programme_id}/courses", status_code=201)
def link_course(
    programme_id: str,
    body: CourseLinkIn,
    context: PermissionContext = Depends(require_permission("courses.assign")),
):
    programme = (
        supabase.table("learnora_programmes")
        .select("organisation_id")
        .eq("id", programme_id)
        .limit(1)
        .execute()
    )
    if not programme.data:
        raise HTTPException(404, "Programme not found.")
    _scope(context, programme.data[0]["organisation_id"])
    result = supabase.table("learnora_programme_courses").upsert(
        {"programme_id": programme_id, **body.model_dump()},
        on_conflict="programme_id,course_id",
    ).execute()
    return {"success": True, "course": result.data[0] if result.data else None}


@router.get("/programmes/{programme_id}")
def get_programme(
    programme_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    programme = (
        supabase.table("learnora_programmes")
        .select("*")
        .eq("id", programme_id)
        .limit(1)
        .execute()
    )
    if not programme.data:
        raise HTTPException(404, "Programme not found.")
    _scope(context, programme.data[0]["organisation_id"])
    courses = (
        supabase.table("learnora_programme_courses")
        .select("*")
        .eq("programme_id", programme_id)
        .order("order_index")
        .execute()
    )
    return {"success": True, "programme": programme.data[0], "courses": courses.data or []}


@router.post("/paths", status_code=201)
def create_path(
    body: PathIn,
    context: PermissionContext = Depends(require_permission("courses.create")),
):
    if body.organisation_id:
        _scope(context, body.organisation_id)
    payload = body.model_dump()
    payload.update({"owner_user_id": context.user_id, "created_by": context.user_id})
    result = supabase.table("learnora_learning_paths").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Unable to create learning path.")
    return {"success": True, "path": result.data[0]}


@router.get("/paths")
def list_paths(context: PermissionContext = Depends(require_permission("courses.view"))):
    result = (
        supabase.table("learnora_learning_paths")
        .select("*")
        .eq("owner_user_id", context.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "paths": result.data or []}


@router.post("/paths/{path_id}/courses", status_code=201)
def add_path_course(
    path_id: str,
    body: CourseLinkIn,
    context: PermissionContext = Depends(require_permission("courses.assign")),
):
    path = (
        supabase.table("learnora_learning_paths")
        .select("owner_user_id,organisation_id")
        .eq("id", path_id)
        .limit(1)
        .execute()
    )
    if not path.data:
        raise HTTPException(404, "Learning path not found.")
    owner = path.data[0]
    if owner.get("owner_user_id") != context.user_id and not context.is_platform_admin:
        raise HTTPException(403, "Learning path access denied.")
    result = supabase.table("learnora_learning_path_courses").upsert(
        {"path_id": path_id, **body.model_dump()},
        on_conflict="path_id,course_id",
    ).execute()
    return {"success": True, "course": result.data[0] if result.data else None}


@router.post("/cohorts/{cohort_id}/members", status_code=201)
def add_cohort_member(
    cohort_id: str,
    body: CohortMemberIn,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    cohort_result = (
        supabase.table("cohorts")
        .select("id,organisation_id,capacity,status")
        .eq("id", cohort_id)
        .limit(1)
        .execute()
    )
    if not cohort_result.data:
        raise HTTPException(404, "Cohort not found.")
    cohort = cohort_result.data[0]
    _scope(context, cohort["organisation_id"])
    if cohort.get("status") in {"completed", "expired", "closed", "archived"}:
        raise HTTPException(409, "Cohort is no longer accepting members.")

    # Cohort membership is authoritative; an organisation_members row is not
    # required. Verify the referenced account exists before linking it.
    user = (
        supabase.table("users")
        .select("id")
        .eq("id", body.user_id)
        .limit(1)
        .execute()
    )
    if not user.data:
        raise HTTPException(404, "Learner account not found.")

    existing = (
        supabase.table("cohort_members")
        .select("id,status")
        .eq("cohort_id", cohort_id)
        .eq("user_id", body.user_id)
        .limit(1)
        .execute()
    )
    already_active = bool(existing.data and existing.data[0].get("status") == "active")
    if not already_active:
        ensure_cohort_capacity(cohort_id, 1)

    member = upsert_cohort_membership(cohort_id, body.user_id)
    audit(
        actor_user_id=context.user_id,
        action="cohort_member_added",
        resource_type="cohort_member",
        resource_id=member["id"],
        organisation_id=cohort["organisation_id"],
    )
    return {"success": True, "member": member}
