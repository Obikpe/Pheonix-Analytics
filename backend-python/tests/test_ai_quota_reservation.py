"""Regression coverage for AI quota reservation request contracts."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")

from services.ai_profiles import _reserve_quota


class AIQuotaReservationTests(unittest.TestCase):
    def test_unlimited_monthly_quota_is_passed_as_null(self):
        response = SimpleNamespace(data={"allowed": True})
        with patch("services.ai_profiles.supabase.rpc") as rpc:
            rpc.return_value.execute.return_value = response
            result = _reserve_quota(
                user_id="00000000-0000-0000-0000-000000000001",
                organisation_id=None,
                feature="tutor",
                limits={
                    "scope_type": "user",
                    "scope_id": "00000000-0000-0000-0000-000000000001",
                    "limit_feature": "tutor",
                    "requests_per_day": 20,
                    "requests_per_month": None,
                },
            )

        self.assertTrue(result["allowed"])
        args = rpc.call_args.args
        self.assertEqual(args[0], "reserve_learnora_ai_quota")
        self.assertIsNone(args[1]["p_requests_per_month"])

    def test_quota_reservation_rejects_unexpected_rpc_response(self):
        response = SimpleNamespace(data=None)
        with patch("services.ai_profiles.supabase.rpc") as rpc:
            rpc.return_value.execute.return_value = response
            with self.assertRaises(RuntimeError):
                _reserve_quota(
                    user_id="00000000-0000-0000-0000-000000000001",
                    organisation_id=None,
                    feature="tutor",
                    limits={
                        "scope_type": "user",
                        "scope_id": "00000000-0000-0000-0000-000000000001",
                        "limit_feature": "tutor",
                        "requests_per_day": 20,
                        "requests_per_month": None,
                    },
                )


if __name__ == "__main__":
    unittest.main()
