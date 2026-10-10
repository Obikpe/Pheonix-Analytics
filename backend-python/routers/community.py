import os, httpx
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from routers.auth import require_active, CurrentUser, get_current_user, supabase

router = APIRouter()

class Question(BaseModel):
    lesson: str = Field(min_length=1, max_length=200)
    question: str = Field(min_length=3, max_length=2000)

class DiscussionCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=180)
    body: str = Field(..., min_length=5, max_length=10000)
    category: str = Field(default="question", max_length=20)
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    organisation_id: Optional[str] = None


class ReplyCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)


class DiscussionStatusUpdate(BaseModel):
    status: str


def _ensure_community_user(user: CurrentUser):
    if user.role not in {"normal", "witstart"}:
        raise HTTPException(403, "This account cannot access the learner community.")


def _has_course_enrolment(user_id: str, course_id: str) -> bool:
    rows = (supabase.table("learnora_enrolments").select("id")
        .eq("user_id", user_id).eq("course_id", course_id)
        .in_("status", ["active", "completed"]).limit(1).execute()).data
    return bool(rows)


def _has_org_membership(user_id: str, organisation_id: str) -> bool:
    rows = (supabase.table("organisation_members").select("id,role")
        .eq("user_id", user_id).eq("organisation_id", organisation_id)
        .eq("status", "active").limit(1).execute()).data
    return bool(rows)


def _get_discussion(discussion_id: str):
    rows = (supabase.table("learnora_discussions").select("*")
        .eq("id", discussion_id).neq("status", "hidden").limit(1).execute()).data
    if not rows:
        raise HTTPException(404, "Discussion not found.")
    return rows[0]


def _can_access(user: CurrentUser, discussion: dict) -> bool:
    if discussion.get("course_id") and not _has_course_enrolment(str(user.id), str(discussion["course_id"])):
        return False
    if discussion.get("organisation_id") and not _has_org_membership(str(user.id), str(discussion["organisation_id"])):
        return False
    return True


def _enrich_authors(rows: list[dict]) -> list[dict]:
    user_ids = list({str(row["user_id"]) for row in rows if row.get("user_id")})
    if not user_ids:
        return rows
    users = (supabase.table("users").select("id,name").in_("id", user_ids).execute()).data or []
    names = {str(row["id"]): row.get("name") for row in users}
    return [{**row, "author_name": names.get(str(row.get("user_id"))) or "Learnora member"} for row in rows]


@router.get("/discussions")
def list_discussions(
    course_id: Optional[str] = None,
    organisation_id: Optional[str] = None,
    user: CurrentUser = Depends(get_current_user),
):
    _ensure_community_user(user)
    query = supabase.table("learnora_discussions").select(
        "id,user_id,course_id,lesson_id,organisation_id,title,body,category,status,created_at,updated_at"
    ).neq("status", "hidden").order("created_at", desc=True).limit(100)
    if course_id:
        if not _has_course_enrolment(str(user.id), course_id):
            raise HTTPException(403, "You must be enrolled in this course to view its discussions.")
        query = query.eq("course_id", course_id)
    elif organisation_id:
        if not _has_org_membership(str(user.id), organisation_id):
            raise HTTPException(403, "You are not a member of this organisation.")
        query = query.eq("organisation_id", organisation_id)
    else:
        query = query.is_("course_id", "null").is_("organisation_id", "null")
    rows = query.execute().data or []
    # A discussion may have both course and organisation scope on legacy rows.
    # Never return it unless the viewer has access to every attached scope.
    rows = [row for row in rows if _can_access(user, row)]
    replies = []
    if rows:
        reply_rows = (supabase.table("learnora_discussion_replies").select("discussion_id")
            .eq("status", "visible").in_("discussion_id", [row["id"] for row in rows]).execute()).data or []
        counts = {}
        for reply in reply_rows:
            key = str(reply["discussion_id"])
            counts[key] = counts.get(key, 0) + 1
        rows = [{**row, "reply_count": counts.get(str(row["id"]), 0)} for row in rows]
    return {"success": True, "discussions": _enrich_authors(rows)}


