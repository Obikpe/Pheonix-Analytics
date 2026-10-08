"""
Learnora administrator management.

Administrator roles
------------------
super_admin
    Full Learnora platform control.

staff_admin
    Internal Learnora staff administrator.
    Can manage normal Learnora learners.

witstart_admin
    Administrator for the separate WitStart environment.
    Can manage WitStart learners only.

Learners
--------
normal
witstart
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .auth import (
    supabase,
    CurrentUser,
    hash_password,
    norm_email,
    check_password_rules,
    require_super_admin,
    require_learnora_admin,
    require_witstart_admin,
    require_admin,
    log_audit_event,
    log_security_event,
)


router = APIRouter()


# ---------------------------------------------------------------------------
# DATABASE COLUMNS
# ---------------------------------------------------------------------------

SAFE_USER_COLUMNS = (
    "id, email, name, role, sub_status, is_paid, "
    "subscription_tier, created_at, expires_at, "
    "trial_ends_at"
)

SAFE_ADMIN_COLUMNS = (
    "id, email, name, role, is_active, "
    "last_login_at, created_at, updated_at, notes"
)


# ---------------------------------------------------------------------------
# MODELS
# ---------------------------------------------------------------------------

class CreateLearner(BaseModel):
    email: str
    name: Optional[str] = None
    password: str
    role: str = "normal"


class UpdateLearner(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_paid: Optional[bool] = None
    sub_status: Optional[str] = None


class CreateAdmin(BaseModel):
    email: str
    name: Optional[str] = None
    password: str
    role: str


class UpdateAdmin(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    password: Optional[str] = None


class GrantFreeRequest(BaseModel):
    email: str
    months: int = Field(
        default=1,
        ge=1,
        le=12,
    )


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

VALID_ADMIN_ROLES = {
    "super_admin",
    "staff_admin",
    "witstart_admin",
}

VALID_LEARNER_ROLES = {
    "normal",
    "witstart",
}


def _get_admin(admin_id: int):
    response = (
        supabase
        .table("admins")
        .select(
            "id, email, name, password_hash, role, "
            "is_active, last_login_at, created_at, "
            "updated_at, notes"
        )
        .eq("id", admin_id)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return rows[0] if rows else None


def _get_user(email: str):
    response = (
        supabase
        .table("users")
        .select("*")
        .eq("email", email)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return rows[0] if rows else None


def _admin_count(
    role: Optional[str] = None,
    active_only: bool = False,
):
    query = (
        supabase
        .table("admins")
        .select("id", count="exact")
    )

    if role:
        query = query.eq("role", role)

    if active_only:
        query = query.eq("is_active", True)

    result = query.execute()

    return result.count or 0


def _ensure_email_is_available(
    email: str,
    exclude_admin_id: Optional[int] = None,
):
    # Check admins.
    admin_query = (
        supabase
        .table("admins")
        .select("id")
        .eq("email", email)
    )

    if exclude_admin_id is not None:
        admin_query = admin_query.neq(
            "id",
            exclude_admin_id,
        )

    if admin_query.limit(1).execute().data:
        raise HTTPException(
            status_code=400,
            detail="An administrator with this email already exists",
        )

    # Check learners.
    if (
        supabase
        .table("users")
        .select("id")
        .eq("email", email)
        .limit(1)
        .execute()
        .data
    ):
        raise HTTPException(
            status_code=400,
            detail="A learner with this email already exists",
        )


def _can_manage_learner(
    admin: CurrentUser,
    learner_role: str,
) -> bool:

    if admin.role == "super_admin":
        return learner_role in VALID_LEARNER_ROLES

    if admin.role == "staff_admin":
        return learner_role == "normal"

    if admin.role == "witstart_admin":
        return learner_role == "witstart"

    return False


def _can_manage_admin(
    admin: CurrentUser,
    target_role: str,
) -> bool:

    # Only super admin can manage administrators.
    if admin.role != "super_admin":
        return False

    return target_role in VALID_ADMIN_ROLES


# ---------------------------------------------------------------------------
# OVERVIEW / STATS
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_admin_stats(
    admin: CurrentUser = Depends(require_admin),
):
    """
    Role-scoped administrator statistics.

    super_admin:
        Full platform statistics.

    staff_admin:
        Learnora/normal learner statistics only.

    witstart_admin:
        WitStart learner statistics only.

    Statistics are calculated from actual database records.
    No revenue or other values are estimated.
    """

    try:
        users_result = (
            supabase
            .table("users")
            .select(
                "id, role, sub_status, is_paid, created_at",
            )
            .execute()
        )

        users = users_result.data or []

        # Only Super Admin needs administrator-account statistics.
        admins = []

        if admin.role == "super_admin":
            admins_result = (
                supabase
                .table("admins")
                .select(
                    "id, role, is_active",
                )
                .execute()
            )

            admins = admins_result.data or []

    except Exception as exc:
        print(f"Failed to load admin stats: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to load administrator statistics",
        )

    # ---------------------------------------------------------------
    # SCOPE USERS BY ADMIN ROLE
    # ---------------------------------------------------------------

    if admin.role == "super_admin":
        scoped_users = users

    elif admin.role == "staff_admin":
        scoped_users = [
            u for u in users
            if u.get("role") == "normal"
        ]

    elif admin.role == "witstart_admin":
        scoped_users = [
            u for u in users
            if u.get("role") == "witstart"
        ]

    else:
        raise HTTPException(
            status_code=403,
            detail="Invalid administrator role",
        )

    # ---------------------------------------------------------------
    # LEARNER COUNTS
    # ---------------------------------------------------------------

    normal = [
        u for u in scoped_users
        if u.get("role") == "normal"
    ]

    witstart = [
        u for u in scoped_users
        if u.get("role") == "witstart"
    ]

    active = [
        u for u in scoped_users
        if u.get("sub_status") in {
            "active",
            "trialing",
        }
    ]

    paid = [
        u for u in scoped_users
        if u.get("is_paid") is True
    ]

    pending = [
        u for u in scoped_users
        if u.get("sub_status") not in {
            "active",
            "trialing",
        }
    ]

    response = {
        "status": "success",
        "scope": admin.role,
        "users": {
            "total": len(scoped_users),
            "normal": len(normal),
            "witstart": len(witstart),
            "active": len(active),
            "paid": len(paid),
            "pending": len(pending),
        },
        "billing": {
            "note": (
                "Revenue is not calculated here because the current "
                "endpoint does not have authoritative payment transaction data."
            ),
        },
    }

    # ---------------------------------------------------------------
    # SUPER ADMIN ONLY
    # ---------------------------------------------------------------

    if admin.role == "super_admin":
        active_admins = [
            a for a in admins
            if a.get("is_active") is True
        ]

        response["admins"] = {
            "total": len(admins),
            "active": len(active_admins),
            "super_admin": len([
                a for a in admins
                if a.get("role") == "super_admin"
            ]),
            "staff_admin": len([
                a for a in admins
                if a.get("role") == "staff_admin"
            ]),
            "witstart_admin": len([
                a for a in admins
                if a.get("role") == "witstart_admin"
            ]),
        }

    return response


# ---------------------------------------------------------------------------
# LEARNERS
# ---------------------------------------------------------------------------

@router.get("/users")
def get_all_users(
    admin: CurrentUser = Depends(require_admin),
):
    """
    Returns learners according to administrator scope.

    super_admin:
        all learners

    staff_admin:
        normal learners

    witstart_admin:
        WitStart learners
    """

    query = (
        supabase
        .table("users")
        .select(SAFE_USER_COLUMNS)
        .order("created_at", desc=True)
    )

    if admin.role == "staff_admin":
        query = query.eq("role", "normal")

    elif admin.role == "witstart_admin":
        query = query.eq("role", "witstart")

    response = query.execute()

    return {
        "users": response.data or [],
    }


@router.get("/users/{email}")
def get_user(
    email: str,
    admin: CurrentUser = Depends(require_admin),
):
    email = norm_email(email)

    user = _get_user(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    role = user.get("role") or "normal"

    if not _can_manage_learner(admin, role):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this learner",
        )

    safe = {
        key: user.get(key)
        for key in SAFE_USER_COLUMNS.split(", ")
    }

    return {
        "user": safe,
    }


@router.post("/users", status_code=201)
def create_user(
    payload: CreateLearner,
    request: Request,
    admin: CurrentUser = Depends(require_admin),
):
    email = norm_email(payload.email)

    check_password_rules(payload.password)

    role = (payload.role or "normal").strip()

    if role not in VALID_LEARNER_ROLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be one of: "
                "normal, witstart"
            ),
        )

    if not _can_manage_learner(admin, role):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission to create "
                f"{role} learners"
            ),
        )

    _ensure_email_is_available(email)

    now = datetime.now(timezone.utc)

    expires_at = None

    # WitStart accounts get the default 91-day period.
    if role == "witstart":
        expires_at = (
            now + timedelta(days=91)
        ).isoformat()

    row = {
        "email": email,
        "name": (
            (payload.name or "").strip()[:100]
            or None
        ),
        "password_hash": hash_password(
            payload.password
        ),
        "role": role,
        "sub_status": "active",
        "is_paid": True,
        "subscription_tier": (
            "witstart"
            if role == "witstart"
            else "paid"
        ),
        "created_at": now.isoformat(),
    }

    if expires_at:
        row["expires_at"] = expires_at

    try:
        response = (
            supabase
            .table("users")
            .insert(row)
            .execute()
        )

    except Exception as exc:
        print(f"Failed to create learner: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to create learner",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create learner",
        )

    log_audit_event(
        action="learner_created",
        email=email,
        account_type="learner",
        role=role,
        request=request,
        metadata={
            "created_by": admin.email,
            "created_by_role": admin.role,
        },
    )

    return {
        "status": "success",
        "message": "Learner created successfully",
        "email": email,
        "role": role,
        "expires_at": expires_at,
    }


@router.patch("/users/{email}")
def update_user(
    email: str,
    payload: UpdateLearner,
    request: Request,
    admin: CurrentUser = Depends(require_admin),
):
    email = norm_email(email)

    user = _get_user(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    current_role = user.get("role") or "normal"

    if not _can_manage_learner(
        admin,
        current_role,
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this learner",
        )

    new_role = payload.role or current_role

    if new_role not in VALID_LEARNER_ROLES:
        raise HTTPException(
            status_code=400,
            detail="Invalid learner role",
        )

    if not _can_manage_learner(
        admin,
        new_role,
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot move this learner to that role",
        )

    updates = {}

    if payload.name is not None:
        updates["name"] = (
            payload.name.strip()[:100]
            or None
        )

    if payload.role is not None:
        updates["role"] = new_role

    if payload.is_paid is not None:
        updates["is_paid"] = payload.is_paid

    if payload.sub_status is not None:
        updates["sub_status"] = payload.sub_status

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied",
        )

    try:
        response = (
            supabase
            .table("users")
            .update(updates)
            .eq("email", email)
            .execute()
        )

    except Exception as exc:
        print(f"Failed to update learner: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to update learner",
        )

    log_audit_event(
        action="learner_updated",
        email=email,
        account_type="learner",
        role=new_role,
        request=request,
        metadata={
            "updated_by": admin.email,
            "updated_by_role": admin.role,
            "changes": updates,
        },
    )

    return {
        "status": "success",
        "message": "Learner updated successfully",
        "changes": updates,
        "user": response.data[0]
        if response.data
        else None,
    }


@router.delete("/users/{email}")
def delete_user(
    email: str,
    request: Request,
    admin: CurrentUser = Depends(require_admin),
):
    email = norm_email(email)

    user = _get_user(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found or already deleted",
        )

    role = user.get("role") or "normal"

    if not _can_manage_learner(admin, role):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this learner",
        )

    try:
        response = (
            supabase
            .table("users")
            .delete()
            .eq("email", email)
            .execute()
        )

    except Exception as exc:
        print(f"Failed to delete learner: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to delete learner",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="User not found or already deleted",
        )

    log_audit_event(
        action="learner_deleted",
        email=email,
        account_type="learner",
        role=role,
        request=request,
        metadata={
            "deleted_by": admin.email,
            "deleted_by_role": admin.role,
        },
    )

    return {
        "status": "success",
        "message": f"User {email} deleted",
    }


# ---------------------------------------------------------------------------
# ADMIN MANAGEMENT
# ---------------------------------------------------------------------------

@router.get("/admins")
def get_admins(
    admin: CurrentUser = Depends(require_super_admin),
):
    response = (
        supabase
        .table("admins")
        .select(SAFE_ADMIN_COLUMNS)
        .order("created_at", desc=True)
        .execute()
    )

    return {
        "admins": response.data or [],
    }


@router.get("/admins/{admin_id}")
def get_admin(
    admin_id: int,
    admin: CurrentUser = Depends(require_super_admin),
):
    target = _get_admin(admin_id)

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Administrator not found",
        )

    safe = {
        key: target.get(key)
        for key in SAFE_ADMIN_COLUMNS.split(", ")
    }

    return {
        "admin": safe,
    }


@router.post("/admins", status_code=201)
def create_admin(
    payload: CreateAdmin,
    request: Request,
    admin: CurrentUser = Depends(require_super_admin),
):
    email = norm_email(payload.email)

    check_password_rules(payload.password)

    role = (payload.role or "").strip()

    if role not in VALID_ADMIN_ROLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be one of: "
                "super_admin, staff_admin, witstart_admin"
            ),
        )

    _ensure_email_is_available(email)

    now = datetime.now(timezone.utc)

    row = {
        "email": email,
        "name": (
            (payload.name or "").strip()[:100]
            or None
        ),
        "password_hash": hash_password(
            payload.password
        ),
        "role": role,
        "is_active": True,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    try:
        response = (
            supabase
            .table("admins")
            .insert(row)
            .execute()
        )

    except Exception as exc:
        print(f"Failed to create administrator: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to create administrator",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create administrator",
        )

    log_audit_event(
        action="admin_created",
        email=email,
        account_type="admin",
        role=role,
        request=request,
        metadata={
            "created_by": admin.email,
            "created_by_role": admin.role,
        },
    )

    return {
        "status": "success",
        "message": "Administrator created successfully",
        "admin": {
            "id": response.data[0].get("id"),
            "email": email,
            "name": row["name"],
            "role": role,
            "is_active": True,
        },
    }


@router.patch("/admins/{admin_id}")
def update_admin(
    admin_id: int,
    payload: UpdateAdmin,
    request: Request,
    admin: CurrentUser = Depends(require_super_admin),
):
    target = _get_admin(admin_id)

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Administrator not found",
        )

    updates = {}

    target_role = target.get("role")

    # ---------------------------------------------------------------
    # ROLE
    # ---------------------------------------------------------------

    if payload.role is not None:

        new_role = payload.role.strip()

        if new_role not in VALID_ADMIN_ROLES:
            raise HTTPException(
                status_code=400,
                detail="Invalid administrator role",
            )

        # Prevent accidentally removing the final active super admin.
        if (
            target_role == "super_admin"
            and new_role != "super_admin"
            and target.get("is_active") is True
        ):
            count = _admin_count(
                role="super_admin",
                active_only=True,
            )

            if count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "You cannot change the role of the last "
                        "active super administrator."
                    ),
                )

        updates["role"] = new_role

    # ---------------------------------------------------------------
    # NAME
    # ---------------------------------------------------------------

    if payload.name is not None:
        updates["name"] = (
            payload.name.strip()[:100]
            or None
        )

    # ---------------------------------------------------------------
    # ACTIVE STATUS
    # ---------------------------------------------------------------

    if payload.is_active is not None:

        # Cannot deactivate yourself.
        if (
            target["id"] == admin.id
            and payload.is_active is False
        ):
            raise HTTPException(
                status_code=400,
                detail="You cannot deactivate your own account.",
            )

        # Prevent deactivating the last super admin.
        if (
            target_role == "super_admin"
            and payload.is_active is False
            and target.get("is_active") is True
        ):
            count = _admin_count(
                role="super_admin",
                active_only=True,
            )

            if count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "You cannot deactivate the last "
                        "active super administrator."
                    ),
                )

        updates["is_active"] = payload.is_active

    # ---------------------------------------------------------------
    # NOTES
    # ---------------------------------------------------------------

    if payload.notes is not None:
        updates["notes"] = (
            payload.notes.strip()[:2000]
            or None
        )

    # ---------------------------------------------------------------
    # PASSWORD
    # ---------------------------------------------------------------

    if payload.password is not None:

        check_password_rules(
            payload.password
        )

        updates["password_hash"] = hash_password(
            payload.password
        )

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied",
        )

    try:
        response = (
            supabase
            .table("admins")
            .update(updates)
            .eq("id", admin_id)
            .execute()
        )

    except Exception as exc:
        print(f"Failed to update administrator: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to update administrator",
        )

    log_audit_event(
        action="admin_updated",
        email=target.get("email"),
        account_type="admin",
        role=updates.get(
            "role",
            target_role,
        ),
        request=request,
        metadata={
            "updated_by": admin.email,
            "updated_by_role": admin.role,
            "changes": {
                key: value
                for key, value in updates.items()
                if key != "password_hash"
            },
        },
    )

    return {
        "status": "success",
        "message": "Administrator updated successfully",
        "admin": response.data[0]
        if response.data
        else None,
    }


@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: int,
    request: Request,
    admin: CurrentUser = Depends(require_super_admin),
):
    target = _get_admin(admin_id)

    if not target:
        raise HTTPException(
            status_code=404,
            detail="Administrator not found",
        )

    if str(target["id"]) == str(admin.id):
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own administrator account.",
        )

    target_role = target.get("role")

    # Never allow the last active super admin to disappear.
    if (
        target_role == "super_admin"
        and target.get("is_active") is True
    ):
        count = _admin_count(
            role="super_admin",
            active_only=True,
        )

        if count <= 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot delete the last "
                    "active super administrator."
                ),
            )

    try:
        response = (
            supabase
            .table("admins")
            .delete()
            .eq("id", admin_id)
            .execute()
        )

    except Exception as exc:
        print(f"Failed to delete administrator: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to delete administrator",
        )

    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Administrator not found or already deleted",
        )

    log_audit_event(
        action="admin_deleted",
        email=target.get("email"),
        account_type="admin",
        role=target_role,
        request=request,
        metadata={
            "deleted_by": admin.email,
            "deleted_by_role": admin.role,
            "deleted_admin_id": admin_id,
        },
    )

    return {
        "status": "success",
        "message": (
            f"Administrator {target.get('email')} deleted"
        ),
    }


# ---------------------------------------------------------------------------
# FREE MONTH
# ---------------------------------------------------------------------------

@router.post("/grant-free-month")
def grant_free_month(
    payload: GrantFreeRequest,
    request: Request,
    admin: CurrentUser = Depends(require_super_admin),
):
    email = norm_email(payload.email)

    user = _get_user(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    role = user.get("role") or "normal"

    # Free-month grants are intentionally restricted
    # to normal Learnora learners.
    if role != "normal":
        raise HTTPException(
            status_code=400,
            detail=(
                "Free-month grants through this endpoint "
                "are only available to normal Learnora learners."
            ),
        )

    now = datetime.now(timezone.utc)

    base_str = (
        user.get("trial_ends_at")
        or user.get("expires_at")
    )

    base = now

    if base_str:
        try:
            base = datetime.fromisoformat(
                str(base_str)
            )

            if base.tzinfo is None:
                base = base.replace(
                    tzinfo=timezone.utc
                )

        except ValueError:
            base = now

    if base < now:
        base = now

    new_expiry = (
        base
        + timedelta(
            days=30 * payload.months
        )
    ).isoformat()

    updates = {
        "trial_ends_at": new_expiry,
        "sub_status": "active",
    }

    try:
        response = (
            supabase
            .table("users")
            .update(updates)
            .eq("email", email)
            .execute()
        )

    except Exception as exc:
        print(
            f"Failed to grant free month: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to grant free month",
        )

    log_audit_event(
        action="free_month_granted",
        email=email,
        account_type="learner",
        role="normal",
        request=request,
        metadata={
            "months": payload.months,
            "new_expiry": new_expiry,
            "granted_by": admin.email,
            "granted_by_role": admin.role,
        },
    )

    return {
        "status": "success",
        "message": (
            f"Granted {payload.months} month(s) "
            f"to {email}"
        ),
        "new_expiry": new_expiry,
        "user": (
            response.data[0]
            if response.data
            else None
        ),
    }


# ---------------------------------------------------------------------------
# ACTIVITY
# ---------------------------------------------------------------------------

@router.get("/activity")
def get_activity_stream(
    admin: CurrentUser = Depends(require_admin),
):
    """
    Returns recent platform activity.

    Super admin:
        all activity

    Staff admin:
        Learnora-oriented activity

    WitStart admin:
        WitStart-oriented activity
    """

    response = (
        supabase
        .table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )

    activity = response.data or []

    if admin.role == "witstart_admin":
        activity = [
            item
            for item in activity
            if item.get("role") == "witstart"
            or (
                isinstance(
                    item.get("metadata"),
                    dict,
                )
                and item["metadata"].get(
                    "created_by_role"
                ) == "witstart_admin"
            )
        ]

    elif admin.role == "staff_admin":
        activity = [
            item
            for item in activity
            if item.get("role") == "normal"
            or (
                isinstance(
                    item.get("metadata"),
                    dict,
                )
                and item["metadata"].get(
                    "created_by_role"
                ) == "staff_admin"
            )
        ]

    return {
        "activity": activity,
    }


# ---------------------------------------------------------------------------
# TRAFFIC
# ---------------------------------------------------------------------------

@router.get("/traffic")
def get_traffic(
    admin: CurrentUser = Depends(require_super_admin),
):
    """
    Produces traffic/sign-in statistics from audit logs.

    IMPORTANT:
    This is login/activity traffic, not a guaranteed list of currently
    connected browser sessions.

    A future realtime presence table/channel can be added separately if
    exact currently-online users are required.
    """

    try:
        response = (
            supabase
            .table("audit_logs")
            .select(
                "id, action, email, account_type, "
                "role, ip, created_at"
            )
            .order("created_at", desc=True)
            .limit(5000)
            .execute()
        )

        logs = response.data or []

    except Exception as exc:
        print(f"Failed to load traffic: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to load traffic data",
        )

    # ---------------------------------------------------------------
    # DAILY SIGN-INS
    # ---------------------------------------------------------------

    daily = {}

    for item in logs:

        action = item.get("action")

        if action not in {
            "admin_login",
            "learner_login",
        }:
            continue

        created_at = item.get("created_at")

        if not created_at:
            continue

        try:
            dt = datetime.fromisoformat(
                str(created_at).replace(
                    "Z",
                    "+00:00",
                )
            )

            date_key = dt.astimezone(
                timezone.utc
            ).strftime("%Y-%m-%d")

        except Exception:
            continue

        if date_key not in daily:
            daily[date_key] = {
                "date": date_key,
                "sign_ins": 0,
                "unique_users": set(),
                "learners": 0,
                "admins": 0,
            }

        daily[date_key]["sign_ins"] += 1

        email = item.get("email")

        if email:
            daily[date_key]["unique_users"].add(
                email.lower()
            )

        if action == "learner_login":
            daily[date_key]["learners"] += 1
        elif action == "admin_login":
            daily[date_key]["admins"] += 1

    daily_output = []

    for date_key, item in sorted(
        daily.items(),
        reverse=True,
    ):
        daily_output.append(
            {
                "date": item["date"],
                "sign_ins": item["sign_ins"],
                "unique_users": len(
                    item["unique_users"]
                ),
                "learners": item["learners"],
                "admins": item["admins"],
            }
        )

    # ---------------------------------------------------------------
    # RECENT SIGN-INS
    # ---------------------------------------------------------------

    recent_signins = []

    for item in logs:

        if item.get("action") not in {
            "admin_login",
            "learner_login",
        }:
            continue

        recent_signins.append(item)

        if len(recent_signins) >= 50:
            break

    # ---------------------------------------------------------------
    # RECENTLY ACTIVE EMAILS
    # ---------------------------------------------------------------

    recent_cutoff = (
        datetime.now(timezone.utc)
        - timedelta(minutes=15)
    )

    recently_active = set()

    for item in logs:

        email = item.get("email")
        created_at = item.get("created_at")

        if not email or not created_at:
            continue

        try:
            dt = datetime.fromisoformat(
                str(created_at).replace(
                    "Z",
                    "+00:00",
                )
            )

            if dt >= recent_cutoff:
                recently_active.add(
                    email.lower()
                )

        except Exception:
            continue

    return {
        "status": "success",
        "definition": {
            "daily_unique_users": (
                "Unique email addresses with a recorded login "
                "event on that UTC date."
            ),
            "recently_active": (
                "Accounts with an audit event during the "
                "last 15 minutes."
            ),
            "active_sessions": (
                "Not currently available. This endpoint does "
                "not pretend audit activity equals a live session."
            ),
        },
        "summary": {
            "recently_active": len(
                recently_active
            ),
            "recent_sign_ins": len(
                recent_signins
            ),
        },
        "daily": daily_output,
        "recent_signins": recent_signins,
    }


# ---------------------------------------------------------------------------
# SECURITY LOGS
# ---------------------------------------------------------------------------

@router.get("/security-logs")
def get_security_logs(
    admin: CurrentUser = Depends(require_super_admin),
):
    response = (
        supabase
        .table("security_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )

    return {
        "logs": response.data or [],
    }


# ---------------------------------------------------------------------------
# SECURITY SUMMARY
# ---------------------------------------------------------------------------

@router.get("/security-summary")
def get_security_summary(
    admin: CurrentUser = Depends(require_super_admin),
):
    response = (
        supabase
        .table("security_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(500)
        .execute()
    )

    logs = response.data or []

    failed_logins = [
        item
        for item in logs
        if "failed" in str(
            item.get("action", "")
        ).lower()
    ]

    rate_limited = [
        item
        for item in logs
        if "rate" in str(
            item.get("action", "")
        ).lower()
    ]

    disabled_attempts = [
        item
        for item in logs
        if "disabled" in str(
            item.get("action", "")
        ).lower()
    ]

    return {
        "status": "success",
        "total_security_events": len(logs),
        "failed_login_events": len(
            failed_logins
        ),
        "rate_limited_events": len(
            rate_limited
        ),
        "disabled_account_attempts": len(
            disabled_attempts
        ),
        "recent": logs[:20],
    }