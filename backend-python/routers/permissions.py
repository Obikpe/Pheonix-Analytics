"""
Learnora ME - Permission & Organisation Access Resolver

Authentication answers:
    "Who is this?"

This module answers:
    "What can this identity do?"
    "In which organisation?"

Architecture:

    Request
       ↓
    auth.py
       ↓
    CurrentUser
       ↓
    permissions.py
       ↓
    Platform role / Organisation role
       ↓
    Permission(s)
       ↓
    Allow / Deny

IMPORTANT:
- This module does NOT replace auth.py.
- Existing legacy roles remain supported during migration.
- Tenant-specific permissions must NOT be hard-coded here.
- Permissions come from the Learnora permission tables.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Optional, Sequence
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status

from .auth import (
    CurrentUser,
    get_current_user,
    supabase,
)


# ============================================================================
# ROLE CONSTANTS
# ============================================================================

PLATFORM_ROLES = {
    "super_admin",
    "platform_admin",
    "support_admin",
    "content_admin",
    "analytics_admin",
}

ORGANISATION_ROLES = {
    "owner",
    "admin",
    "instructor",
    "learner",
}


# ============================================================================
# LEGACY ROLES
# ============================================================================
#
# These are temporary compatibility values.
#
# They allow the current application to continue working while routes are
# gradually migrated to the new Learnora permission architecture.
#

LEGACY_ADMIN_ROLES = {
    "super_admin",
    "staff_admin",
    "witstart_admin",
}

LEGACY_LEARNER_ROLES = {
    "normal",
    "witstart",
}


# ============================================================================
# ACTIVE STATUS
# ============================================================================

ACTIVE_STATUS = "active"


# ============================================================================
# DATA STRUCTURE
# ============================================================================

@dataclass
class PermissionContext:
    """
    Complete authorisation context for the current request.

    This object should be passed into protected routes instead of repeatedly
    querying roles and permissions.
    """

    user: CurrentUser

    platform_roles: tuple[str, ...] = ()

    organisation_id: Optional[str] = None
    organisation_role: Optional[str] = None

    permissions: frozenset[str] = frozenset()

    # ------------------------------------------------------------------
    # Identity helpers
    # ------------------------------------------------------------------

    @property
    def user_id(self) -> Optional[str]:
        """UUID-backed actor ID for audit and ownership foreign keys.

        Legacy admin accounts use integer IDs in the separate admins table.
        Those IDs must not be written into UUID-backed user foreign keys.
        """
        actor_id = getattr(self.user, "id", None)
        try:
            return str(UUID(str(actor_id))) if actor_id is not None else None
        except (ValueError, TypeError, AttributeError):
            return None

    @property
    def is_platform_admin(self) -> bool:
        return bool(self.platform_roles)

    @property
    def is_super_admin(self) -> bool:
        return "super_admin" in self.platform_roles

    # ------------------------------------------------------------------
    # Permission helpers
    # ------------------------------------------------------------------

    def has_permission(self, permission: str) -> bool:
        """
        Check whether the current identity has a permission.

        Super Admin has unrestricted platform access.
        """

        if self.is_super_admin:
            return True

        return permission in self.permissions

    def has_any_permission(
        self,
        permissions: Sequence[str],
    ) -> bool:
        """
        Return True if the identity has at least one permission.
        """

        if self.is_super_admin:
            return True

        return any(
            permission in self.permissions
            for permission in permissions
        )

    def has_all_permissions(
        self,
        permissions: Sequence[str],
    ) -> bool:
        """
        Return True if the identity has every supplied permission.
        """

        if self.is_super_admin:
            return True

        return all(
            permission in self.permissions
            for permission in permissions
        )

    def has_organisation_role(
        self,
        *roles: str,
    ) -> bool:
        """
        Check whether the identity has one of the supplied organisation roles.
        """

        if self.is_super_admin:
            return True

        return self.organisation_role in {
            role.lower()
            for role in roles
        }


# ============================================================================
# SUPABASE RESPONSE HELPERS
# ============================================================================

def _rows(response: Any) -> list[dict[str, Any]]:
    """
    Safely extract rows from a Supabase response.
    """

    data = getattr(response, "data", None)

    if not data:
        return []

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        return [data]

    return []


def _normalise_role(value: Any) -> Optional[str]:
    """
    Convert a database role value into a predictable lowercase string.
    """

    if value is None:
        return None

    value = str(value).strip().lower()

    return value or None


# ============================================================================
# PLATFORM ADMIN LOOKUP
# ============================================================================

def _get_platform_roles(
    admin_id: Any,
) -> list[str]:
    """
    Resolve active Learnora platform roles for an admin.

    Table:
        public.learnora_platform_admins

    Actual schema:
        admin_id
        platform_role
        status
    """

    if admin_id is None:
        return []

    try:
        response = (
            supabase
            .table("learnora_platform_admins")
            .select("platform_role,status")
            .eq("admin_id", admin_id)
            .eq("status", ACTIVE_STATUS)
            .execute()
        )
    except Exception:
        return []

    roles: list[str] = []

    for row in _rows(response):
        role = _normalise_role(
            row.get("platform_role")
        )

        if role in PLATFORM_ROLES:
            roles.append(role)

    return sorted(set(roles))


# ============================================================================
# ADMIN ORGANISATION ACCESS
# ============================================================================

def _get_admin_organisation_access(
    admin_id: Any,
    organisation_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Resolve active organisation access for an admin.

    Table:
        public.learnora_admin_organisation_access

    Actual schema:
        admin_id
        organisation_id
        role
        status
    """

    if admin_id is None:
        return []

    try:
        query = (
            supabase
            .table("learnora_admin_organisation_access")
            .select(
                "organisation_id,role,status"
            )
            .eq("admin_id", admin_id)
            .eq("status", ACTIVE_STATUS)
        )

        if organisation_id:
            query = query.eq(
                "organisation_id",
                organisation_id,
            )

        response = query.execute()

    except Exception:
        return []

    return _rows(response)


