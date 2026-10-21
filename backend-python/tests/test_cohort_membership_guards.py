"""Regression tests for cohort membership reactivation and tenant guards."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")

from fastapi import HTTPException
from routers import organisations


class FakeQuery:
    def __init__(self, db, table):
        self.db = db
        self.table = table
        self.filters = {}
        self.payload = None
        self.operation = "select"

    def select(self, *_args, **_kwargs):
        self.operation = "select"
        return self

    def eq(self, key, value):
        self.filters[key] = str(value)
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def in_(self, key, values):
        self.filters[key] = {str(value) for value in values}
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def execute(self):
        rows = self.db.rows.setdefault(self.table, [])
        matches = []
        for row in rows:
            okay = True
            for key, value in self.filters.items():
                if isinstance(value, set):
                    okay = str(row.get(key)) in value
                else:
                    okay = str(row.get(key)) == value
                if not okay:
                    break
            if okay:
                matches.append(row)
        if self.operation == "update":
            for row in matches:
                row.update(self.payload or {})
            return SimpleNamespace(data=matches)
        if self.operation == "insert":
            row = {"id": f"insert-{len(rows)+1}", **(self.payload or {})}
            rows.append(row)
            return SimpleNamespace(data=[row])
        return SimpleNamespace(data=matches)


class FakeSupabase:
    def __init__(self, rows):
        self.rows = rows

    def table(self, name):
        return FakeQuery(self, name)


def make_context():
    return SimpleNamespace(
        organisation_id="org-a",
        is_platform_admin=False,
        user_id="manager-a",
    )


class CohortMembershipGuardTests(unittest.TestCase):
    def test_reactivation_requires_active_learner_in_same_organisation(self):
        db = FakeSupabase({
            "organisations": [{"id": "org-a", "is_active": True, "settings": {}}],
            "cohorts": [{"id": "cohort-a", "organisation_id": "org-a", "status": "active"}],
            "cohort_members": [{
                "id": "membership-a", "cohort_id": "cohort-a",
                "user_id": "user-b", "status": "withdrawn",
            }],
            "organisation_members": [],
        })
        with patch.object(organisations, "supabase", db), patch.object(organisations, "ensure_cohort_capacity") as capacity:
            with self.assertRaises(HTTPException) as raised:
                organisations.update_cohort_member(
                    "org-a", "cohort-a", "membership-a",
                    organisations.StructureStatusUpdate(status="active"),
                    make_context(),
                )
        self.assertEqual(raised.exception.status_code, 400)
        capacity.assert_not_called()
        self.assertEqual(db.rows["cohort_members"][0]["status"], "withdrawn")

    def test_reactivation_checks_capacity_before_restoring_membership(self):
        db = FakeSupabase({
            "organisations": [{"id": "org-a", "is_active": True, "settings": {}}],
            "cohorts": [{"id": "cohort-a", "organisation_id": "org-a", "status": "active"}],
            "cohort_members": [{
                "id": "membership-a", "cohort_id": "cohort-a",
                "user_id": "user-a", "status": "withdrawn",
            }],
            "organisation_members": [{
                "id": "org-member-a", "organisation_id": "org-a",
                "user_id": "user-a", "role": "learner", "status": "active",
            }],
        })
        with patch.object(organisations, "supabase", db), patch.object(organisations, "ensure_cohort_capacity") as capacity:
            result = organisations.update_cohort_member(
                "org-a", "cohort-a", "membership-a",
                organisations.StructureStatusUpdate(status="active"),
                make_context(),
            )
        self.assertTrue(result["success"])
        self.assertEqual(db.rows["cohort_members"][0]["status"], "active")
        capacity.assert_called_once_with("cohort-a")


if __name__ == "__main__":
    unittest.main()
