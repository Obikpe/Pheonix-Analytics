"""Isolated API tests for the instructor assessment-review journey.

Run from backend-python with:
    python -m unittest discover -s tests -v
The suite uses an in-memory Supabase query double and never writes production data.
"""
import os
import unittest
from types import SimpleNamespace

# Importing the app router requires syntactically valid local Supabase settings;
# tests replace its client before making requests and never contact the network.
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")

from fastapi import FastAPI
from fastapi.testclient import TestClient

from routers import instructor_workflows as workflows


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, store, table):
        self.store = store
        self.table_name = table
        self.filters = []
        self.columns = None
        self.payload = None
        self.limit_value = None

    def select(self, columns):
        self.columns = columns
        return self

    def update(self, payload):
        self.payload = payload
        return self

    def eq(self, key, value):
        self.filters.append(("eq", key, str(value)))
        return self

    def in_(self, key, values):
        self.filters.append(("in", key, {str(value) for value in values}))
        return self

    def order(self, *_args, **_kwargs):
        return self

    def limit(self, value):
        self.limit_value = value
        return self

    def execute(self):
        rows = self.store.setdefault(self.table_name, [])
        def matches(row):
            for kind, key, expected in self.filters:
                actual = str(row.get(key))
                if kind == "eq" and actual != expected:
                    return False
                if kind == "in" and actual not in expected:
                    return False
            return True
        selected = [row for row in rows if matches(row)]
        if self.payload is not None:
            for row in selected:
                row.update(self.payload)
            selected = [row.copy() for row in selected]
        else:
            selected = [row.copy() for row in selected]
        if self.limit_value is not None:
            selected = selected[:self.limit_value]
        return FakeResponse(selected)


class FakeSupabase:
    def __init__(self, store):
        self.store = store

    def table(self, name):
        return FakeQuery(self.store, name)


def context_for(organisation_id="org-1", role="instructor"):
    return SimpleNamespace(
        organisation_id=organisation_id,
        organisation_role=role,
        is_super_admin=False,
        has_permission=lambda permission: permission == "courses.view",
    )


class InstructorAssessmentJourneyTests(unittest.TestCase):
    def setUp(self):
        self.store = {
            "learnora_creator_accounts": [],
            "learnora_courses": [{
                "id": "course-1", "title": "Intro to Data",
                "organisation_id": "org-1", "ownership": "organisation",
                "creator_id": None, "status": "published",
            }],
            "assignments": [{
                "id": "assignment-1", "course_id": "course-1",
                "title": "Data task", "max_score": 20,
            }],
            "assignment_submissions": [{
                "id": "submission-1", "assignment_id": "assignment-1",
                "user_id": "learner-1", "submission_text": "My answer",
                "file_url": None, "status": "submitted", "score": None,
                "feedback": None, "submitted_at": "2026-10-20T10:00:00+00:00",
                "graded_at": None,
            }],
        }
        self.original_supabase = workflows.supabase
        workflows.supabase = FakeSupabase(self.store)
        app = FastAPI()
        app.include_router(workflows.router)
        self.user = SimpleNamespace(id="instructor-1")
        self.context = context_for()
        app.dependency_overrides[workflows.get_current_user] = lambda: self.user
        app.dependency_overrides[workflows.get_permission_context] = lambda: self.context
        self.client = TestClient(app)

    def tearDown(self):
        workflows.supabase = self.original_supabase

    def test_instructor_lists_only_scoped_submissions(self):
        response = self.client.get("/api/instructor/submissions")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["submissions"][0]["id"], "submission-1")
        self.assertEqual(payload["submissions"][0]["assignment"]["title"], "Data task")

    def test_instructor_can_grade_submission_with_feedback(self):
        response = self.client.patch(
            "/api/instructor/submissions/submission-1/review",
            json={"score": 18, "feedback": "Clear analysis; explain the outlier threshold."},
        )
        self.assertEqual(response.status_code, 200)
        submission = response.json()["submission"]
        self.assertEqual(submission["score"], 18)
        self.assertEqual(submission["status"], "graded")
        self.assertIn("outlier threshold", submission["feedback"])
        self.assertIsNotNone(submission["graded_at"])

    def test_instructor_cannot_review_another_organisation_course(self):
        self.context = context_for(organisation_id="org-2")
        response = self.client.patch(
            "/api/instructor/submissions/submission-1/review",
            json={"score": 18, "feedback": "Feedback"},
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.store["assignment_submissions"][0]["status"], "submitted")

    def test_score_cannot_exceed_assignment_maximum(self):
        response = self.client.patch(
            "/api/instructor/submissions/submission-1/review",
            json={"score": 21, "feedback": "Feedback"},
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.store["assignment_submissions"][0]["status"], "submitted")


if __name__ == "__main__":
    unittest.main()
