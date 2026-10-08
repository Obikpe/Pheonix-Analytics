"""Learnora AI service layer.

The database remains the source of truth. AI may explain, coach, generate
practice, and interpret learning evidence, but it must not invent completion,
credentials, scores, purchases, permissions, or other authoritative state.

OpenRouter is the first provider and can be replaced without changing the
router contract.
"""

import os
import time
from datetime import datetime, timezone

import httpx

from routers.auth import supabase

DEFAULT_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "openrouter/auto",
).strip()

OPENROUTER_URL = os.getenv(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1",
).rstrip("/")

SYSTEM_PROMPTS = {
    "tutor": (
        "You are Learnora AI Tutor. Explain concepts clearly, use examples, "
        "ask useful checking questions, and adapt explanations to the learner. "
        "Never claim a learner completed work they have not shown."
    ),
    "coach": (
        "You are Learnora Learning Coach. Help the learner plan study, "
        "practise deliberately, reflect on weak areas, and choose the next "
        "useful action. Prefer concrete steps over generic motivation."
    ),
    "practice": (
        "You are Learnora Practice Coach. Generate practical exercises from "
        "the learner's topic and context. Give hints before full solutions "
        "unless the learner explicitly asks for the solution."
    ),
    "project": (
        "You are Learnora Project Coach. Help learners scope, debug, explain "
        "and improve projects. Never fabricate project results, links, "
        "datasets, evidence, or completed work."
    ),
    "instructor": (
        "You are Learnora Instructor Assistant. Help instructors draft "
        "explanations, exercises, rubrics, feedback and learning activities. "
        "Do not invent learner performance data."
    ),
    "organisation": (
        "You are Learnora Organisation Assistant. Help authorised users "
        "understand learning operations, course delivery, cohorts and "
        "progress. Treat database-derived facts as authoritative."
    ),
}


def _safe_int(value, fallback):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _effective_limits(user_id: str, organisation_id: str | None, feature: str):
    """Resolve the most specific active AI limit without trusting the client."""
    rows = (
        supabase
        .table("learnora_ai_limits")
        .select(
            "scope_type,scope_id,feature,requests_per_day,"
            "requests_per_month,max_input_chars,max_output_tokens,enabled"
        )
        .execute()
    ).data or []

    candidates = [
        ("user", str(user_id), feature),
        ("organisation", str(organisation_id) if organisation_id else None, feature),
        ("feature", None, feature),
        ("global", "*", "*"),
    ]

    for scope_type, scope_id, scope_feature in candidates:
        for row in rows:
            if not row.get("enabled", True):
                continue
            if row.get("scope_type") != scope_type:
                continue
            if scope_id is not None and str(row.get("scope_id")) != str(scope_id):
                continue
            if scope_id is None and row.get("scope_id") not in (None, ""):
                continue
            if row.get("feature") not in (None, "*", scope_feature):
                continue
            return {
                "enabled": True,
                "requests_per_day": row.get("requests_per_day"),
                "requests_per_month": row.get("requests_per_month"),
                "max_input_chars": _safe_int(
                    row.get("max_input_chars"), 12000
                ),
                "max_output_tokens": _safe_int(
                    row.get("max_output_tokens"), 1200
                ),
            }

    return {
        "enabled": True,
        "requests_per_day": 20,
        "requests_per_month": None,
        "max_input_chars": 12000,
        "max_output_tokens": 1200,
    }


def _usage_count(user_id: str, organisation_id: str | None, feature: str):
    start = datetime.now(timezone.utc).replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    ).isoformat()

    query = (
        supabase
        .table("ai_usage_logs")
        .select("id")
        .eq("user_id", user_id)
        .eq("request_status", "success")
        .gte("created_at", start)
    )

    rows = query.execute().data or []
    return len(rows)


def _fallback(feature: str, message: str) -> str:
    text = message.strip()
    if not text:
        return (
            "Tell me what you are learning or trying to accomplish, "
            "and I will help you take the next useful step."
        )

    if feature == "practice":
        return (
            "Let's practise this step by step. First, explain in your own "
            f"words what you already understand about: {text[:300]}"
        )

    if feature == "coach":
        return (
            "Start with one concrete action: define what you want to achieve "
            f"with '{text[:300]}', then choose the smallest task you can "
            "complete in 15 minutes."
        )

    if feature == "project":
        return (
            f"For '{text[:300]}', define the goal, inputs, expected output "
            "and how you will prove the result. Then tackle one small "
            "component at a time."
        )

    return (
        f"Let's break this down. What part of '{text[:300]}' is confusing, "
        "or where are you currently stuck?"
    )


