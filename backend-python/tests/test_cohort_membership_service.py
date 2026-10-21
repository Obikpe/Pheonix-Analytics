"""Unit tests for idempotent cohort membership persistence."""
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from services import cohort_membership


class CohortMembershipTests(unittest.TestCase):
    def setUp(self):
        self.client = MagicMock()
        self.table = self.client.table.return_value
        self.query = self.table.select.return_value
        self.query.eq.return_value = self.query
        self.query.limit.return_value = self.query
        self.table.update.return_value.eq.return_value.execute.return_value = SimpleNamespace(
            data=[{
                "id": "membership-1",
                "cohort_id": "cohort-1",
                "user_id": "user-1",
                "status": "active",
                "joined_at": "2026-10-21T00:00:00+00:00",
            }]
        )
        self.table.insert.return_value.execute.return_value = SimpleNamespace(
            data=[{
                "id": "membership-1",
                "cohort_id": "cohort-1",
                "user_id": "user-1",
                "status": "active",
            }]
        )
        self.patch_client = patch.object(cohort_membership, "supabase", self.client)
        self.patch_client.start()
        self.addCleanup(self.patch_client.stop)

    def test_active_membership_is_idempotent(self):
        self.query.execute.return_value = SimpleNamespace(data=[{
            "id": "membership-1",
            "cohort_id": "cohort-1",
            "user_id": "user-1",
            "status": "active",
            "joined_at": "2026-10-01T00:00:00+00:00",
        }])

        result = cohort_membership.upsert_cohort_membership("cohort-1", "user-1")

        self.assertEqual(result["status"], "active")
        self.table.update.assert_not_called()
        self.table.insert.assert_not_called()

    def test_inactive_membership_is_reactivated_not_duplicated(self):
        self.query.execute.return_value = SimpleNamespace(data=[{
            "id": "membership-1",
            "cohort_id": "cohort-1",
            "user_id": "user-1",
            "status": "withdrawn",
            "joined_at": "2026-10-01T00:00:00+00:00",
        }])

        result = cohort_membership.upsert_cohort_membership("cohort-1", "user-1")

        self.assertEqual(result["status"], "active")
        self.table.update.assert_called_once()
        self.table.insert.assert_not_called()

    def test_missing_membership_is_inserted(self):
        self.query.execute.return_value = SimpleNamespace(data=[])

        result = cohort_membership.upsert_cohort_membership("cohort-1", "user-1")

        self.assertEqual(result["status"], "active")
        self.table.insert.assert_called_once()
        self.table.update.assert_not_called()

    def test_failed_write_raises_server_error(self):
        self.query.execute.return_value = SimpleNamespace(data=[])
        self.table.insert.return_value.execute.return_value = SimpleNamespace(data=[])

        with self.assertRaises(HTTPException) as error:
            cohort_membership.upsert_cohort_membership("cohort-1", "user-1")

        self.assertEqual(error.exception.status_code, 500)


if __name__ == "__main__":
    unittest.main()
