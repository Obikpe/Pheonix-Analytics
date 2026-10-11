"""Learner onboarding profile and course recommendations."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from .auth import CurrentUser, get_current_user, supabase

router = APIRouter(prefix="/api/learner", tags=["Learner onboarding"])

class OnboardingIn(BaseModel):
    goal: str = Field(..., min_length=3, max_length=1000)
    experience_level: str = Field(..., pattern="^(beginner|some_experience|experienced|career_changer)$")
    preferred_track: str = Field(..., min_length=2, max_length=120)
    interests: list[str] = Field(default_factory=list, max_length=12)
    weekly_time_minutes: int = Field(default=180, ge=15, le=3000)

def _profile(user_id):
    result = supabase.table("learner_onboarding_profiles").select("*").eq("user_id", user_id).limit(1).execute()
    return result.data[0] if result.data else None

@router.get("/onboarding")
def get_onboarding(user: CurrentUser = Depends(get_current_user)):
    profile = _profile(str(user.id))
    return {"success": True, "profile": profile, "completed": bool(profile and profile.get("onboarding_completed"))}

@router.put("/onboarding")
def save_onboarding(body: OnboardingIn, user: CurrentUser = Depends(get_current_user)):
    if getattr(user, "role", "normal") not in {"normal"}:
        raise HTTPException(403, "Personal learning preferences are only available to individual learner accounts.")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("learner_onboarding_profiles").upsert({
        "user_id": str(user.id),
        "goal": body.goal.strip(),
        "experience_level": body.experience_level,
        "preferred_track": body.preferred_track.strip(),
        "interests": [x.strip() for x in body.interests if x.strip()][:12],
        "weekly_time_minutes": body.weekly_time_minutes,
        "onboarding_completed": True,
        "updated_at": now,
    }, on_conflict="user_id").execute()
    if not result.data:
        raise HTTPException(500, "Unable to save your learning preferences.")
    return {"success": True, "profile": result.data[0]}

@router.get("/recommendations")
def recommendations(user: CurrentUser = Depends(get_current_user)):
    role = getattr(user, "role", "normal")
    if role == "witstart":
        raise HTTPException(403, "Organisation learners can only access courses assigned by their organisation.")
    profile = _profile(str(user.id))
    enrolments = supabase.table("learnora_enrolments").select("course_id,status").eq("user_id", str(user.id)).in_("status", ["active","completed"]).execute().data or []
    enrolled_ids = {str(x.get("course_id")) for x in enrolments}
    courses = supabase.table("learnora_courses").select("id,title,slug,short_description,description,level,thumbnail_url,estimated_hours,ownership").eq("status","published").limit(200).execute().data or []
    interests = [x.lower() for x in (profile or {}).get("interests", [])]
    track = ((profile or {}).get("preferred_track") or "").lower()
    goal = ((profile or {}).get("goal") or "").lower()
    level = (profile or {}).get("experience_level") or "beginner"
    ranked = []
    for course in courses:
        cid = str(course.get("id"))
        if cid in enrolled_ids:
            continue
        text = " ".join(str(course.get(k) or "") for k in ("title","short_description","description","level")).lower()
        score = sum(3 for item in interests if item and item in text)
        score += 4 if track and track in text else 0
        score += 2 if goal and any(word in text for word in goal.split() if len(word) > 4) else 0
        score += 1 if str(course.get("level") or "").lower() in {level, "mixed"} else 0
        ranked.append((score, course))
    ranked.sort(key=lambda x: (x[0], str(x[1].get("title") or "").lower()), reverse=True)
    return {
        "success": True,
        "onboarding_required": not bool(profile and profile.get("onboarding_completed")),
        "recommended": [{"course": c, "reason": "Matched to your goals and learning interests." if score else "A course to explore next.", "score": score} for score,c in ranked[:6]],
        "other_courses": [{"course": c} for _,c in ranked[6:18]],
        "tracks": sorted({str(c.get("level")) for _,c in ranked if c.get("level")}),
    }
