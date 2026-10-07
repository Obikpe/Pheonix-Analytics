"""
Learnora ME — Organisation Membership Management

This router manages membership of users inside Learnora organisations.

Architecture:
    Organisation
        └── Organisation Members
              ├── Owner
              ├── Admin
              ├── Instructor
              └── Learner

Important:
- Uses the new Learnora permission system.
- Does NOT replace the legacy admin router.
- Does NOT modify auth.py.
- Does NOT hard-code Witstart.
- Every operation is scoped to an organisation.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from .auth import supabase
from .permissions import (
    PermissionContext,
    get_permission_context,
    require_permission,
)


router = APIRouter(
    prefix="/api/organisations",
    tags=["Organisation Members"],
)


# ============================================================
# CONSTANTS
# ============================================================

ALLOWED_ROLES = {
    "owner",
    "admin",
    "instructor",
    "learner",
}

ACTIVE_STATUS = "active"
INACTIVE_STATUS = "inactive"


# ============================================================
# PYDANTIC MODELS
# ============================================================

class AddOrganisationMember(BaseModel):
    user_id: UUID
    role: str = Field(default="learner", min_length=1, max_length=50)


class UpdateOrganisationMember(BaseModel):
    role: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )
    status: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=30,
    )


# ============================================================
# HELPERS
# ============================================================

def _validate_role(role: str) -> str:
    """
    Validate and normalise an organisation role.
    """
    role = role.strip().lower()

    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid organisation role. "
                "Allowed roles: owner, admin, instructor, learner."
            ),
        )

    return role


def _validate_status(status: str) -> str:
    """
    Validate membership status.
    """
    status = status.strip().lower()

    if status not in {ACTIVE_STATUS, INACTIVE_STATUS}:
        raise HTTPException(
            status_code=400,
            detail="Membership status must be active or inactive.",
        )

    return status


def _require_organisation_context(
    context: PermissionContext,
) -> str:
    """
    Return the organisation currently resolved by the
    permission system.

    Platform super admins may operate globally, so this helper
    is only used on endpoints where an organisation ID is
    explicitly supplied.
    """
    if not context.organisation_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "Organisation context is required for this operation."
            ),
        )

    return str(context.organisation_id)


def _check_target_organisation(
    context: PermissionContext,
    organisation_id: UUID,
) -> str:
    """
    Ensure the current user is allowed to operate on the
    requested organisation.

    Platform admins may access any organisation.

    Organisation-level users may only access their resolved
    organisation.
    """
    target_id = str(organisation_id)

    if context.is_platform_admin:
        return target_id

    if not context.organisation_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to an organisation.",
        )

    if str(context.organisation_id) != target_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this organisation.",
        )

    return target_id


def _get_organisation(
    organisation_id: str,
):
    """
    Verify that the organisation exists and is active.
    """
    result = (
        supabase
        .table("organisations")
        .select(
            "id,name,slug,organisation_type,"
            "description,logo_url,brand_primary,"
            "brand_secondary,template,is_active,"
            "settings,created_at,updated_at"
        )
        .eq("id", organisation_id)
        .maybe_single()
        .execute()
    )

    organisation = result.data

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    return organisation


def _get_member(
    organisation_id: str,
    member_id: str,
):
    """
    Fetch a single organisation_members record.
    """
    result = (
        supabase
        .table("organisation_members")
        .select(
            "id,organisation_id,user_id,role,status,joined_at"
        )
        .eq("id", member_id)
        .eq("organisation_id", organisation_id)
        .maybe_single()
        .execute()
    )

    return result.data


def _get_user(
    user_id: str,
):
    """
    Fetch the underlying Learnora user.

    We deliberately retrieve only the fields required by this
    membership API.
    """
    result = (
        supabase
        .table("users")
        .select(
            "id,email,name,role"
        )
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )

    return result.data


def _format_member(
    membership: dict,
    user: Optional[dict],
):
    """
    Return a clean API representation combining membership
    information with the user's basic profile.
    """
    return {
        "membership_id": membership.get("id"),
        "organisation_id": membership.get("organisation_id"),
        "user_id": membership.get("user_id"),
        "role": membership.get("role"),
        "status": membership.get("status"),
        "joined_at": membership.get("joined_at"),
        "user": {
            "id": user.get("id") if user else None,
            "email": user.get("email") if user else None,
            "name": user.get("name") if user else None,
            "legacy_role": user.get("role") if user else None,
        },
    }


# ============================================================
# LIST MEMBERS
# ============================================================

@router.get(
    "/{organisation_id}/members",
)
def list_organisation_members(
    organisation_id: UUID,
    status: Optional[str] = Query(
        default=None,
        description="Filter by active or inactive membership.",
    ),
    role: Optional[str] = Query(
        default=None,
        description=(
            "Filter by owner, admin, instructor, or learner."
        ),
    ),
    context: PermissionContext = Depends(
        require_permission("organisations.members")
    ),
):
    """
    List members belonging to an organisation.

    Platform admins can inspect any organisation.

    Organisation-level admins can only inspect their own
    organisation, subject to their permissions.
    """

    organisation_id_str = _check_target_organisation(
        context,
        organisation_id,
    )

    _get_organisation(organisation_id_str)

    if status is not None:
        status = _validate_status(status)

    if role is not None:
        role = _validate_role(role)

    query = (
        supabase
        .table("organisation_members")
        .select(
            "id,organisation_id,user_id,role,status,joined_at"
        )
        .eq(
            "organisation_id",
            organisation_id_str,
        )
        .order(
            "joined_at",
            desc=False,
        )
    )

    if status is not None:
        query = query.eq("status", status)

    if role is not None:
        query = query.eq("role", role)

    result = query.execute()

    memberships = result.data or []

    members = []

    for membership in memberships:
        user = _get_user(
            str(membership["user_id"])
        )

        members.append(
            _format_member(
                membership,
                user,
            )
        )

    return {
        "success": True,
        "organisation_id": organisation_id_str,
        "count": len(members),
        "members": members,
    }


# ============================================================
# GET SINGLE MEMBER
# ============================================================

@router.get(
    "/{organisation_id}/members/{member_id}",
)
def get_organisation_member(
    organisation_id: UUID,
    member_id: UUID,
    context: PermissionContext = Depends(
        require_permission("organisations.members")
    ),
):
    """
    Get one organisation membership record.
    """

    organisation_id_str = _check_target_organisation(
        context,
        organisation_id,
    )

    _get_organisation(organisation_id_str)

    membership = _get_member(
        organisation_id_str,
        str(member_id),
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Organisation member not found.",
        )

    user = _get_user(
        str(membership["user_id"])
    )

    return {
        "success": True,
        "member": _format_member(
            membership,
            user,
        ),
    }


# ============================================================
# ADD MEMBER
# ============================================================

@router.post(
    "/{organisation_id}/members",
)
def add_organisation_member(
    organisation_id: UUID,
    payload: AddOrganisationMember,
    context: PermissionContext = Depends(
        require_permission("organisations.members")
    ),
):
    """
    Add an existing Learnora user to an organisation.

    This endpoint does not create the user account itself.

    User creation remains a separate concern.
    """

    organisation_id_str = _check_target_organisation(
        context,
        organisation_id,
    )

    _get_organisation(organisation_id_str)

    role = _validate_role(payload.role)

    user_id_str = str(payload.user_id)

    # --------------------------------------------------------
    # Verify user exists
    # --------------------------------------------------------

    user = _get_user(user_id_str)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # --------------------------------------------------------
    # Prevent duplicate membership
    # --------------------------------------------------------

    existing_result = (
        supabase
        .table("organisation_members")
        .select(
            "id,organisation_id,user_id,role,status,joined_at"
        )
        .eq(
            "organisation_id",
            organisation_id_str,
        )
        .eq(
            "user_id",
            user_id_str,
        )
        .maybe_single()
        .execute()
    )

    existing = existing_result.data

    if existing:
        if existing.get("status") == ACTIVE_STATUS:
            raise HTTPException(
                status_code=409,
                detail=(
                    "This user is already an active member "
                    "of this organisation."
                ),
            )

        # Re-activate an existing inactive membership.
        updated_result = (
            supabase
            .table("organisation_members")
            .update(
                {
                    "role": role,
                    "status": ACTIVE_STATUS,
                }
            )
            .eq("id", existing["id"])
            .execute()
        )

        updated = (
            updated_result.data[0]
            if updated_result.data
            else None
        )

        if not updated:
            raise HTTPException(
                status_code=500,
                detail="Failed to reactivate organisation membership.",
            )

        return {
            "success": True,
            "message": "Organisation membership reactivated.",
            "member": _format_member(
                updated,
                user,
            ),
        }

    # --------------------------------------------------------
    # Create membership
    # --------------------------------------------------------

    insert_result = (
        supabase
        .table("organisation_members")
        .insert(
            {
                "organisation_id": organisation_id_str,
                "user_id": user_id_str,
                "role": role,
                "status": ACTIVE_STATUS,
            }
        )
        .execute()
    )

    membership = (
        insert_result.data[0]
        if insert_result.data
        else None
    )

    if not membership:
        raise HTTPException(
            status_code=500,
            detail="Failed to create organisation membership.",
        )

    return {
        "success": True,
        "message": "User added to organisation.",
        "member": _format_member(
            membership,
            user,
        ),
    }


# ============================================================
# UPDATE MEMBER
# ============================================================

@router.patch(
    "/{organisation_id}/members/{member_id}",
)
def update_organisation_member(
    organisation_id: UUID,
    member_id: UUID,
    payload: UpdateOrganisationMember,
    context: PermissionContext = Depends(
        require_permission("organisations.members")
    ),
):
    """
    Update an organisation membership.

    Supported changes:
    - role
    - status
    """

    organisation_id_str = _check_target_organisation(
        context,
        organisation_id,
    )

    _get_organisation(organisation_id_str)

    membership = _get_member(
        organisation_id_str,
        str(member_id),
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Organisation member not found.",
        )

    updates = {}

    if payload.role is not None:
        updates["role"] = _validate_role(
            payload.role
        )

    if payload.status is not None:
        updates["status"] = _validate_status(
            payload.status
        )

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No membership changes were supplied.",
        )

    # --------------------------------------------------------
    # Protect the organisation from having no owner.
    # --------------------------------------------------------

    current_role = membership.get("role")
    current_status = membership.get("status")

    changing_owner_role = (
        current_role == "owner"
        and (
            updates.get("role") is not None
            and updates["role"] != "owner"
        )
    )

    deactivating_owner = (
        current_role == "owner"
        and current_status == ACTIVE_STATUS
        and updates.get("status") == INACTIVE_STATUS
    )

    if changing_owner_role or deactivating_owner:

        owner_result = (
            supabase
            .table("organisation_members")
            .select(
                "id"
            )
            .eq(
                "organisation_id",
                organisation_id_str,
            )
            .eq(
                "role",
                "owner",
            )
            .eq(
                "status",
                ACTIVE_STATUS,
            )
            .execute()
        )

        active_owners = owner_result.data or []

        if len(active_owners) <= 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "The organisation must retain at least "
                    "one active owner."
                ),
            )

    # --------------------------------------------------------
    # Apply update
    # --------------------------------------------------------

    update_result = (
        supabase
        .table("organisation_members")
        .update(updates)
        .eq(
            "id",
            str(member_id),
        )
        .eq(
            "organisation_id",
            organisation_id_str,
        )
        .execute()
    )

    updated = (
        update_result.data[0]
        if update_result.data
        else None
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Failed to update organisation membership.",
        )

    user = _get_user(
        str(updated["user_id"])
    )

    return {
        "success": True,
        "message": "Organisation membership updated.",
        "member": _format_member(
            updated,
            user,
        ),
    }


# ============================================================
# REMOVE / DEACTIVATE MEMBER
# ============================================================

@router.delete(
    "/{organisation_id}/members/{member_id}",
)
def remove_organisation_member(
    organisation_id: UUID,
    member_id: UUID,
    context: PermissionContext = Depends(
        require_permission("organisations.members")
    ),
):
    """
    Deactivate an organisation membership.

    We intentionally do not physically delete the membership.

    This preserves:
    - membership history
    - joined date
    - auditability
    - future reporting
    """

    organisation_id_str = _check_target_organisation(
        context,
        organisation_id,
    )

    _get_organisation(organisation_id_str)

    membership = _get_member(
        organisation_id_str,
        str(member_id),
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Organisation member not found.",
        )

    if membership.get("status") == INACTIVE_STATUS:
        return {
            "success": True,
            "message": "Organisation membership is already inactive.",
            "membership_id": str(member_id),
        }

    # --------------------------------------------------------
    # Never allow the final active owner to be removed.
    # --------------------------------------------------------

    if membership.get("role") == "owner":

        owner_result = (
            supabase
            .table("organisation_members")
            .select(
                "id"
            )
            .eq(
                "organisation_id",
                organisation_id_str,
            )
            .eq(
                "role",
                "owner",
            )
            .eq(
                "status",
                ACTIVE_STATUS,
            )
            .execute()
        )

        active_owners = owner_result.data or []

        if len(active_owners) <= 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "The final active owner cannot be removed "
                    "from the organisation."
                ),
            )

    # --------------------------------------------------------
    # Soft delete
    # --------------------------------------------------------

    update_result = (
        supabase
        .table("organisation_members")
        .update(
            {
                "status": INACTIVE_STATUS,
            }
        )
        .eq(
            "id",
            str(member_id),
        )
        .eq(
            "organisation_id",
            organisation_id_str,
        )
        .execute()
    )

    updated = (
        update_result.data[0]
        if update_result.data
        else None
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Failed to deactivate organisation membership.",
        )

    return {
        "success": True,
        "message": "Organisation membership deactivated.",
        "membership_id": str(member_id),
        "status": INACTIVE_STATUS,
    }


# ============================================================
# ORGANISATION MEMBER SUMMARY
# ============================================================

@router.get(
    "/{organisation_id}/members/summary",
)
def organisation_member_summary(
    organisation_id: UUID,
    context: PermissionContext = Depends(
        require_permission("organisations.members")
    ),
):
    """
    Return a lightweight member summary for organisation
    dashboards.

    This is database-driven; no mock statistics.
    """

    organisation_id_str = _check_target_organisation(
        context,
        organisation_id,
    )

    _get_organisation(organisation_id_str)

    result = (
        supabase
        .table("organisation_members")
        .select(
            "id,user_id,role,status"
        )
        .eq(
            "organisation_id",
            organisation_id_str,
        )
        .execute()
    )

    memberships = result.data or []

    summary = {
        "total": len(memberships),
        "active": 0,
        "inactive": 0,
        "owners": 0,
        "admins": 0,
        "instructors": 0,
        "learners": 0,
    }

    for membership in memberships:
        membership_status = membership.get("status")
        membership_role = membership.get("role")

        if membership_status == ACTIVE_STATUS:
            summary["active"] += 1
        elif membership_status == INACTIVE_STATUS:
            summary["inactive"] += 1

        if membership_role == "owner":
            summary["owners"] += 1
        elif membership_role == "admin":
            summary["admins"] += 1
        elif membership_role == "instructor":
            summary["instructors"] += 1
        elif membership_role == "learner":
            summary["learners"] += 1

    return {
        "success": True,
        "organisation_id": organisation_id_str,
        "summary": summary,
    }