"""Ensure email tokens are kept in URL fragments, not request query strings."""
import os
import unittest

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")

from routers.auth import _build_password_reset_url, _build_verification_url


class TokenUrlSecurityTests(unittest.TestCase):
    def test_verification_token_is_fragment_only(self):
        url = _build_verification_url("sample-token")
        self.assertIn("#token=sample-token", url)
        self.assertNotIn("?token=", url)

    def test_password_reset_token_is_fragment_only(self):
        url = _build_password_reset_url("sample-token")
        self.assertIn("#token=sample-token", url)
        self.assertNotIn("?token=", url)


if __name__ == "__main__":
    unittest.main()
