"""Regression tests for cohort-login username matching and throttling."""
import unittest
import os
from datetime import date
from types import SimpleNamespace
from unittest.mock import Mock, patch

from cryptography.fernet import Fernet
from fastapi import HTTPException
from starlette.requests import Request

from routers import auth, cohort_learners as cohort


def make_request():
    return Request({
        "type": "http",
        "method": "POST",
        "path": "/api/cohort-auth/login",
        "headers": [],
        "client": ("203.0.113.44", 43123),
        "server": ("testserver", 80),
        "scheme": "http",
    })


class EmptyQuery:
    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=[])


class CohortLoginSecurityTests(unittest.TestCase):
    def setUp(self):
        auth._FAILS.clear()
        self.db = Mock()
        self.db.table.return_value = EmptyQuery()

    def tearDown(self):
        auth._FAILS.clear()

    def test_wildcard_and_invalid_usernames_return_generic_401_without_query(self):
        with patch.object(cohort, "supabase", self.db), \
             patch.object(cohort, "_get_client_ip", return_value="203.0.113.44"), \
             patch.object(cohort, "_limited", return_value=False), \
             patch.object(cohort, "_record_failure") as record_failure, \
             patch.object(cohort, "verify_password", return_value=(False, False)) as verify:
            for username in ("%", "a%", "_"):
                with self.subTest(username=username):
                    with self.assertRaises(HTTPException) as raised:
                        cohort.login_cohort_account(
                            cohort.CohortLogin(username=username, password="wrong-password"),
                            make_request(),
                        )
                    self.assertEqual(raised.exception.status_code, 401)
                    self.assertEqual(raised.exception.detail, "Invalid username or password.")
            self.db.table.assert_not_called()
            self.assertEqual(record_failure.call_count, 6)  # username + IP bucket per attempt
            self.assertEqual(verify.call_count, 3)  # constant-cost dummy password check

    def test_vercel_sanitized_client_ip_is_preferred_for_rate_limit_identity(self):
        request = Request({
            "type": "http",
            "method": "POST",
            "path": "/api/cohort-auth/login",
            "headers": [
                (b"x-vercel-forwarded-for", b"203.0.113.9"),
                (b"x-forwarded-for", b"198.51.100.7, 203.0.113.9"),
            ],
            "client": ("127.0.0.1", 43123),
            "server": ("testserver", 80),
            "scheme": "https",
        })
        with patch.dict(os.environ, {"VERCEL": "1"}):
            self.assertEqual(auth._get_client_ip(request), "203.0.113.9")

    def test_rotating_usernames_still_hits_client_ip_bucket(self):
        with patch.object(cohort, "supabase", self.db), \
             patch.object(cohort, "_get_client_ip", return_value="203.0.113.44"), \
             patch.object(cohort, "verify_password", return_value=(False, False)):
            for i in range(auth.MAX_FAILS):
                with self.assertRaises(HTTPException) as raised:
                    cohort.login_cohort_account(
                        cohort.CohortLogin(username=f"learner.sample-{i:06x}", password="wrong-password"),
                        make_request(),
                    )
                self.assertEqual(raised.exception.status_code, 401)

            with self.assertRaises(HTTPException) as raised:
                cohort.login_cohort_account(
                    cohort.CohortLogin(username="learner.another-abcdef", password="wrong-password"),
                    make_request(),
                )
            self.assertEqual(raised.exception.status_code, 429)

    def test_date_of_birth_requires_encryption_key_and_encrypts_value(self):
        with patch.dict(os.environ, {"COHORT_DOB_ENCRYPTION_KEY": ""}):
            with self.assertRaises(HTTPException) as raised:
                cohort._encrypt_date_of_birth(date(2000, 1, 2))
            self.assertEqual(raised.exception.status_code, 503)

        key = Fernet.generate_key()
        with patch.dict(os.environ, {"COHORT_DOB_ENCRYPTION_KEY": key.decode("ascii")}):
            encrypted = cohort._encrypt_date_of_birth(date(2000, 1, 2))
        self.assertNotEqual(encrypted, "2000-01-02")
        self.assertEqual(Fernet(key).decrypt(encrypted.encode("ascii")).decode("ascii"), "2000-01-02")

    def test_five_bad_attempts_block_the_sixth_for_same_username_and_ip(self):
        with patch.object(cohort, "supabase", self.db), \
             patch.object(cohort, "_get_client_ip", return_value="203.0.113.44"), \
             patch.object(cohort, "verify_password", return_value=(False, False)):
            for _ in range(auth.MAX_FAILS):
                with self.assertRaises(HTTPException) as raised:
                    cohort.login_cohort_account(
                        cohort.CohortLogin(username="learner.sample-ab12cd", password="wrong-password"),
                        make_request(),
                    )
                self.assertEqual(raised.exception.status_code, 401)

            with self.assertRaises(HTTPException) as raised:
                cohort.login_cohort_account(
                    cohort.CohortLogin(username="learner.sample-ab12cd", password="wrong-password"),
                    make_request(),
                )
            self.assertEqual(raised.exception.status_code, 429)
            self.assertEqual(raised.exception.detail, "Too many failed login attempts. Try again later.")


if __name__ == "__main__":
    unittest.main()