# ============================================================================
# LEARNER ORGANISATION MEMBERSHIP
# ============================================================================
def _get_user_organisation_memberships(
    user_id: Any,
    organisation_id: Optional[str] = None,
) -> list[dict[str, Any]]:
    """
    Resolve active organisation memberships for a learner/user.

    Table:
        public.organisation_members

    Actual schema:
        organisation_id
        user_id
        role
        status
        joined_at
    """

    if user_id is None:
        return []

    try:
        query = (
            supabase
            .table("organisation_members")
            .select(
                "organisation_id,user_id,role,status"
            )
            .eq("user_id", user_id)
            .eq("status", "active")
        )

        if organisation_id:
            query = query.eq(
                "organisation_id",
                organisation_id,
            )

        response = query.execute()

    except Exception as exc:
        print(
            "Organisation membership lookup failed:",
            exc,
        )
        return []

    return _rows(response)


# ============================================================================
# ORGANISATION RESOLUTION
# ============================================================================

def _resolve_organisation(
    current_user: CurrentUser,
    requested_organisation_id: Optional[str],
) -> tuple[Optional[str], Optional[str]]:
    """
    Resolve the organisation and organisation role for the current identity.

    Rules:

    1. Explicit organisation:
       The user/admin must have access to it.

    2. One organisation:
       Automatically use it.

    3. Multiple organisations:
       Require X-Organisation-ID.

    4. Platform Super Admin:
       May operate globally without an organisation context.
    """

    user_id = getattr(
        current_user,
        "id",
        None,
    )

    account_type = _normalise_role(
        getattr(
            current_user,
            "account_type",
            None,
        )
    )

    legacy_role = _normalise_role(
        getattr(
            current_user,
            "role",
            None,
        )
    )

    # ========================================================================
    # ADMIN ACCOUNTS
    # ========================================================================

    if (
        account_type == "admin"
        or legacy_role in LEGACY_ADMIN_ROLES
    ):
        accesses = _get_admin_organisation_access(
            admin_id=user_id,
            organisation_id=requested_organisation_id,
        )

        # --------------------------------------------------------------
        # Explicit organisation selected
        # --------------------------------------------------------------

        if requested_organisation_id:

            if not accesses:

                # Super Admin may operate globally, but if a non-global
                # organisation context is explicitly requested, verify
                # access unless the account is a Super Admin.

                platform_roles = _get_platform_roles(
                    admin_id=user_id
                )

                if "super_admin" in platform_roles:
                    return (
                        requested_organisation_id,
                        None,
                    )

                if legacy_role == "super_admin":
                    return (
                        requested_organisation_id,
                        None,
                    )

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "You do not have access to this organisation."
                    ),
                )

            role = _normalise_role(
                accesses[0].get("role")
            )

            return (
                requested_organisation_id,
                role,
            )

        # --------------------------------------------------------------
        # No organisation explicitly selected
        # --------------------------------------------------------------

        if len(accesses) == 1:

            organisation_id = accesses[0].get(
                "organisation_id"
            )

            role = _normalise_role(
                accesses[0].get("role")
            )

            return (
                organisation_id,
                role,
            )

        if len(accesses) > 1:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "This account has access to multiple "
                    "organisations. Specify X-Organisation-ID."
                ),
            )

        # Platform-level admin with no organisation assignment.
        return None, None

    # ========================================================================
    # LEARNER / NORMAL USER
    # ========================================================================

    memberships = _get_user_organisation_memberships(
        user_id=user_id,
        organisation_id=requested_organisation_id,
    )

    # --------------------------------------------------------------
    # Explicit organisation
    # --------------------------------------------------------------

    if requested_organisation_id:

        if not memberships:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not belong to this organisation."
                ),
            )

        role = _normalise_role(
            memberships[0].get("role")
        )

        return (
            requested_organisation_id,
            role,
        )

    # --------------------------------------------------------------
    # One organisation
    # --------------------------------------------------------------

    if len(memberships) == 1:

        organisation_id = memberships[0].get(
            "organisation_id"
        )

        role = _normalise_role(
            memberships[0].get("role")
        )

        return (
            organisation_id,
            role,
        )

    # --------------------------------------------------------------
    # Multiple organisations
    # --------------------------------------------------------------

    if len(memberships) > 1:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This account belongs to multiple "
                "organisations. Specify X-Organisation-ID."
            ),
        )

    # No organisation membership.
    return None, None


