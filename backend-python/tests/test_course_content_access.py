"""Regression tests for tenant isolation in course-content reads.

Run from backend-python with:
    python -m unittest discover -s tests
"""
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from routers import course_content


class FakeQuery:
    def __init__(self, table_name, rows):
        self.table_name = table_name
        self.rows = rows
        self.filters = {}

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = value
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def execute(self):
        matching = [
            row for row in self.rows
            if all(str(row.get(key)) == str(value) for key, value in self.filters.items())
        ]
        return SimpleNamespace(data=matching)


class FakeSupabase:
    def __init__(self, course_access=None, enrolments=None):
        self.rows = {
            "course_access": course_access or [],
            "learnora_enrolments": enrolments or [],
        }

    def table(self, name):
        return FakeQuery(name, self.rows.get(name, []))


def context(organisation_id="org-a", user_id="user-1", platform_admin=False):
    return SimpleNamespace(
        organisation_id=organisation_id,
        user_id=user_id,
        is_platform_admin=platform_admin,
    )


class CourseContentAccessTests(unittest.TestCase):
    def test_organisation_owned_course_is_readable_inside_own_tenant(self):
        course = {"id": "course-1", "ownership": "organisation", "organisation_id": "org-a"}
        with patch.object(course_content, "supabase", FakeSupabase()):
            course_content._check_course_view_access(context(), course)

    def test_organisation_owned_course_is_denied_to_another_tenant(self):
        course = {"id": "course-1", "ownership": "organisation", "organisation_id": "org-b"}
        with patch.object(course_content, "supabase", FakeSupabase()):
            with self.assertRaises(HTTPException) as raised:
                course_content._check_course_view_access(context("org-a"), course)
        self.assertEqual(raised.exception.status_code, 403)

    def test_learnora_course_requires_active_organisation_grant_or_enrolment(self):
        course = {"id": "course-1", "ownership": "learnora", "organisation_id": None}
        db = FakeSupabase(course_access=[{
            "id": "grant-1", "course_id": "course-1",
            "organisation_id": "org-a", "status": "active",
        }])
        with patch.object(course_content, "supabase", db):
            course_content._check_course_view_access(context(), course)

    def test_individual_enrolment_cannot_cross_tenant_boundary(self):
        course = {"id": "course-1", "ownership": "learnora", "organisation_id": None}
        db = FakeSupabase(enrolments=[{
            "id": "enrolment-1", "course_id": "course-1",
            "user_id": "user-1", "organisation_id": "org-b", "status": "active",
        }])
        with patch.object(course_content, "supabase", db):
            with self.assertRaises(HTTPException) as raised:
                course_content._check_course_view_access(context("org-a"), course)
        self.assertEqual(raised.exception.status_code, 403)

    def test_individual_unscoped_enrolment_is_preserved(self):
        course = {"id": "course-1", "ownership": "learnora", "organisation_id": None}
        db = FakeSupabase(enrolments=[{
            "id": "enrolment-1", "course_id": "course-1",
            "user_id": "user-1", "organisation_id": None, "status": "active",
        }])
        with patch.object(course_content, "supabase", db):
            course_content._check_course_view_access(context(None), course)

    def test_platform_admin_can_read_course_without_tenant_grant(self):
        course = {"id": "course-1", "ownership": "learnora", "organisation_id": None}
        with patch.object(course_content, "supabase", FakeSupabase()):
            course_content._check_course_view_access(context(None, platform_admin=True), course)


if __name__ == "__main__":
    unittest.main()
