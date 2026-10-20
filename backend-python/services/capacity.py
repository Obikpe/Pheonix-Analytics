"""Backend-enforced organisation and cohort capacity pre-checks.

These checks provide useful API errors. Database triggers/RPCs remain the
concurrency authority because count-then-insert in the API is not atomic.
"""
from datetime import date

from fastapi import HTTPException
from routers.auth import supabase

KEY_ROLES = {"learners": "learner", "instructors": "instructor"}


def entitlement_limit(org_id: str, key: str):
    org = (
        supabase.table("organisations")
        .select("settings,is_active")
        .eq("id", org_id)
        .limit(1)
        .execute()
    )
    if not org.data:
        raise HTTPException(status_code=404, detail="Organisation not found.")
    organisation = org.data[0]
    if not organisation.get("is_active"):
        raise HTTPException(status_code=409, detail="Organisation workspace is inactive.")

    settings = organisation.get("settings") or {}
    # Existing explicitly configured pilot workspaces are contract-exempt.
    if settings.get("pilot_mode") is True:
        return None

    today = date.today().isoformat()
    contracts = (
        supabase.table("learnora_contracts")
        .select("id,status,start_date,end_date,created_at")
        .eq("organisation_id", org_id)
        .in_("status", ["signed", "active", "expiring"])
        .order("created_at", desc=True)
        .execute()
    )
    active_contracts = [
        row for row in (contracts.data or [])
        if (not row.get("start_date") or str(row["start_date"]) <= today)
        and (not row.get("end_date") or str(row["end_date"]) >= today)
    ]
    if not active_contracts:
        return 0

    # Use the newest contract that is valid today; a newer future-dated or
    # expired contract must not mask an older still-valid contract.
    contract = active_contracts[0]
    entitlement = (
        supabase.table("learnora_contract_entitlements")
        .select("limit_value,enabled")
        .eq("contract_id", contract["id"])
        .eq("entitlement_key", key)
        .limit(1)
        .execute()
    )
    if not entitlement.data or not entitlement.data[0].get("enabled"):
        return 0
    # NULL means unlimited only for an explicitly enabled entitlement.
    return entitlement.data[0].get("limit_value")


def count_org(org_id: str, key: str):
    if key in KEY_ROLES:
        result = (
            supabase.table("organisation_members")
            .select("id")
            .eq("organisation_id", org_id)
            .eq("role", KEY_ROLES[key])
            .eq("status", "active")
            .execute()
        )
        return len(result.data or [])
    if key == "teams":
        result = (
            supabase.table("organisation_teams")
            .select("id")
            .eq("organisation_id", org_id)
            .eq("status", "active")
            .execute()
        )
        return len(result.data or [])
    if key == "cohorts":
        result = (
            supabase.table("cohorts")
            .select("id")
            .eq("organisation_id", org_id)
            .in_("status", ["draft", "upcoming", "active", "ending"])
            .execute()
        )
        return len(result.data or [])
    if key == "programmes":
        result = (
            supabase.table("learnora_programmes")
            .select("id")
            .eq("organisation_id", org_id)
            .neq("status", "archived")
            .execute()
        )
        return len(result.data or [])
    if key == "courses":
        owned = (
            supabase.table("learnora_courses")
            .select("id")
            .eq("organisation_id", org_id)
            .eq("ownership", "organisation")
            .neq("status", "archived")
            .execute()
        ).data or []
        assigned = (
            supabase.table("course_access")
            .select("course_id")
            .eq("organisation_id", org_id)
            .eq("status", "active")
            .execute()
        ).data or []
        course_ids = {str(row["id"]) for row in owned}
        course_ids.update(str(row["course_id"]) for row in assigned)
        return len(course_ids)
    return 0


def ensure_org_capacity(org_id: str, key: str, additional: int = 1):
    if additional < 1:
        return
    limit = entitlement_limit(org_id, key)
    if limit is None:
        return
    used = count_org(org_id, key)
    if used + additional > int(limit):
        raise HTTPException(
            status_code=409,
            detail=f"Organisation {key} capacity exceeded. Limit: {limit}, current: {used}.",
        )


def ensure_cohort_capacity(cohort_id: str, additional: int = 1):
    cohort = (
        supabase.table("cohorts")
        .select("id,capacity,status")
        .eq("id", cohort_id)
        .limit(1)
        .execute()
    )
    if not cohort.data:
        raise HTTPException(status_code=404, detail="Cohort not found.")
    row = cohort.data[0]
    if row.get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(status_code=409, detail="This cohort is closed to new members.")
    limit = row.get("capacity")
    if limit is None:
        return
    members = (
        supabase.table("cohort_members")
        .select("id")
        .eq("cohort_id", cohort_id)
        .eq("status", "active")
        .execute()
    )
    used = len(members.data or [])
    if used + additional > int(limit):
        raise HTTPException(
            status_code=409,
            detail=f"Cohort capacity exceeded. Limit: {limit}, current: {used}.",
        )