# ============================================================================
# PLATFORM PERMISSIONS
# ============================================================================
def _get_platform_permissions(
    platform_roles: Sequence[str],
) -> set[str]:
    """
    Resolve permissions assigned to platform roles.

    Mapping table:
        public.learnora_platform_role_permissions

    Permission catalogue:
        public.learnora_permissions
    """

    valid_roles = [
        role
        for role in platform_roles
        if role in PLATFORM_ROLES
    ]

    if not valid_roles:
        return set()

    try:
        response = (
            supabase
            .table(
                "learnora_platform_role_permissions"
            )
            .select(
                "platform_role, permission_id"
            )
            .in_(
                "platform_role",
                valid_roles,
            )
            .execute()
        )
    except Exception as exc:
        print(
            "Platform permission mapping lookup failed:",
            exc,
        )
        return set()

    permission_ids = {
        str(row.get("permission_id"))
        for row in _rows(response)
        if row.get("permission_id") is not None
    }

    if not permission_ids:
        return set()

    try:
        response = (
            supabase
            .table(
                "learnora_permissions"
            )
            .select(
                "id, permission_key"
            )
            .in_(
                "id",
                list(permission_ids),
            )
            .execute()
        )
    except Exception as exc:
        print(
            "Platform permission catalogue lookup failed:",
            exc,
        )
        return set()

    return {
        str(row.get("permission_key"))
        for row in _rows(response)
        if row.get("permission_key")
    }

# ============================================================================
# ORGANISATION PERMISSIONS
# ============================================================================

def _get_organisation_permissions(
    organisation_role: Optional[str],
) -> set[str]:
    """
    Resolve permissions assigned to an organisation role.

    Mapping table:
        public.learnora_organisation_role_permissions

    Permission catalogue:
        public.learnora_permissions
    """

    if organisation_role not in ORGANISATION_ROLES:
        return set()

    try:
        response = (
            supabase
            .table(
                "learnora_organisation_role_permissions"
            )
            .select(
                "organisation_role, permission_id"
            )
            .eq(
                "organisation_role",
                organisation_role,
            )
            .execute()
        )
    except Exception as exc:
        print(
            "Organisation permission mapping lookup failed:",
            exc,
        )
        return set()

    permission_ids = {
        str(row.get("permission_id"))
        for row in _rows(response)
        if row.get("permission_id") is not None
    }

    if not permission_ids:
        return set()

    try:
        response = (
            supabase
            .table(
                "learnora_permissions"
            )
            .select(
                "id, permission_key"
            )
            .in_(
                "id",
                list(permission_ids),
            )
            .execute()
        )
    except Exception as exc:
        print(
            "Organisation permission catalogue lookup failed:",
            exc,
        )
        return set()

    return {
        str(row.get("permission_key"))
        for row in _rows(response)
        if row.get("permission_key")
    }

