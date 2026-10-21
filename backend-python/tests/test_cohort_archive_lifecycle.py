"""Tests for explicit cohort archive lifecycle endpoint."""
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from routers import organisations


ORG_ID = "dee88308-215b-4a16-807d-c7e96a1379f9"
COHORT_ID = "1bf0827d-e03a-413c-ba98-d4bffd4f8db1"
ACTOR_ID = "5ed8ab6d-310a-40d4-baaa-bf6f21a0c9a8"


class CohortArchiveEndpointTests(unittest.TestCase):
    def setUp(self):
        self.context = SimpleNamespace(
            user_id=ACTOR_ID,
            organisation_id=ORG_ID,
            is_platform_admin=False,
        )
        self.query = MagicMock()
        self.query.select.return_value = self.query
        self.query.eq.return_value = self.query
        self.query.limit.return_value = self.query
        self.db = MagicMock()
        self.db.table.return_value = self.query

    def test_active_cohort_cannot_be_archived(self):
        self.query.execute.return_value = SimpleNamespace(
            data=[{"id": COHORT_ID, "status": "active"}]
        )
        with patch.object(organisations, "_assert_organisation_scope"), patch.object(
            organisations, "supabase", self.db
        ):
            with self.assertRaises(HTTPException) as caught:
                organisations.archive_organisation_cohort(
                    ORG_ID,
                    COHORT_ID,
                    organisations.CohortArchiveRequest(reason="test"),
                    self.context,
                )
        self.assertEqual(caught.exception.status_code, 409)
        self.db.rpc.assert_not_called()

    def test_closed_cohort_uses_atomic_archive_rpc(self):
        self.query.execute.return_value = SimpleNamespace(
            data=[{"id": COHORT_ID, "status": "closed"}]
        )
        rpc_result = SimpleNamespace(
            data={
                "success": True,
                "already_archived": False,
                "archive_id": "archive-1",
                "cohort_id": COHORT_ID,
                "archived_members": 25,
                "cohort_status": "archived",
                "organisation_unchanged": True,
            }
        )
        self.db.rpc.return_value.execute.return_value = rpc_result
        with patch.object(organisations, "_assert_organisation_scope"), patch.object(
            organisations, "supabase", self.db
        ):
            result = organisations.archive_organisation_cohort(
                ORG_ID,
                COHORT_ID,
                organisations.CohortArchiveRequest(reason="cohort ended"),
                self.context,
            )
        self.assertTrue(result["success"])
        self.assertEqual(result["archived_members"], 25)
        self.db.rpc.assert_called_once_with(
            "archive_and_close_cohort",
            {
                "p_cohort_id": COHORT_ID,
                "p_actor_user_id": ACTOR_ID,
                "p_reason": "cohort ended",
            },
        )


if __name__ == "__main__":
    unittest.main()
