"""Shared cohort-membership persistence helpers.

Cohort membership is authoritative for learners enrolled in a cohort. It must
not depend on a parallel organisation_members row.
"""
from datetime import datetime, timezone
from fastapi import HTTPException

from routers.auth import supabase


def upsert_cohort_membership(cohort_id: str, user_id: str) -> dict:
    """Create or reactivate one cohort membership idempotently.

    A previously inactive membership is reactivated rather than duplicated.
    Track assignment and cohort-account provisioning are intentionally handled
    by the dedicated learner workflow, not by this low-level membership helper.
    """
    existing = (
        supabase.table("cohort_members")
        .select("id,status,cohort_id,user_id,joined_at")
        .eq("cohort_id", str(cohort_id))
        .eq("user_id", str(user_id))
        .limit(1)
        .execute()
    )
    now = datetime.now(timezone.utc).isoformat()

    if existing.data:
        current = existing.data[0]
        if current.get("status") == "active":
            return current
        result = (
            supabase.table("cohort_members")
            .update({"status": "active", "joined_at": now})
            .eq("id", current["id"])
            .execute()
        )
    else:
        result = (
            supabase.table("cohort_members")
            .insert({
                "cohort_id": str(cohort_id),
                "user_id": str(user_id),
                "joined_at": now,
                "status": "active",
            })
            .execute()
        )

    if not result.data:
        raise HTTPException(500, "Cohort membership could not be saved.")
    return result.data[0]
