"""Authoritative Learnora access resolver.

Commercial events create entitlements; this service decides whether an
identity may actually use a resource. Keep this logic central so frontend
routers never invent their own access rules.
"""
from datetime import datetime, timezone
from typing import Optional
from fastapi import HTTPException
from ..routers.auth import supabase

def _now():
    return datetime.now(timezone.utc)

def _active(row):
    if not row or row.get("status") not in {"active","trialing","paid","approved"}:
        return False
    start=row.get("starts_at")
    end=row.get("ends_at") or row.get("current_period_end")
    now=_now()
    if start:
        try:
            if datetime.fromisoformat(str(start).replace("Z","+00:00")) > now: return False
        except ValueError: pass
    if end:
        try:
            if datetime.fromisoformat(str(end).replace("Z","+00:00")) <= now: return False
        except ValueError: pass
    return True

def resolve_course_access(user_id:str, course_id:str, organisation_id:Optional[str]=None):
    """Return the strongest current access source, or None."""
    course=supabase.table("learnora_courses").select("id,organisation_id,ownership,status,creator_id").eq("id",course_id).limit(1).execute()
    if not course.data: return None
    c=course.data[0]
    if c.get("status")=="archived": return None

    rows=supabase.table("learnora_access_entitlements").select("*").eq("user_id",user_id).eq("course_id",course_id).eq("status","active").execute()
    for row in rows.data or []:
        if _active(row): return {"allowed":True,"source":row.get("source_type"),"entitlement":row}

    purchase=supabase.table("learnora_course_purchases").select("*").eq("user_id",user_id).eq("course_id",course_id).eq("status","paid").limit(1).execute()
    if purchase.data: return {"allowed":True,"source":"purchase","purchase":purchase.data[0]}

    if not organisation_id:
        memberships=supabase.table("organisation_members").select("organisation_id").eq("user_id",user_id).eq("status","active").limit(10).execute()
        for m in memberships.data or []:
            check=resolve_course_access(user_id,course_id,m.get("organisation_id")) if m.get("organisation_id") else None
            if check:return check

    if organisation_id:
        membership=supabase.table("organisation_members").select("id,status,role").eq("organisation_id",organisation_id).eq("user_id",user_id).eq("status","active").limit(1).execute()
        if membership.data:
            ca=supabase.table("course_access").select("*").eq("organisation_id",organisation_id).eq("course_id",course_id).eq("status","active").limit(1).execute()
            if ca.data:
                lifecycle=supabase.table("learnora_organisation_lifecycle").select("status").eq("organisation_id",organisation_id).limit(1).execute()
                if lifecycle.data and lifecycle.data[0].get("status") in {"active","expiring"}:
                    return {"allowed":True,"source":"organisation_assignment","membership":membership.data[0],"course_access":ca.data[0]}

    sub=supabase.table("learnora_subscriptions").select("*").eq("user_id",user_id).in_("status",["trialing","active"]).order("created_at",desc=True).limit(1).execute()
    if sub.data and _active(sub.data[0]):
        return {"allowed":True,"source":"subscription","subscription":sub.data[0]}

    return None

def require_course_access(user_id:str, course_id:str, organisation_id:Optional[str]=None):
    result=resolve_course_access(user_id,course_id,organisation_id)
    if not result:
        raise HTTPException(status_code=403,detail="You do not have access to this course.")
    return result
