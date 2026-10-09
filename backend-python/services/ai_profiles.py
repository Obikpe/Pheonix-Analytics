"""Learnora AI service layer.

AI is an interpretation and assistance layer. Database records remain
authoritative for identity, access, progress, purchases, scores and evidence.
"""

import time
from datetime import datetime, timezone

from routers.auth import supabase
from services.ai_gateway import generate as generate_llm

SYSTEM_PROMPTS = {
    "tutor": (
        "You are Learnora AI Tutor. Explain clearly, use examples, check "
        "understanding, and never claim work was completed unless the data "
        "or learner message proves it."
    ),
    "coach": (
        "You are Learnora Learning Coach. Turn goals into concrete study "
        "actions, deliberate practice and reflection."
    ),
    "practice": (
        "You are Learnora Practice Coach. Create practical exercises and "
        "give hints before solutions unless the learner asks for the answer."
    ),
    "project": (
        "You are Learnora Project Coach. Help scope, debug and improve "
        "projects without fabricating evidence, results or links."
    ),
    "summarise": (
        "You are Learnora Lesson Summariser. Summarise only the lesson text "
        "or notes supplied by the learner. Preserve key concepts, definitions, "
        "steps, examples and caveats. Separate stated facts from interpretation; "
        "never invent content or citations. If no lesson material is supplied, "
        "ask the learner to provide it."
    ),
    "instructor": (
        "You are Learnora Instructor Assistant. Help instructors create "
        "explanations, exercises, rubrics and feedback without inventing "
        "learner performance."
    ),
    "organisation": (
        "You are Learnora Organisation Assistant. Help authorised users "
        "with learning operations, cohorts, courses and progress. Database "
        "facts are authoritative."
    ),
    "contract_drafting": (
        "You are Learnora Contract Drafting Assistant. Draft only from the "
        "structured commercial terms and approved clause library supplied to "
        "you. Never invent parties, prices, dates, legal rights, obligations "
        "or other commercial facts."
    ),
    "content_generation": (
        "You are Learnora Content Generation Assistant. Create accurate, "
        "structured learning content from the supplied brief. Do not invent "
        "learner outcomes, citations or platform facts."
    ),
    "advanced_reasoning": (
        "You are Learnora Advanced Reasoning Assistant. Analyse the supplied "
        "facts carefully, state uncertainty, and do not invent missing evidence."
    ),
}

FEATURE_PROFILES = {
    "tutor": "tutor",
    "coach": "coach",
    "practice": "practice",
    "project": "project",
    "summarise": "summarise",
    "instructor": "instructor",
    "organisation": "organisation",
    "contract_drafting": "contract_drafting",
    "content_generation": "content_generation",
    "advanced_reasoning": "advanced_reasoning",
}


def _int(value, fallback):
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _effective_limits(user_id, organisation_id, feature):
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

    for scope_type, scope_id, wanted_feature in candidates:
        for row in rows:
            if not row.get("enabled", True):
                continue
            if row.get("scope_type") != scope_type:
                continue

            actual_scope = row.get("scope_id")
            if scope_id is not None and str(actual_scope) != str(scope_id):
                continue
            if scope_id is None and actual_scope not in (None, ""):
                continue

            actual_feature = row.get("feature")
            if actual_feature not in (None, "*", wanted_feature):
                continue

            return {
                "enabled": True,
                "requests_per_day": row.get("requests_per_day") or 20,
                "requests_per_month": row.get("requests_per_month"),
                "max_input_chars": _int(row.get("max_input_chars"), 12000),
                "max_output_tokens": _int(row.get("max_output_tokens"), 1200),
            }

    return {
        "enabled": True,
        "requests_per_day": 20,
        "requests_per_month": None,
        "max_input_chars": 12000,
        "max_output_tokens": 1200,
    }


def _usage_since(user_id, start):
    result = (
        supabase
        .table("ai_usage_logs")
        .select("id")
        .eq("user_id", user_id)
        .eq("request_status", "success")
        .gte("created_at", start)
        .execute()
    )
    return len(result.data or [])


def _usage_window_start(days: int):
    now = datetime.now(timezone.utc)
    if days == 1:
        return now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    return datetime(
        now.year,
        now.month,
        1,
        tzinfo=timezone.utc,
    ).isoformat()


def _fallback(feature, message):
    text = message.strip()

    if not text:
        return (
            "Tell me what you are learning or trying to accomplish, "
            "and I will help you take the next useful step."
        )

    if feature == "practice":
        return (
            "Let's practise step by step. First, explain what you already "
            f"understand about: {text[:300]}"
        )

    if feature == "coach":
        return (
            f"For '{text[:300]}', define the outcome, then choose the "
            "smallest useful task you can complete in 15 minutes."
        )

    if feature == "project":
        return (
            f"For '{text[:300]}', define the goal, inputs, expected output "
            "and how you will prove the result."
        )

    if feature == "summarise":
        return (
            "I can summarise the lesson accurately once you paste the lesson "
            "text or notes you want me to work from."
        )

    if feature == "advanced_reasoning":
        return (
            f"Let's reason from the available evidence about '{text[:300]}'. "
            "Separate known facts, assumptions and the next evidence needed."
        )

    return (
        f"Let's break this down. What part of '{text[:300]}' is confusing "
        "or where are you currently stuck?"
    )


