"""Authenticated cohort lifecycle journey against disposable PostgreSQL + PostgREST.

This test is opt-in because it requires the isolated staging database and a local
PostgREST process. It never points at the live Supabase project.
"""
import os
import unittest
import uuid
from datetime import date, datetime, timezone
from unittest.mock import patch

RUN = os.getenv("RUN_COHORT_API_INTEGRATION") == "1"


@unittest.skipUnless(RUN, "requires the disposable PostgreSQL/PostgREST API staging job")
class CohortAuthenticatedApiJourney(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        from main import app
        from routers.auth import hash_password, supabase

        cls.client = TestClient(app)
        cls.client.__enter__()  # Run FastAPI lifespan startup for the real app.
        cls.db = supabase
        cls.hash_password = staticmethod(hash_password)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "client"):
            cls.client.__exit__(None, None, None)

    def setUp(self):
        self.suffix = uuid.uuid4().hex[:10]
        self.org_id = str(uuid.uuid4())
        self.actor_id = str(uuid.uuid4())
        self.tutor_id = str(uuid.uuid4())
        self.course_id = str(uuid.uuid4())
        self.module_id = str(uuid.uuid4())
        self.lesson_id = str(uuid.uuid4())
        self.unassigned_lesson_id = str(uuid.uuid4())
        self.owner_email = f"cohort-owner-{self.suffix}@example.invalid"
        self.tutor_email = f"cohort-tutor-{self.suffix}@example.invalid"
        self.owner_password = "Owner-Test-Password-2026!"
        self.learner_password = "Learner-Test-Password-2026!"

        self.db.table("organisations").insert({
            "id": self.org_id,
            "name": f"Disposable Cohort Test {self.suffix}",
            "slug": f"disposable-cohort-{self.suffix}",
            "organisation_type": "academy",
            "template": "academy",
            "is_active": True,
            "settings": {"pilot_mode": True},
        }).execute()

        self.db.table("users").insert([
            {
                "id": self.actor_id,
                "email": self.owner_email,
                "name": "Disposable Organisation Owner",
                "password_hash": self.hash_password(self.owner_password),
                "role": "normal",
                "sub_status": "active",
                "is_paid": True,
                "subscription_tier": "paid",
                "email_verified": True,
                "email_verified_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": self.tutor_id,
                "email": self.tutor_email,
                "name": "Disposable Cohort Tutor",
                "password_hash": self.hash_password("Tutor-Test-Password-2026!"),
                "role": "normal",
                "sub_status": "active",
                "is_paid": True,
                "subscription_tier": "paid",
                "email_verified": True,
                "email_verified_at": datetime.now(timezone.utc).isoformat(),
            },
        ]).execute()

        self.db.table("organisation_members").insert([
            {"organisation_id": self.org_id, "user_id": self.actor_id, "role": "owner", "status": "active"},
            {"organisation_id": self.org_id, "user_id": self.tutor_id, "role": "instructor", "status": "active"},
        ]).execute()

        # This disposable database starts without production seed rows. Give the
        # test owner only the permissions needed for the exercised organisation flow.
        for key in (
            "organisations.view",
            "organisations.update",
            "organisations.members",
            "courses.create",
            "courses.assign",
        ):
            permission = self.db.table("learnora_permissions").insert({
                "permission_key": key,
                "name": key,
                "description": "Disposable API integration permission",
                "category": "organisation",
            }).execute().data[0]
            self.db.table("learnora_organisation_role_permissions").insert({
                "organisation_role": "owner",
                "permission_id": permission["id"],
            }).execute()

        login = self.client.post("/api/auth/login", json={
            "email": self.owner_email,
            "password": self.owner_password,
        })
        self.assertEqual(login.status_code, 200, login.text)
        token = login.json().get("access_token") or login.json().get("token")
        self.assertTrue(token, login.text)
        self.admin_headers = {
            "Authorization": f"Bearer {token}",
            "X-Organisation-ID": self.org_id,
        }

        # Seed a published course and lessons through the backend's service role.
        # The organisation's cohort, track, learners and assignments are created
        # through authenticated HTTP endpoints below.
        self.db.table("learnora_courses").insert({
            "id": self.course_id,
            "organisation_id": self.org_id,
            "title": f"API Lifecycle Course {self.suffix}",
            "slug": f"api-lifecycle-course-{self.suffix}",
            "short_description": "Disposable course for the authenticated lifecycle journey.",
            "description": "Synthetic integration-test content.",
            "status": "published",
            "ownership": "organisation",
            "created_by": self.actor_id,
            "settings": {},
            "estimated_hours": 1,
        }).execute()
        self.db.table("course_modules").insert({
            "id": self.module_id,
            "course_id": self.course_id,
            "title": "Lifecycle Module",
            "description": "Synthetic module",
            "order_index": 1,
            "status": "published",
        }).execute()
        self.db.table("learnora_lessons").insert([
            {
                "id": self.lesson_id,
                "module_id": self.module_id,
                "title": "Assigned Lesson",
                "slug": f"assigned-lesson-{self.suffix}",
                "description": "A lesson assigned by the organisation.",
                "order_index": 1,
                "lesson_type": "text",
                "content": "# Assigned lesson\n\nThis is synthetic test content.",
                "duration_minutes": 5,
                "is_preview": False,
                "status": "published",
            },
            {
                "id": self.unassigned_lesson_id,
                "module_id": self.module_id,
                "title": "Unassigned Lesson",
                "slug": f"unassigned-lesson-{self.suffix}",
                "description": "This lesson must remain inaccessible.",
                "order_index": 2,
                "lesson_type": "text",
                "content": "This lesson is not assigned to the learner.",
                "duration_minutes": 5,
                "is_preview": False,
                "status": "published",
            },
        ]).execute()

    def test_authenticated_provision_assign_learn_progress_close_archive(self):
        # An organisation token must not be able to cross the organisation boundary.
        other_org = str(uuid.uuid4())
        denied = self.client.get(
            f"/api/organisations/{other_org}/tracks",
            headers=self.admin_headers,
        )
        self.assertEqual(denied.status_code, 403, denied.text)

        cohort_response = self.client.post(
            f"/api/organisations/{self.org_id}/cohorts",
            headers=self.admin_headers,
            json={
                "name": f"Lifecycle Cohort {self.suffix}",
                "description": "Disposable end-to-end cohort",
                "status": "active",
                "capacity": 10,
                "instructor_capacity": 2,
            },
        )
        self.assertEqual(cohort_response.status_code, 201, cohort_response.text)
        cohort = cohort_response.json()["cohort"]
        cohort_id = cohort["id"]

        track_response = self.client.post(
            f"/api/organisations/{self.org_id}/tracks",
            headers=self.admin_headers,
            json={
                "name": f"Data Science {self.suffix}",
                "slug": f"data-science-{self.suffix}",
                "description": "Synthetic fixed learner track",
            },
        )
        self.assertEqual(track_response.status_code, 201, track_response.text)
        track_id = track_response.json()["track"]["id"]

        enable_track = self.client.post(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/tracks",
            headers=self.admin_headers,
            json={"track_id": track_id},
        )
        self.assertEqual(enable_track.status_code, 201, enable_track.text)

        # Activation email delivery is replaced only by a token capture. The
        # account creation, activation, password hashing, login and all reads/writes
        # still pass through the real FastAPI routes and disposable PostgreSQL.
        captured = {}
        with patch("routers.cohort_learners._send_activation", side_effect=lambda **kwargs: captured.update(kwargs)):
            provision = self.client.post(
                f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/learners",
                headers=self.admin_headers,
                json={
                    "first_name": "Ada",
                    "last_name": f"Learner{self.suffix}",
                    "email": f"ada-{self.suffix}@example.invalid",
                    "date_of_birth": "2001-02-03",
                    "track_id": track_id,
                },
            )
        self.assertEqual(provision.status_code, 201, provision.text)
        learner = provision.json()["learner"]
        self.assertEqual(learner["status"], "pending_activation")
        self.assertTrue(captured.get("token"))
        self.assertNotIn("activation_token", learner)
        self.assertNotIn("password_hash", learner)

        roster = self.client.get(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/learners",
            headers=self.admin_headers,
        )
        self.assertEqual(roster.status_code, 200, roster.text)
        roster_rows = roster.json()["learners"]
        self.assertEqual(len(roster_rows), 1)
        self.assertEqual(roster_rows[0]["id"], learner["id"])
        self.assertTrue(roster_rows[0]["member_id"])
        self.assertEqual(roster_rows[0]["track_id"], track_id)
        for forbidden in ("password_hash", "activation_token_hash", "activation_expires_at"):
            self.assertNotIn(forbidden, roster_rows[0])

        activate = self.client.post("/api/cohort-auth/activate", json={
            "token": captured["token"],
            "password": self.learner_password,
            "confirm_password": self.learner_password,
        })
        self.assertEqual(activate.status_code, 200, activate.text)

        learner_login = self.client.post("/api/cohort-auth/login", json={
            "username": learner["username"],
            "password": self.learner_password,
        })
        self.assertEqual(learner_login.status_code, 200, learner_login.text)
        learner_token = learner_login.json()["access_token"]
        learner_headers = {"Authorization": f"Bearer {learner_token}"}

        me = self.client.get("/api/cohort-auth/me", headers=learner_headers)
        self.assertEqual(me.status_code, 200, me.text)
        self.assertEqual(me.json()["account"]["id"], learner["id"])

        enable_course = self.client.post(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/tracks/{track_id}/courses",
            headers=self.admin_headers,
            json={"course_id": self.course_id},
        )
        self.assertEqual(enable_course.status_code, 201, enable_course.text)

        available_lessons = self.client.get(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/tracks/{track_id}/courses/{self.course_id}/lessons",
            headers=self.admin_headers,
        )
        self.assertEqual(available_lessons.status_code, 200, available_lessons.text)
        lesson_ids = [row["id"] for row in available_lessons.json()["lessons"]]
        self.assertEqual(set(lesson_ids), {self.lesson_id, self.unassigned_lesson_id})

        member_id = roster_rows[0]["member_id"]
        assign = self.client.post(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/learners/{member_id}/courses",
            headers=self.admin_headers,
            json={
                "course_id": self.course_id,
                "tutor_user_id": self.tutor_id,
                "lesson_ids": [self.lesson_id],
            },
        )
        self.assertEqual(assign.status_code, 201, assign.text)
        self.assertEqual(assign.json()["assigned_lesson_ids"], [self.lesson_id])

        assignments = self.client.get(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/learners/{member_id}/courses",
            headers=self.admin_headers,
        )
        self.assertEqual(assignments.status_code, 200, assignments.text)
        self.assertEqual(len(assignments.json()["assignments"]), 1)
        self.assertEqual(assignments.json()["assignments"][0]["tutor_user_id"], self.tutor_id)
        self.assertEqual(assignments.json()["assignments"][0]["lesson_ids"], [self.lesson_id])

        learner_courses = self.client.get("/api/cohort-learning/me/courses", headers=learner_headers)
        self.assertEqual(learner_courses.status_code, 200, learner_courses.text)
        self.assertEqual([row["course"]["id"] for row in learner_courses.json()["courses"]], [self.course_id])

        lesson_list = self.client.get(
            f"/api/cohort-learning/me/courses/{self.course_id}/lessons",
            headers=learner_headers,
        )
        self.assertEqual(lesson_list.status_code, 200, lesson_list.text)
        self.assertEqual([row["id"] for row in lesson_list.json()["lessons"]], [self.lesson_id])

        lesson_detail = self.client.get(
            f"/api/cohort-learning/me/courses/{self.course_id}/lessons/{self.lesson_id}",
            headers=learner_headers,
        )
        self.assertEqual(lesson_detail.status_code, 200, lesson_detail.text)
        self.assertIn("Assigned lesson", lesson_detail.json()["lesson"]["content"])

        forbidden_lesson = self.client.get(
            f"/api/cohort-learning/me/courses/{self.course_id}/lessons/{self.unassigned_lesson_id}",
            headers=learner_headers,
        )
        self.assertEqual(forbidden_lesson.status_code, 403, forbidden_lesson.text)

        progress = self.client.put(
            f"/api/cohort-learning/me/courses/{self.course_id}/lessons/{self.lesson_id}/progress",
            headers=learner_headers,
            json={"progress_percent": 100, "completed": True, "last_position_seconds": 300},
        )
        self.assertEqual(progress.status_code, 200, progress.text)
        self.assertTrue(progress.json()["progress"]["completed"])
        self.assertEqual(progress.json()["progress"]["progress_percent"], 100)

        course_progress = self.client.get(
            f"/api/cohort-learning/me/courses/{self.course_id}/progress",
            headers=learner_headers,
        )
        self.assertEqual(course_progress.status_code, 200, course_progress.text)
        self.assertEqual(course_progress.json()["progress"][0]["lesson_id"], self.lesson_id)

        complete = self.client.patch(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}",
            headers=self.admin_headers,
            json={"status": "completed"},
        )
        self.assertEqual(complete.status_code, 200, complete.text)

        archive = self.client.post(
            f"/api/organisations/{self.org_id}/cohorts/{cohort_id}/archive",
            headers=self.admin_headers,
            json={"reason": "Disposable authenticated API integration test"},
        )
        self.assertEqual(archive.status_code, 200, archive.text)
        self.assertTrue(archive.json()["success"])
        self.assertEqual(archive.json()["archived_members"], 1)

        retired = self.db.table("cohort_accounts").select(
            "id,status,username,password_hash,activation_token_hash,activation_expires_at"
        ).eq("id", learner["id"]).single().execute().data
        self.assertEqual(retired["status"], "inactive")
        self.assertTrue(retired["username"].startswith("archived-"))
        self.assertIsNone(retired["password_hash"])
        self.assertIsNone(retired["activation_token_hash"])
        self.assertIsNone(retired["activation_expires_at"])

        live_membership = self.db.table("cohort_members").select("id").eq("id", member_id).execute().data
        self.assertEqual(live_membership, [])

        archived = self.db.table("learnora_cohort_member_archive").select("*").eq(
            "source_cohort_member_id", member_id
        ).single().execute().data
        self.assertEqual(archived["email"], learner["email"])
        self.assertNotIn("password_hash", archived)
        self.assertNotIn("activation_token_hash", archived)
        self.assertNotIn("username", archived)
        self.assertNotIn("date_of_birth", archived)
        self.assertIn("individual_course_assignments", archived["course_history"])

        post_archive_me = self.client.get("/api/cohort-auth/me", headers=learner_headers)
        self.assertEqual(post_archive_me.status_code, 403, post_archive_me.text)


if __name__ == "__main__":
    unittest.main()
