"""Database-backed in-app notifications for Learnora learners.

Notifications are deliberately best-effort: a notification write must never
turn a successful course publish/update into a failed course operation.
"""
import logging
import re
from datetime import datetime, timezone
from typing import Any

from routers.auth import supabase

logger = logging.getLogger(__name__)


def _normalise(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


def _course_text(course: dict) -> str:
    settings = course.get("settings") or {}
    values = [
        course.get("title"), course.get("short_description"),
        course.get("description"), course.get("level"),
        settings.get("track"), settings.get("category"),
        settings.get("subject"), settings.get("learning_track"),
    ]
    values.extend(settings.get("topics") or [])
    return _normalise(" ".join(str(v) for v in values if v))


def _profile_matches(profile: dict, course: dict, course_text: str) -> bool:
    track = _normalise(profile.get("preferred_track"))
    interests = [_normalise(v) for v in (profile.get("interests") or []) if _normalise(v)]
    if track:
        track_words = [w for w in track.split() if len(w) > 2]
        if track in course_text or (track_words and all(w in course_text for w in track_words)):
            return True
        # Short single-word tracks are matched only as whole normalized words.
        if len(track_words) == 1 and re.search(r"\b" + re.escape(track_words[0]) + r"\b", course_text):
            return True
    return any(i in course_text for i in interests)


def _candidate_user_ids(course: dict) -> set[str]:
    course_id = str(course.get("id") or "")
    ids: set[str] = set()
    # Existing learners should hear about material updates to courses they use.
    if course_id:
        try:
            enrolments = (
                supabase.table("learnora_enrolments")
                .select("user_id")
                .eq("course_id", course_id)
                .in_("status", ["active", "completed"])
                .execute()
            ).data or []
            ids.update(str(row["user_id"]) for row in enrolments if row.get("user_id"))
        except Exception:
            logger.exception("Could not resolve enrolled learners for notification")

    # Personalised recommendations are based on saved learner preferences.
    # No profile, no guessed track, and no synthetic recipients.
    try:
        profiles = (
            supabase.table("learner_onboarding_profiles")
            .select("user_id,preferred_track,interests,onboarding_completed")
            .eq("onboarding_completed", True)
            .limit(2000)
            .execute()
        ).data or []
        text = _course_text(course)
        for profile in profiles:
            user_id = profile.get("user_id")
            if user_id and _profile_matches(profile, course, text):
                ids.add(str(user_id))
    except Exception:
        logger.exception("Could not resolve learner track matches for notification")
    return ids


def _send_to_users(course: dict, event: str, title: str, body: str, action_url: str) -> int:
    try:
        course_id = str(course.get("id") or "")
        user_ids = _candidate_user_ids(course)
        if not user_ids:
            return 0

        # Publish events are idempotent. Course updates, by contrast, may
        # happen repeatedly and each meaningful update should be announced.
        already_notified: set[str] = set()
        if event == "course_published":
            for user_id in user_ids:
                try:
                    rows = (
                        supabase.table("learnora_notifications")
                        .select("data")
                        .eq("user_id", user_id)
                        .eq("notification_type", event)
                        .limit(100)
                        .execute()
                    ).data or []
                    if any(
                        isinstance(row.get("data"), dict)
                        and str((row.get("data") or {}).get("course_id")) == course_id
                        for row in rows
                    ):
                        already_notified.add(user_id)
                except Exception:
                    logger.exception("Could not check duplicate publish notification")
        now = datetime.now(timezone.utc).isoformat()
        rows_to_insert = [{
            "user_id": user_id,
            "organisation_id": course.get("organisation_id"),
            "notification_type": event,
            "title": title,
            "body": body,
            "action_url": action_url,
            "data": {"course_id": course_id, "event": event, "updated_at": now},
            "created_at": now,
        } for user_id in user_ids if user_id not in already_notified]
        if not rows_to_insert:
            return 0
        result = supabase.table("learnora_notifications").insert(rows_to_insert).execute()
        return len(result.data or [])
    except Exception:
        logger.exception("Notification delivery failed for course %s", course.get("id"))
        return 0


def notify_course_published(course: dict) -> int:
    """Notify learners whose saved track/interests match a newly published course."""
    title = str(course.get("title") or "A new Learnora course")
    return _send_to_users(
        course, "course_published", f"New course: {title}",
        f"A new course is available that may fit your learning track: {title}.",
        f"/courses/{course.get('id')}",
    )


def notify_course_updated(course: dict, changed_fields: list[str] | None = None) -> int:
    """Notify matched learners and enrolled learners about a published-course update."""
    title = str(course.get("title") or "Your course")
    changed = [x for x in (changed_fields or []) if x not in {"status", "updated_at"}]
    if not changed:
        return 0
    return _send_to_users(
        course, "course_updated", f"Course updated: {title}",
        f"There is a new update to {title}. Open the course to review the latest details.",
        f"/courses/{course.get('id')}",
    )