def _learning_context(user_id, organisation_id):
    facts = []

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
            row = user.data[0]
            if row.get("name"):
                facts.append(f"Learner name: {row['name']}")
            if row.get("role"):
                facts.append(f"Account role: {row['role']}")
    except Exception:
        pass

    if organisation_id:
        try:
            org = (
                supabase
                .table("organisations")
                .select("name")
                .eq("id", organisation_id)
                .limit(1)
                .execute()
            )
            if org.data and org.data[0].get("name"):
                facts.append(f"Organisation: {org.data[0]['name']}")
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

        ids = [row["course_id"] for row in enrolments if row.get("course_id")]
        if ids:
            courses = (
                supabase
                .table("learnora_courses")
                .select("id,title,level")
                .in_("id", ids)
                .execute()
            ).data or []

            course_map = {str(row["id"]): row for row in courses}
            names = []
            for enrolment in enrolments:
                course = course_map.get(str(enrolment["course_id"]))
                if course:
                    names.append(
                        f"{course.get('title')} ({enrolment.get('status')})"
                    )
            if names:
                facts.append("Courses: " + "; ".join(names[:8]))
    except Exception:
        pass

    try:
        skills = (
            supabase
            .table("learner_skills")
            .select("skill_id,proficiency,status")
            .eq("user_id", user_id)
            .limit(10)
            .execute()
        ).data or []

        if skills:
            facts.append(
                "Recorded skills: "
                + "; ".join(
                    f"{row.get('skill_id')}: {row.get('proficiency')}"
                    for row in skills
                )
            )
    except Exception:
        pass

    if not facts:
        return ""

    return (
        "Learnora context is factual application data. Do not infer facts "
        "that are not present.\n"
        + "\n".join(f"- {fact}" for fact in facts)
    )


def _history(conversation_id):
    if not conversation_id:
        return []

    result = (
        supabase
        .table("learnora_ai_messages")
        .select("role,content")
        .eq("conversation_id", conversation_id)
        .in_("role", ["user", "assistant"])
        .order("created_at", desc=True)
        .limit(18)
        .execute()
    )

    rows = result.data or []
    rows.reverse()
    return rows


def _log(payload):
    try:
        supabase.table("ai_usage_logs").insert(payload).execute()
    except Exception as exc:
        print(f"AI usage log failed: {exc}")


async def generate(
    user_id,
    feature,
    message,
    organisation_id=None,
    conversation_id=None,
):
    limits = _effective_limits(user_id, organisation_id, feature)

    if not limits["enabled"]:
        return {
            "status": "disabled",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
        }

    daily_limit = limits.get("requests_per_day")
    if daily_limit is not None and _usage_since(
        user_id,
        _usage_window_start(1),
    ) >= int(daily_limit):
        return {
            "status": "rate_limited",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
            "limit_scope": "day",
        }

    monthly_limit = limits.get("requests_per_month")
    if monthly_limit is not None and _usage_since(
        user_id,
        _usage_window_start(30),
    ) >= int(monthly_limit):
        return {
            "status": "rate_limited",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
            "limit_scope": "month",
        }

    if len(message) > limits["max_input_chars"]:
        return {
            "status": "input_too_large",
            "content": (
                "Your message is too long for this AI plan. "
                f"Please keep it under {limits['max_input_chars']} characters."
            ),
            "provider": "rules",
            "model": None,
        }

    started = time.perf_counter()
    profile = FEATURE_PROFILES.get(feature, "tutor")

    messages = [{
        "role": "system",
        "content": SYSTEM_PROMPTS.get(feature, SYSTEM_PROMPTS["tutor"]),
    }]

    context = _learning_context(user_id, organisation_id)
    if context:
        messages.append({"role": "system", "content": context})

    messages.extend(_history(conversation_id))
    messages.append({"role": "user", "content": message})

    result = await generate_llm(
        profile,
        messages,
        max_output_tokens=limits["max_output_tokens"],
        title="Learnora ME",
        timeout=45,
    )

    if result["status"] == "disabled":
        return {
            "status": "disabled",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
        }

    if result["status"] != "success":
        latency = result.get("latency_ms") or int(
            (time.perf_counter() - started) * 1000
        )
        _log({
            "user_id": user_id,
            "organisation_id": organisation_id,
            "feature": feature,
            "provider": result.get("provider"),
            "model": result.get("model"),
            "request_status": "failed",
            "latency_ms": latency,
            "metadata": {
                "error": result.get("error", result["status"]),
                "fallback": True,
                "session_id": conversation_id,
                "profile": profile,
            },
        })
        return {
            "status": "success",
            "content": _fallback(feature, message),
            "provider": "rules",
            "model": None,
            "latency_ms": latency,
            "fallback_reason": result["status"],
        }

    usage = result.get("usage") or {}
    latency = result.get("latency_ms") or int(
        (time.perf_counter() - started) * 1000
    )
    _log({
        "user_id": user_id,
        "organisation_id": organisation_id,
        "feature": feature,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "request_status": "success",
        "latency_ms": latency,
        "input_tokens": usage.get("prompt_tokens"),
        "output_tokens": usage.get("completion_tokens"),
        "metadata": {
            "session_id": conversation_id,
            "profile": profile,
            "fallback_used": bool(result.get("fallback_used")),
            "fallback_reason": result.get("fallback_reason"),
        },
    })

    return {
        "status": "success",
        "content": result["content"],
        "provider": result.get("provider"),
        "model": result.get("model"),
        "latency_ms": latency,
        "usage": usage,
        "profile": profile,
        "fallback_used": bool(result.get("fallback_used")),
        "fallback_reason": result.get("fallback_reason"),
    }


