"""Authoritative Learnora access resolver.

Commercial events create entitlements; this service decides whether an
identity may actually use a resource. Keep this logic central so frontend
routers never invent their own access rules.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException

from routers.auth import supabase


def _now():
    return datetime.now(timezone.utc)


def _active(row):
    if not row or row.get("status") not in {"active", "trialing", "paid", "approved"}:
        return False

    start = row.get("starts_at")
    end = row.get("ends_at") or row.get("current_period_end")
    now = _now()

    if start:
        try:
            if datetime.fromisoformat(str(start).replace("Z", "+00:00")) > now:
                return False
        except ValueError:
            return False

    if end:
        try:
            if datetime.fromisoformat(str(end).replace("Z", "+00:00")) <= now:
                return False
        except ValueError:
            return False

    return True


def _course(course_id: str):
    result = (
        supabase
        .table("learnora_courses")
        .select("id,organisation_id,ownership,status,creator_id")
        .eq("id", course_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def resolve_course_access(
    user_id: str,
    course_id: str,
    organisation_id: Optional[str] = None,
):
    """Return the strongest current access source, or None."""
    course = _course(course_id)

    if not course or course.get("status") != "published":
        return None

    entitlements = (
        supabase
        .table("learnora_access_entitlements")
        .select("*")
        .eq("course_id", course_id)
        .eq("status", "active")
        .execute()
    ).data or []

    for entitlement in entitlements:
        user_match = (
            entitlement.get("user_id")
            and str(entitlement["user_id"]) == str(user_id)
        )
        org_match = (
            organisation_id
            and entitlement.get("organisation_id")
            and str(entitlement["organisation_id"]) == str(organisation_id)
        )

        if (user_match or org_match) and _active(entitlement):
            return {
                "allowed": True,
                "source": entitlement.get("source_type"),
                "entitlement": entitlement,
            }

    purchase = (
        supabase
        .table("learnora_course_purchases")
        .select("*")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .eq("status", "paid")
        .order("purchased_at", desc=True)
        .limit(1)
        .execute()
    )

    if purchase.data:
        return {
            "allowed": True,
            "source": "purchase",
            "purchase": purchase.data[0],
        }

    if not organisation_id:
        memberships = (
            supabase
            .table("organisation_members")
            .select("organisation_id")
            .eq("user_id", user_id)
            .eq("status", "active")
            .limit(20)
            .execute()
        ).data or []

        for membership in memberships:
            oid = membership.get("organisation_id")
            if not oid:
                continue

            access = resolve_course_access(
                user_id,
                course_id,
                str(oid),
            )
            if access:
                return access

    else:
        membership = (
            supabase
            .table("organisation_members")
            .select("id,status,role")
            .eq("organisation_id", organisation_id)
            .eq("user_id", user_id)
            .eq("status", "active")
            .limit(1)
            .execute()
        )

        if membership.data:
            course_access = (
                supabase
                .table("course_access")
                .select("*")
                .eq("organisation_id", organisation_id)
                .eq("course_id", course_id)
                .eq("status", "active")
                .limit(1)
                .execute()
            )

            if course_access.data:
                lifecycle = (
                    supabase
                    .table("learnora_organisation_lifecycle")
                    .select("status")
                    .eq("organisation_id", organisation_id)
                    .limit(1)
                    .execute()
                )

                if lifecycle.data and lifecycle.data[0].get("status") in {
                    "active",
                    "expiring",
                }:
                    return {
                        "allowed": True,
                        "source": "organisation_assignment",
                        "membership": membership.data[0],
                        "course_access": course_access.data[0],
                    }

    if course.get("ownership") == "learnora":
        subscription = (
            supabase
            .table("learnora_subscriptions")
            .select("*")
            .eq("user_id", user_id)
            .in_("status", ["trialing", "active"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if subscription.data and _active(subscription.data[0]):
            return {
                "allowed": True,
                "source": "subscription",
                "subscription": subscription.data[0],
            }

    return None


def require_course_access(
    user_id: str,
    course_id: str,
    organisation_id: Optional[str] = None,
):
    result = resolve_course_access(
        user_id,
        course_id,
        organisation_id,
    )

    if not result:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this course.",
        )

    return result