@router.post("/discussions", status_code=201)
def create_discussion(body: DiscussionCreate, user: CurrentUser = Depends(get_current_user)):
    _ensure_community_user(user)
    if body.category not in {"question", "discussion"}:
        raise HTTPException(400, "Category must be question or discussion.")
    if body.course_id and body.organisation_id:
        raise HTTPException(400, "Choose either a course discussion or an organisation discussion, not both.")
    if body.course_id and not _has_course_enrolment(str(user.id), body.course_id):
        raise HTTPException(403, "You must be enrolled in this course to post there.")
    if body.organisation_id and not _has_org_membership(str(user.id), body.organisation_id):
        raise HTTPException(403, "You are not a member of this organisation.")
    if body.lesson_id:
        lesson = (supabase.table("learnora_lessons").select("id,module_id").eq("id", body.lesson_id).limit(1).execute()).data
        if not lesson:
            raise HTTPException(404, "Lesson not found.")
        module = (supabase.table("course_modules").select("course_id").eq("id", lesson[0]["module_id"]).limit(1).execute()).data
        if not module or (body.course_id and str(module[0]["course_id"]) != str(body.course_id)):
            raise HTTPException(400, "The lesson does not belong to the selected course.")
        if not body.course_id:
            raise HTTPException(400, "A lesson discussion must include its course.")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("learnora_discussions").insert({
        "user_id": user.id, "course_id": body.course_id, "lesson_id": body.lesson_id,
        "organisation_id": body.organisation_id, "title": body.title.strip(),
        "body": body.body.strip(), "category": body.category, "status": "open",
        "created_at": now, "updated_at": now,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Discussion could not be saved.")
    return {"success": True, "discussion": {**result.data[0], "author_name": user.name or "You", "reply_count": 0}}


@router.get("/discussions/{discussion_id}")
def get_discussion(discussion_id: str, user: CurrentUser = Depends(get_current_user)):
    _ensure_community_user(user)
    discussion = _get_discussion(discussion_id)
    if not _can_access(user, discussion):
        raise HTTPException(403, "You do not have access to this discussion.")
    replies = (supabase.table("learnora_discussion_replies").select(
        "id,discussion_id,user_id,body,is_answer,status,created_at,updated_at"
    ).eq("discussion_id", discussion_id).eq("status", "visible").order("created_at").execute()).data or []
    discussion_author = (supabase.table("users").select("name").eq("id", discussion["user_id"]).limit(1).execute()).data
    return {
        "success": True,
        "discussion": {**discussion, "author_name": (discussion_author[0].get("name") if discussion_author else None) or "Learnora member"},
        "replies": _enrich_authors(replies),
        "is_author": str(discussion["user_id"]) == str(user.id),
    }


@router.post("/discussions/{discussion_id}/replies", status_code=201)
def create_discussion_reply(discussion_id: str, body: ReplyCreate, user: CurrentUser = Depends(get_current_user)):
    _ensure_community_user(user)
    discussion = _get_discussion(discussion_id)
    if not _can_access(user, discussion):
        raise HTTPException(403, "You do not have access to this discussion.")
    if discussion.get("status") != "open":
        raise HTTPException(409, "This discussion is closed to new replies.")
    now = datetime.now(timezone.utc).isoformat()
    result = supabase.table("learnora_discussion_replies").insert({
        "discussion_id": discussion_id, "user_id": user.id, "body": body.body.strip(),
        "is_answer": False, "status": "visible", "created_at": now, "updated_at": now,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Reply could not be saved.")
    return {"success": True, "reply": {**result.data[0], "author_name": user.name or "You"}}


@router.patch("/discussions/{discussion_id}")
def update_discussion_status(discussion_id: str, body: DiscussionStatusUpdate, user: CurrentUser = Depends(get_current_user)):
    _ensure_community_user(user)
    discussion = _get_discussion(discussion_id)
    if str(discussion["user_id"]) != str(user.id):
        raise HTTPException(403, "Only the discussion author can change its status.")
    if body.status not in {"open", "closed"}:
        raise HTTPException(400, "Status must be open or closed.")
    result = supabase.table("learnora_discussions").update({
        "status": body.status, "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", discussion_id).execute()
    return {"success": True, "discussion": (result.data or [discussion])[0]}


@router.post("/discussions/{discussion_id}/replies/{reply_id}/answer")
def mark_discussion_answer(discussion_id: str, reply_id: str, user: CurrentUser = Depends(get_current_user)):
    _ensure_community_user(user)
    discussion = _get_discussion(discussion_id)
    if str(discussion["user_id"]) != str(user.id):
        raise HTTPException(403, "Only the discussion author can mark an answer.")
    reply = (supabase.table("learnora_discussion_replies").select("id").eq("id", reply_id).eq("discussion_id", discussion_id).eq("status", "visible").limit(1).execute()).data
    if not reply:
        raise HTTPException(404, "Reply not found.")
    supabase.table("learnora_discussion_replies").update({"is_answer": False}).eq("discussion_id", discussion_id).execute()
    result = supabase.table("learnora_discussion_replies").update({"is_answer": True}).eq("id", reply_id).execute()
    return {"success": True, "reply": (result.data or reply)[0]}


@router.post("/question")
async def community_question(body: Question, user: CurrentUser = Depends(require_active)):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {os.getenv('RESEND_API_KEY', '')}"},
            json={
                "from": os.getenv("EMAIL_FROM"),
                "to": [os.getenv("ADMIN_NOTIFY_EMAIL")],
                "subject": f"New question in {body.lesson}",
                "text": f"From: {user.email}\n\n{body.question}",  # plain text, no HTML injection
            },
        )
    if r.status_code >= 300:
        raise HTTPException(502, "Could not send your question. Try again later.")
    return {"ok": True}