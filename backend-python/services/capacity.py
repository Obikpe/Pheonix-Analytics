"""Backend-enforced organisation and cohort capacity checks."""
from fastapi import HTTPException
from routers.auth import supabase

KEY_ROLES = {"learners": "learner", "instructors": "instructor"}


def entitlement_limit(org_id: str, key: str):
    org = (
        supabase.table("organisations")
        .select("settings")
        .eq("id", org_id)
        .limit(1)
        .execute()
    )
    settings = (org.data[0].get("settings") or {}) if org.data else {}
    # The existing WitStart pilot is intentionally contract-exempt. New customer
    # workspaces are not exempt and need an active/signed contract entitlement.
    if settings.get("pilot_mode") is True:
        return None

    contracts = (
        supabase.table("learnora_contracts")
        .select("id,status")
        .eq("organisation_id", org_id)
        .in_("status", ["signed", "active", "expiring"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not contracts.data:
        return 0

    entitlement = (
        supabase.table("learnora_contract_entitlements")
        .select("limit_value,enabled")
        .eq("contract_id", contracts.data[0]["id"])
        .eq("entitlement_key", key)
        .limit(1)
        .execute()
    )
    if not entitlement.data or not entitlement.data[0].get("enabled"):
        return 0
    # An enabled entitlement with a NULL limit means unlimited. Missing or
    # disabled entitlements are not interpreted as unlimited.
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