# ============================================================================
# MAIN PERMISSION CONTEXT RESOLVER
# ============================================================================

def resolve_permission_context(
    current_user: CurrentUser,
    organisation_id: Optional[str] = None,
) -> PermissionContext:
    """
    Resolve the complete authorisation context.

    This is the central authorisation function for Learnora.
    """

    account_type = _normalise_role(
        getattr(
            current_user,
            "account_type",
            None,
        )
    )

    legacy_role = _normalise_role(
        getattr(
            current_user,
            "role",
            None,
        )
    )

    # ========================================================================
    # PLATFORM ROLES
    # ========================================================================

    platform_roles: list[str] = []

    if (
        account_type == "admin"
        or legacy_role in LEGACY_ADMIN_ROLES
    ):
        platform_roles = _get_platform_roles(
            admin_id=getattr(
                current_user,
                "id",
                None,
            )
        )

    # ========================================================================
    # LEGACY SUPER ADMIN COMPATIBILITY
    # ========================================================================

    # Keep the existing authentication system functional while migration
    # takes place.

    if (
        legacy_role == "super_admin"
        and "super_admin" not in platform_roles
    ):
        platform_roles.append(
            "super_admin"
        )

    platform_roles = sorted(
        set(platform_roles)
    )

    # ========================================================================
    # ORGANISATION
    # ========================================================================

    (
        resolved_organisation_id,
        organisation_role,
    ) = _resolve_organisation(
        current_user=current_user,
        requested_organisation_id=organisation_id,
    )

    # ========================================================================
    # PERMISSIONS
    # ========================================================================

    permissions: set[str] = set()

    # Platform permissions.
    permissions.update(
        _get_platform_permissions(
            platform_roles
        )
    )

    # Organisation permissions.
    permissions.update(
        _get_organisation_permissions(
            organisation_role
        )
    )

    return PermissionContext(
        user=current_user,
        platform_roles=tuple(
            platform_roles
        ),
        organisation_id=(
            resolved_organisation_id
        ),
        organisation_role=(
            organisation_role
        ),
        permissions=frozenset(
            permissions
        ),
    )


# ============================================================================
# FASTAPI CONTEXT DEPENDENCY
# ============================================================================

def get_permission_context(
    x_organisation_id: Optional[str] = Header(
        default=None,
        alias="X-Organisation-ID",
    ),
    current_user: CurrentUser = Depends(
        get_current_user
    ),
) -> PermissionContext:
    """
    FastAPI dependency that resolves the complete permission context.

    Example:

        @router.get("/courses")
        def courses(
            context: PermissionContext = Depends(
                get_permission_context
            )
        ):
            ...
    """

    return resolve_permission_context(
        current_user=current_user,
        organisation_id=x_organisation_id,
    )


# ============================================================================
# REQUIRE ONE PERMISSION
# ============================================================================

def require_permission(
    permission: str,
) -> Callable:
    """
    Require one specific permission.

    Example:

        @router.post("/courses")
        def create_course(
            context: PermissionContext = Depends(
                require_permission("courses.create")
            )
        ):
            ...
    """

    permission = str(
        permission
    ).strip()

    if not permission:
        raise ValueError(
            "require_permission() requires "
            "a non-empty permission key."
        )

    def dependency(
        context: PermissionContext = Depends(
            get_permission_context
        ),
    ) -> PermissionContext:

        if context.has_permission(
            permission
        ):
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Permission required: "
                f"{permission}"
            ),
        )

    return dependency


# ============================================================================
# REQUIRE ANY PERMISSION
# ============================================================================

def require_any_permission(
    permissions: Sequence[str],
) -> Callable:
    """
    Require at least one supplied permission.
    """

    required = tuple(
        str(permission).strip()
        for permission in permissions
        if str(permission).strip()
    )

    if not required:
        raise ValueError(
            "require_any_permission() requires "
            "at least one permission."
        )

    def dependency(
        context: PermissionContext = Depends(
            get_permission_context
        ),
    ) -> PermissionContext:

        if context.has_any_permission(
            required
        ):
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "At least one of these permissions "
                "is required: "
                + ", ".join(required)
            ),
        )

    return dependency


# ============================================================================
# REQUIRE ALL PERMISSIONS
# ============================================================================