def _learning_context(
    user_id: str,
    organisation_id: str | None,
) -> str:
    """Build a small, factual context block from Learnora's database."""
    facts: list[str] = []

    try:
        user = (
            supabase
            .table("users")
            .select("name,role")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if user.data:
            name = user.data[0].get("name")
            role = user.data[0].get("role")
            if name:
                facts.append(f"Learner name: {name}")
            if role:
                facts.append(f"Account role: {role}")
    except Exception:
        pass

    if organisation_id:
        try:
            organisation = (
                supabase
                .table("organisations")
                .select("name")
                .eq("id", organisation_id)
                .limit(1)
                .execute()
            )
            if organisation.data:
                facts.append(
                    f"Organisation: {organisation.data[0].get('name')}"
                )
        except Exception:
            pass

    try:
        enrolments = (
            supabase
            .table("learnora_enrolments")
            .select("course_id,status")
            .eq("user_id", user_id)
            .in_("status", ["active", "completed"])
            .limit(12)
            .execute()
        ).data or []

        course_ids = [row["course_id"] for row in enrolments if row.get("course_id")]
        if course_ids:
            courses = (
                supabase
                .table("learnora_courses")
                .select("id,title,level")
                .in_("id", course_ids)
                .execute()
            ).data or []

            course_map = {str(row["id"]): row for row in courses}
            names = []
            for row in enrolments:
                course = course_map.get(str(row["course_id"]))
                if course:
                    names.append(
                        f"{course.get('title')} ({row.get('status')})"
                    )

            if names:
                facts.append(
                    "Current/finished courses: " + "; ".join(names[:8])
                )
    except Exception:
        pass

    try:
        skills = (
            supabase
            .table("learner_skills")
            .select("skill_id,proficiency,status")
            .eq("user_id", user_id)
            .limit(15)
            .execute()
        ).data or []

        if skills:
            skill_text = "; ".join(
                f"{row.get('skill_id')}: {row.get('proficiency')}"
                for row in skills[:10]
            )
            facts.append("Recorded skills: " + skill_text)
    except Exception:
        pass

    if not facts:
        return ""

    return (
        "Learnora context below is factual application data. "
        "Do not infer facts that are not present.\n"
        + "\n".join(f"- {fact}" for fact in facts)
    )


def _conversation_history(conversation_id: str | None):
    if not conversation_id:
        return []

    rows = (
        supabase
        .table("learnora_ai_messages")
        .select("role,content")
        .eq("conversation_id", conversation_id)
        .in_("role", ["user", "assistant"])
        .order("created_at", desc=True)
        .limit(18)
        .execute()
    ).data or []

    rows.reverse()
    return rows


def _log_usage(payload: dict):
    try:
        supabase.table("ai_usage_logs").insert(payload).execute()
    except Exception as exc:
        print(f"AI usage log failed: {exc}")


async def generate(
    user_id: str,
    feature: str,
    message: str,
    organisation_id: str | None = None,
    conversation_id: str | None = None,
    model: str | None = None,
):
    limits = _effective_limits(user_id, organisation_id, feature)

    if not limits["enabled"]:
        return {
            "status": "disabled",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
        }

    if _usage_count(user_id, organisation_id, feature) >= (
        limits["requests_per_day"] or 20
    ):
        return {
            "status": "rate_limited",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
        }

    if len(message) > limits["max_input_chars"]:
        return {
            "status": "input_too_large",
            "content": (
                f"Your message is too long for this AI plan. "
                f"Please keep it under {limits['max_input_chars']} characters."
            ),
            "provider": "rules",
            "model": None,
        }

    started = time.perf_counter()

    provider_result = (
        supabase
        .table("learnora_ai_providers")
        .select("provider_key,default_model,enabled,priority")
        .eq("provider_key", "openrouter")
        .limit(1)