"""Regression tests for course-access entitlement guards."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-key")

from fastapi import HTTPException
from routers import course_access


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows
        self.filters = {}
        self.single = False

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters[key] = str(value)
        return self

    def maybe_single(self):
        self.single = True
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def execute(self):
        matches = [
            row for row in self.rows
            if all(str(row.get(key)) == value for key, value in self.filters.items())
        ]
        return SimpleNamespace(data=(matches[0] if matches else None) if self.single else matches)


class FakeSupabase:
    def __init__(self, courses):
        self.courses = courses

    def table(self, name):
        if name == "learnora_courses":
            return FakeQuery(self.courses)
        return FakeQuery([])


class CourseAccessGuardTests(unittest.TestCase):
    def test_draft_course_cannot_be_assigned_to_an_organisation(self):
        course_id = str(uuid4())
        organisation_id = str(uuid4())
        db = FakeSupabase([{
            "id": course_id,
            "organisation_id": None,
            "title": "Draft course",
            "slug": "draft-course",
            "status": "draft",
            "ownership": "learnora",
        }])
        payload = course_access.CreateCourseAccess(
            course_id=course_id,
            organisation_id=organisation_id,
        )
        context = SimpleNamespace(
            is_platform_admin=True,
            organisation_id=None,
            user_id=None,
        )
        with patch.object(course_access, "supabase", db):
            with self.assertRaises(HTTPException) as raised:
                course_access.assign_course(payload, context)
        self.assertEqual(raised.exception.status_code, 409)
        self.assertIn("published", raised.exception.detail.lower())


if __name__ == "__main__":
    unittest.main()
