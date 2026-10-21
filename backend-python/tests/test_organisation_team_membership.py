"""Regression tests for tenant-safe customer team membership."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")

from fastapi import HTTPException
from routers import organisation_teams


class FakeQuery:
    def __init__(self, db, table):
        self.db = db
        self.table = table
        self.filters = {}
        self.payload = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def upsert(self, payload, **_kwargs):
        self.payload = payload
        return self

    def execute(self):
        if self.payload is not None:
            self.db.saved.append(self.payload)
            return SimpleNamespace(data=[{"id": "member-1", **self.payload}])
        rows = self.db.rows.get(self.table, [])
        matches = [
            row for row in rows
            if all(str(row.get(key)) == str(value) for key, value in self.filters.items())
        ]
        return SimpleNamespace(data=matches)


class FakeSupabase:
    def __init__(self, rows=None):
        self.rows = rows or {}
        self.saved = []

    def table(self, name):
        return FakeQuery(self, name)


def context():
    return SimpleNamespace(
        organisation_id="org-a",
        is_platform_admin=False,
        user_id="user-manager",
    )


class OrganisationTeamMembershipTests(unittest.TestCase):
    def test_rejects_user_without_active_membership_in_team_organisation(self):
        db = FakeSupabase({
            "organisation_teams": [{
                "id": "team-a", "organisation_id": "org-a", "status": "active",
            }],
            "organisations": [{"id": "org-a", "is_active": True, "settings": {}}],
            "organisation_members": [],
        })
        with patch.object(organisation_teams, "supabase", db):
            with self.assertRaises(HTTPException) as raised:
                organisation_teams.add_member(
                    "team-a",
                    organisation_teams.TeamMemberIn(user_id="user-from-org-b"),
                    context(),
                )
        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(db.saved, [])

    def test_rejects_unknown_team_role(self):
        db = FakeSupabase()
        with patch.object(organisation_teams, "supabase", db):
            with self.assertRaises(HTTPException) as raised:
                organisation_teams.add_member(
                    "team-a",
                    organisation_teams.TeamMemberIn(user_id="user-1", role="owner"),
                    context(),
                )
        self.assertEqual(raised.exception.status_code, 400)

    def test_allows_active_member_and_persists_only_valid_team_role(self):
        db = FakeSupabase({
            "organisation_teams": [{
                "id": "team-a", "organisation_id": "org-a", "status": "active",
            }],
            "organisations": [{"id": "org-a", "is_active": True, "settings": {}}],
            "organisation_members": [{
                "id": "membership-1", "organisation_id": "org-a",
                "user_id": "user-1", "role": "learner", "status": "active",
            }],
        })
        with patch.object(organisation_teams, "supabase", db):
            result = organisation_teams.add_member(
                "team-a",
                organisation_teams.TeamMemberIn(user_id="user-1", role="manager"),
                context(),
            )
        self.assertTrue(result["success"])
        self.assertEqual(db.saved[0]["role"], "manager")
        self.assertEqual(db.saved[0]["status"], "active")
        self.assertEqual(db.saved[0]["team_id"], "team-a")

    def test_rejects_inactive_organisation(self):
        db = FakeSupabase({
            "organisation_teams": [{
                "id": "team-a", "organisation_id": "org-a", "status": "active",
            }],
            "organisations": [{"id": "org-a", "is_active": False, "settings": {}}],
        })
        with patch.object(organisation_teams, "supabase", db):
            with self.assertRaises(HTTPException) as raised:
                organisation_teams.add_member(
                    "team-a",
                    organisation_teams.TeamMemberIn(user_id="user-1"),
                    context(),
                )
        self.assertEqual(raised.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
