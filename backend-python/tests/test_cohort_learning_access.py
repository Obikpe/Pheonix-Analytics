"""Security regression tests for cohort course and lesson access."""
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from routers import cohort_learning
from routers.auth import CurrentUser


class CohortLearningAccessTests(unittest.TestCase):
    def test_unassigned_course_is_denied_before_lesson_lookup(self):
        user = CurrentUser(
            id="5ed8ab6d-310a-40d4-baaa-bf6f21a0c9a8",
            name="Learner",
            email="learner@example.invalid",
            role="learner",
            sub_status="inactive",
            account_type="cohort",
        )
        member = {"id": "member-1", "cohort_id": "cohort-1", "track_id": "track-1", "status": "active"}
        query = MagicMock()
        query.select.return_value = query
        query.eq.return_value = query
        query.limit.return_value = query
        query.execute.return_value = SimpleNamespace(data=[])
        db = MagicMock()
        db.table.return_value = query

        with patch.object(cohort_learning, "_active_cohort_member", return_value=({"id": user.id}, member)), \
             patch.object(cohort_learning, "supabase", db):
            with self.assertRaises(HTTPException) as caught:
                cohort_learning.my_cohort_course_lessons("course-not-assigned", user)

        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(db.table.call_count, 1)
        self.assertEqual(db.table.call_args.args[0], "cohort_member_course_assignments")

    def test_cross_course_lesson_assignment_is_rejected(self):
        lesson_query = MagicMock()
        lesson_query.select.return_value = lesson_query
        lesson_query.in_.return_value = lesson_query
        lesson_query.execute.return_value = SimpleNamespace(data=[
            {"id": "lesson-1", "module_id": "module-1", "status": "published"}
        ])
        module_query = MagicMock()
        module_query.select.return_value = module_query
        module_query.in_.return_value = module_query
        module_query.execute.return_value = SimpleNamespace(data=[
            {"id": "module-1", "course_id": "different-course"}
        ])
        db = MagicMock()
        db.table.side_effect = lambda name: lesson_query if name == "learnora_lessons" else module_query

        with patch.object(cohort_learning, "supabase", db):
            with self.assertRaises(HTTPException) as caught:
                cohort_learning._validate_lesson_ids("requested-course", ["lesson-1"])

        self.assertEqual(caught.exception.status_code, 400)
        self.assertIn("belong to the selected course", caught.exception.detail)


if __name__ == "__main__":
    unittest.main()
