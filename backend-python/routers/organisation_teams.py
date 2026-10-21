"""Customer organisation team management.

Team membership is resource-scoped. Being a team manager must never imply
organisation-wide administrator permissions.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import supabase
from .permissions import PermissionContext, require_permission
from services.capacity import ensure_org_capacity
from services.audit import audit

router = APIRouter(prefix="/api/organisation-teams", tags=["Organisation Teams"])

TEAM_MEMBER_ROLES = {"member", "lead", "manager"}


class TeamIn(BaseModel):
    organisation_id: str
    name: str = Field(min_length=2, max_length=150)
    slug: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=4000)
    manager_user_id: str | None = None


class TeamMemberIn(BaseModel):
    user_id: str
    role: str = "member"


def scope(context: PermissionContext, organisation_id: str):
    if context.is_platform_admin:
        return
    if str(context.organisation_id or "") != str(organisation_id):
        raise HTTPException(403, "Organisation access denied.")


def _active_organisation(organisation_id: str) -> dict:
    result = (
        supabase.table("organisations")
        .select("id,is_active,settings")
        .eq("id", organisation_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Organisation not found.")
    organisation = result.data[0]
    if not organisation.get("is_active"):
        raise HTTPException(409, "This organisation workspace is inactive.")
    return organisation


def _require_active_member(organisation_id: str, user_id: str) -> dict:
    result = (
        supabase.table("organisation_members")
        .select("id,user_id,role,status")
        .eq("organisation_id", organisation_id)
        .eq("user_id", user_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            400,
            "The user must be an active member of this organisation before joining a team.",
        )
    return result.data[0]


@router.post("", status_code=201)
def create_team(
    body: TeamIn,
    context: PermissionContext = Depends(require_permission("organisations.update")),
):
    scope(context, body.organisation_id)
    _active_organisation(body.organisation_id)

    manager_user_id = body.manager_user_id
    if manager_user_id:
        _require_active_member(body.organisation_id, manager_user_id)

    ensure_org_capacity(body.organisation_id, "teams", 1)
    slug = "-".join(body.slug.strip().lower().split())
    payload = body.model_dump()
    payload["slug"] = slug
    payload["name"] = body.name.strip()
    payload["description"] = body.description.strip() if body.description else None
    payload["created_by"] = context.user_id

    result = supabase.table("organisation_teams").insert(payload).execute()
    if not result.data:
        raise HTTPException(500, "Unable to create team.")

    team = result.data[0]
    audit(
        actor_user_id=context.user_id,
        action="organisation_team_created",
        resource_type="organisation_team",
        resource_id=team["id"],
        organisation_id=body.organisation_id,
    )
    return {"success": True, "team": team}


@router.get("/{organisation_id}")
def list_teams(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    scope(context, organisation_id)
    result = (
        supabase.table("organisation_teams")
        .select("*")
        .eq("organisation_id", organisation_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "teams": result.data or []}


@router.post("/{team_id}/members", status_code=201)
def add_member(
    team_id: str,
    body: TeamMemberIn,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    role = body.role.strip().lower()
    if role not in TEAM_MEMBER_ROLES:
        raise HTTPException(
            400,
            f"Invalid team role. Allowed values: {', '.join(sorted(TEAM_MEMBER_ROLES))}.",
        )

    result = (
        supabase.table("organisation_teams")
        .select("id,organisation_id,status")
        .eq("id", team_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Team not found.")

    team = result.data[0]
    scope(context, team["organisation_id"])
    _active_organisation(team["organisation_id"])
    if team.get("status") != "active":
        raise HTTPException(409, "This team is inactive and cannot accept members.")

    # This is the essential tenant boundary: a valid user ID alone is not
    # enough to grant membership in an organisation's team.
    _require_active_member(team["organisation_id"], body.user_id)

    member_payload = {
        "team_id": team_id,
        "user_id": body.user_id,
        "role": role,
        "status": "active",
    }
    saved = (
        supabase.table("organisation_team_members")
        .upsert(member_payload, on_conflict="team_id,user_id")
        .execute()
    )
    if not saved.data:
        raise HTTPException(500, "Unable to add team member.")
    return {"success": True, "member": saved.data[0]}


@router.get("/{team_id}/members")
def team_members(
    team_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    result = (
        supabase.table("organisation_teams")
        .select("organisation_id")
        .eq("id", team_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Team not found.")
    scope(context, result.data[0]["organisation_id"])

    members = (
        supabase.table("organisation_team_members")
        .select("*")
        .eq("team_id", team_id)
        .eq("status", "active")
        .execute()
    )
    return {"success": True, "members": members.data or []}
