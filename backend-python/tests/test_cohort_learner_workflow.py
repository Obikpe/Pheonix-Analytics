"""Focused unit tests for cohort learner authentication and validation."""
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from jose import jwt

from routers import cohort_learners


class FakeQuery:
    def __init__(self, client, table_name):
        self.client = client
        self.table_name = table_name
        self.operation = "select"

    def select(self, *_args, **_kwargs):
        self.operation = "select"
        return self

    def update(self, *_args, **_kwargs):
        self.operation = "update"
        return self

    def insert(self, *_args, **_kwargs):
        self.operation = "insert"
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def ilike(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def execute(self):
        if self.table_name == "cohort_accounts" and self.operation == "select":
            return SimpleNamespace(data=[self.client.account])
        if self.table_name == "cohorts" and self.operation == "select":
            return SimpleNamespace(data=[{"status": "active"}])
        return SimpleNamespace(data=[])


class FakeSupabase:
    def __init__(self, account=None):
        self.account = account

    def table(self, name):
        return FakeQuery(self, name)


class CohortLearnerTests(unittest.TestCase):
    def test_slug_is_normalised(self):
        self.assertEqual(cohort_learners._slug("  Web Development & Data  "), "web-development-data")

    def test_generated_username_contains_unique_suffix(self):
        one = cohort_learners._username("Ada", "Lovelace")
        two = cohort_learners._username("Ada", "Lovelace")
        self.assertTrue(one.startswith("ada.lovelace-"))
        self.assertNotEqual(one, two)

    def test_activation_rejects_password_confirmation_mismatch_before_database_access(self):
        payload = cohort_learners.CohortActivation(
            token="x" * 32,
            password="valid-password-1",
            confirm_password="valid-password-2",
        )
        with patch.object(cohort_learners, "supabase") as db:
            with self.assertRaises(HTTPException) as caught:
                cohort_learners.activate_cohort_account(payload)
        self.assertEqual(caught.exception.status_code, 400)
        db.table.assert_not_called()

    def test_login_rejects_unknown_username(self):
        fake = FakeSupabase()
        request = SimpleNamespace(headers={}, client=None)
        payload = cohort_learners.CohortLogin(username="unknown-user", password="not-the-password")
        with patch.object(cohort_learners, "supabase", fake), \
             patch.object(cohort_learners, "_limited", return_value=False), \
             patch.object(cohort_learners, "_record_failure") as record_failure:
            with self.assertRaises(HTTPException) as caught:
                cohort_learners.login_cohort_account(payload, request)
        self.assertEqual(caught.exception.status_code, 401)
        record_failure.assert_called_once()

    def test_active_login_returns_cohort_scoped_token(self):
        account = {
            "id": "8ec6a9d5-7a88-4c88-b4f0-0b7e71b8eeb1",
            "cohort_id": "bf8913a1-31e9-4e45-8d17-36a4c6f91d51",
            "organisation_id": "6efc08e2-9658-4a45-8b2e-59a4b4c8f8c2",
            "email": "learner@example.invalid",
            "username": "learner-123abc",
            "password_hash": "$2b$12$not-used-by-this-test",
            "status": "active",
        }
        fake = FakeSupabase(account)
        request = SimpleNamespace(headers={}, client=None)
        payload = cohort_learners.CohortLogin(username=account["username"], password="a-valid-password")
        with patch.object(cohort_learners, "supabase", fake), \
             patch.object(cohort_learners, "_limited", return_value=False), \
             patch.object(cohort_learners, "_clear_failures"), \
             patch.object(cohort_learners, "verify_password", return_value=(True, False)):
            response = cohort_learners.login_cohort_account(payload, request)
        decoded = jwt.decode(response["access_token"], cohort_learners.JWT_SECRET, algorithms=[cohort_learners.ALGORITHM])
        self.assertEqual(response["account"]["id"], account["id"])
        self.assertEqual(decoded["account_type"], "cohort")
        self.assertEqual(decoded["cohort_account_id"], account["id"])
        self.assertNotEqual(decoded["email"], "")


if __name__ == "__main__":
    unittest.main()
