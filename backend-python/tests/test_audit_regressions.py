"""Regression tests for the organisation, AI and assessment audit fixes."""
import os
import unittest
from types import SimpleNamespace

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")

from fastapi import HTTPException
from starlette.requests import Request
from routers.auth import _get_client_ip
from routers.ai import _authorise_feature
from routers.organisations import (
    _validate_organisation_type,
    _with_capabilities,
)
from routers.progress import effective_passing_score


class AuditRegressionTests(unittest.TestCase):
    def test_community_is_a_supported_organisation_type(self):
        self.assertEqual(_validate_organisation_type(" Community "), "community")

    def test_unknown_organisation_type_is_rejected_before_database_write(self):
        with self.assertRaises(HTTPException) as raised:
            _validate_organisation_type("unsupported-model")
        self.assertEqual(raised.exception.status_code, 400)

    def test_corporate_model_exposes_team_first_capabilities(self):
        org = _with_capabilities({"organisation_type": "corporate", "settings": {}})
        self.assertFalse(org["capabilities"]["instructor_led"])
        self.assertTrue(org["capabilities"]["teams"])
        self.assertTrue(org["capabilities"]["individual_course_assignment"])
        self.assertTrue(org["capabilities"]["team_course_assignment"])

    def test_capability_overrides_are_limited_to_known_boolean_flags(self):
        org = _with_capabilities({
            "organisation_type": "academy",
            "settings": {"capabilities": {"teams": False, "unknown_flag": True}},
        })
        self.assertFalse(org["capabilities"]["teams"])
        self.assertNotIn("unknown_flag", org["capabilities"])

    def test_instructor_ai_is_denied_to_learners_even_if_ai_view_permission_exists(self):
        context = SimpleNamespace(
            is_platform_admin=False,
            organisation_role="learner",
            permissions=frozenset({"ai.view"}),
            has_permission=lambda permission: permission in {"ai.view"},
        )
        with self.assertRaises(HTTPException) as raised:
            _authorise_feature("instructor", context)
        self.assertEqual(raised.exception.status_code, 403)

    def test_organisation_ai_requires_admin_role_or_analytics_permission(self):
        context = SimpleNamespace(
            is_platform_admin=False,
            organisation_role="learner",
            permissions=frozenset(),
            has_permission=lambda _permission: False,
        )
        with self.assertRaises(HTTPException) as raised:
            _authorise_feature("organisation", context)
        self.assertEqual(raised.exception.status_code, 403)

    def test_quiz_pass_score_cannot_be_configured_below_70(self):
        self.assertEqual(effective_passing_score({"passing_score": 60}), 70.0)
        self.assertEqual(effective_passing_score({"passing_score": None}), 70.0)

    def test_quiz_may_require_more_than_70(self):
        self.assertEqual(effective_passing_score({"passing_score": 85}), 85.0)

    def test_client_ip_ignores_untrusted_forwarded_for_prefix(self):
        request = Request({
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [
                (b"x-forwarded-for", b"198.51.100.200, 203.0.113.4"),
                (b"x-real-ip", b"203.0.113.44"),
            ],
            "client": ("127.0.0.1", 12345),
            "server": ("testserver", 80),
            "scheme": "https",
        })
        self.assertEqual(_get_client_ip(request), "203.0.113.44")


if __name__ == "__main__":
    unittest.main()
