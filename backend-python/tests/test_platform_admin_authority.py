"""Regression tests for platform-admin authority resolution.

Legacy role strings must never grant platform-wide access by themselves.
The active Learnora platform-admin table is the authority for global roles.
"""
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")
os.environ.setdefault("JWT_SECRET", "unit-test-jwt-secret-at-least-32-characters")

from fastapi import HTTPException
from routers.auth import CurrentUser
from routers.permissions import resolve_permission_context


def user(role="super_admin", account_type="admin", user_id="admin-123"):
    return CurrentUser(
        id=user_id,
        email="admin@example.test",
        role=role,
        sub_status="active",
        account_type=account_type,
        access_state="active",
    )


class PlatformAdminAuthorityTests(unittest.TestCase):
    @patch("routers.permissions._get_admin_organisation_access", return_value=[])
    @patch("routers.permissions._get_platform_roles", return_value=[])
    def test_legacy_super_admin_role_does_not_grant_global_authority(
        self, _platform_roles, _organisation_access
    ):
        context = resolve_permission_context(user(), organisation_id=None)
        self.assertEqual(context.platform_roles, ())
        self.assertFalse(context.is_platform_admin)
        self.assertFalse(context.is_super_admin)

    @patch("routers.permissions._get_admin_organisation_access", return_value=[])
    @patch("routers.permissions._get_platform_roles", return_value=[])
    def test_legacy_super_admin_cannot_select_unassigned_organisation(
        self, _platform_roles, _organisation_access
    ):
        with self.assertRaises(HTTPException) as raised:
            resolve_permission_context(user(), organisation_id="org-other")
        self.assertEqual(raised.exception.status_code, 403)

    @patch("routers.permissions._get_admin_organisation_access", return_value=[])
    @patch("routers.permissions._get_platform_roles", return_value=["super_admin"])
    def test_active_platform_super_admin_can_select_organisation(
        self, _platform_roles, _organisation_access
    ):
        context = resolve_permission_context(user(), organisation_id="org-other")
        self.assertTrue(context.is_platform_admin)
        self.assertTrue(context.is_super_admin)
        self.assertEqual(context.organisation_id, "org-other")

    @patch("routers.permissions._get_admin_organisation_access", return_value=[])
    @patch("routers.permissions._get_platform_roles", return_value=[])
    def test_legacy_staff_admin_does_not_get_platform_authority(
        self, _platform_roles, _organisation_access
    ):
        context = resolve_permission_context(
            user(role="staff_admin"), organisation_id=None
        )
        self.assertEqual(context.platform_roles, ())
        self.assertFalse(context.is_platform_admin)


if __name__ == "__main__":
    unittest.main()
