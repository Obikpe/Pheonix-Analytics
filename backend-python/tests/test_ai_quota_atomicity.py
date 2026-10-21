"""Regression tests for database-backed atomic AI quota reservations."""
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

from services import ai


class AIQuotaAtomicityTests(unittest.TestCase):
    def test_quota_reservation_uses_atomic_database_rpc(self):
        client = Mock()
        client.rpc.return_value.execute.return_value = SimpleNamespace(
            data={"allowed": True}
        )
        limits = {
            "scope_type": "organisation",
            "scope_id": "org-123",
            "limit_feature": "*",
            "requests_per_day": 20,
            "requests_per_month": 500,
        }

        with patch.object(ai, "supabase", client):
            allowed, scope = ai._reserve_quota("user-123", "org-123", "tutor", limits)

        self.assertTrue(allowed)
        self.assertIsNone(scope)
        client.rpc.assert_called_once_with(
            "reserve_learnora_ai_quota",
            {
                "p_user_id": "user-123",
                "p_organisation_id": "org-123",
                "p_feature": "tutor",
                "p_scope_type": "organisation",
                "p_scope_id": "org-123",
                "p_limit_feature": "*",
                "p_requests_per_day": 20,
                "p_requests_per_month": 500,
            },
        )

    def test_quota_limit_response_is_enforced(self):
        client = Mock()
        client.rpc.return_value.execute.return_value = SimpleNamespace(
            data={"allowed": False, "limit_scope": "day"}
        )
        limits = {
            "scope_type": "user",
            "scope_id": "user-123",
            "limit_feature": "tutor",
            "requests_per_day": 5,
            "requests_per_month": None,
        }

        with patch.object(ai, "supabase", client):
            allowed, scope = ai._reserve_quota("user-123", None, "tutor", limits)

        self.assertFalse(allowed)
        self.assertEqual(scope, "day")

    def test_quota_rpc_failure_fails_closed(self):
        client = Mock()
        client.rpc.return_value.execute.side_effect = RuntimeError("database unavailable")
        limits = {
            "scope_type": "user",
            "scope_id": "user-123",
            "limit_feature": "tutor",
            "requests_per_day": 5,
            "requests_per_month": None,
        }

        with patch.object(ai, "supabase", client), patch("builtins.print"):
            allowed, scope = ai._reserve_quota("user-123", None, "tutor", limits)

        self.assertIsNone(allowed)
        self.assertIsNone(scope)


if __name__ == "__main__":
    unittest.main()