def require_all_permissions(
    permissions: Sequence[str],
) -> Callable:
    """
    Require all supplied permissions.
    """

    required = tuple(
        str(permission).strip()
        for permission in permissions
        if str(permission).strip()
    )

    if not required:
        raise ValueError(
            "require_all_permissions() requires "
            "at least one permission."
        )

    def dependency(
        context: PermissionContext = Depends(
            get_permission_context
        ),
    ) -> PermissionContext:

        if context.has_all_permissions(
            required
        ):
            return context

        missing = [
            permission
            for permission in required
            if not context.has_permission(
                permission
            )
        ]

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Missing required permission(s): "
                + ", ".join(missing)
            ),
        )

    return dependency


# ============================================================================
# REQUIRE ORGANISATION ROLE
# ============================================================================

def require_organisation_role(
    *roles: str,
) -> Callable:
    """
    Require one of the supplied organisation roles.

    Super Admin bypasses the organisation-role restriction because it
    has global platform authority.
    """

    allowed_roles = {
        str(role).strip().lower()
        for role in roles
        if str(role).strip()
    }

    if not allowed_roles:
        raise ValueError(
            "require_organisation_role() requires "
            "at least one role."
        )

    invalid_roles = (
        allowed_roles - ORGANISATION_ROLES
    )

    if invalid_roles:
        raise ValueError(
            "Unknown organisation role(s): "
            + ", ".join(
                sorted(invalid_roles)
            )
        )

    def dependency(
        context: PermissionContext = Depends(
            get_permission_context
        ),
    ) -> PermissionContext:

        if context.is_super_admin:
            return context

        if context.organisation_role in allowed_roles:
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Organisation role required: "
                + ", ".join(
                    sorted(allowed_roles)
                )
            ),
        )

    return dependency


# ============================================================================
# REQUIRE PLATFORM ROLE
# ============================================================================

def require_platform_role(
    *roles: str,
) -> Callable:
    """
    Require one of the supplied platform roles.
    """

    allowed_roles = {
        str(role).strip().lower()
        for role in roles
        if str(role).strip()
    }

    if not allowed_roles:
        raise ValueError(
            "require_platform_role() requires "
            "at least one role."
        )

    invalid_roles = (
        allowed_roles - PLATFORM_ROLES
    )

    if invalid_roles:
        raise ValueError(
            "Unknown platform role(s): "
            + ", ".join(
                sorted(invalid_roles)
            )
        )

    def dependency(
        context: PermissionContext = Depends(
            get_permission_context
        ),
    ) -> PermissionContext:

        if context.is_super_admin:
            return context

        if any(
            role in allowed_roles
            for role in context.platform_roles
        ):
            return context

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Platform role required: "
                + ", ".join(
                    sorted(allowed_roles)
                )
            ),
        )

    return dependency


# ============================================================================
# PROGRAMMATIC PERMISSION HELPERS
# ============================================================================

def can(
    context: PermissionContext,
    permission: str,
) -> bool:
    """
    Check a permission without blocking the request.
    """

    return context.has_permission(
        permission
    )


def can_any(
    context: PermissionContext,
    permissions: Sequence[str],
) -> bool:
    """
    Check whether at least one permission exists.
    """

    return context.has_any_permission(
        permissions
    )


def can_all(
    context: PermissionContext,
    permissions: Sequence[str],
) -> bool:
    """
    Check whether all permissions exist.
    """

    return context.has_all_permissions(
        permissions
    )


# ============================================================================
# SAFE CONTEXT SUMMARY
# ============================================================================

def permission_summary(
    context: PermissionContext,
) -> dict[str, Any]:
    """
    Return a safe representation of the current permission context.

    Useful for diagnostics and eventually for /auth/me.

    No passwords, JWTs or secrets are returned.
    """

    return {
        "user_id": getattr(
            context.user,
            "id",
            None,
        ),
        "email": getattr(
            context.user,
            "email",
            None,
        ),
        "account_type": getattr(
            context.user,
            "account_type",
            None,
        ),
        "legacy_role": getattr(
            context.user,
            "role",
            None,
        ),
        "platform_roles": list(
            context.platform_roles
        ),
        "organisation_id": (
            context.organisation_id
        ),
        "organisation_role": (
            context.organisation_role
        ),
        "permissions": sorted(
            context.permissions
        ),
        "is_super_admin": (
            context.is_super_admin
        ),
    }
