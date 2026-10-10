"""Learnora creator application, courses and earnings API."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase
from .permissions import PermissionContext, require_permission

router = APIRouter(prefix="/api/creator", tags=["Creator"])


class CreatorApplicationIn(BaseModel):
    application_data: dict = Field(default_factory=dict)


class CreatorCourseIn(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(..., min_length=2, max_length=160)
    description: str = Field(default="", max_length=10000)
    short_description: str = Field(default="", max_length=500)
    level: str = Field(default="beginner", max_length=50)


def _normalise_slug(value: str) -> str:
    return "-".join(value.strip().lower().split())


def _get_creator(user_id: str):
    result = (
        supabase
        .table("learnora_creator_accounts")
        .select("id,user_id,status,display_name,bio,payout_currency,commission_rate,approved_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


@router.post("/apply", status_code=201)
def apply(
    body: CreatorApplicationIn,
    user: CurrentUser = Depends(get_current_user),
):
    existing = (
        supabase
        .table("learnora_creator_applications")
        .select("id,status")
        .eq("user_id", user.id)
        .in_("status", ["submitted", "under_review", "approved"])
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(409, "You already have an active creator application.")

    account = _get_creator(str(user.id))
    if account and account["status"] in {"application", "approved", "suspended"}:
        raise HTTPException(409, "A creator account already exists for this user.")

    result = (
        supabase
        .table("learnora_creator_applications")
        .insert({
            "user_id": user.id,
            "application_data": body.application_data,
            "status": "submitted",
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to submit creator application.")

    return {"success": True, "application": result.data[0]}


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    applications = (
        supabase
        .table("learnora_creator_applications")
        .select("id,status,application_data,created_at,reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    application = applications.data[0] if applications.data else None
    if not creator:
        return {"success": True, "creator": None, "application": application, "sales": []}

    sales = (
        supabase
        .table("learnora_creator_sales")
        .select("*")
        .eq("creator_id", creator["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "creator": creator, "application": application, "sales": sales.data or []}


@router.get("/courses")
def list_creator_courses(user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator or creator.get("status") not in {"approved", "active"}:
        return {"success": True, "creator": creator, "courses": []}
    result = (
        supabase
        .table("learnora_courses")
        .select("id,title,slug,short_description,description,level,status,ownership,thumbnail_url,estimated_hours,created_at,updated_at")
        .eq("creator_id", creator["id"])
        .eq("ownership", "creator")
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "courses": result.data or []}


@router.post("/courses", status_code=201)
def create_course(
    body: CreatorCourseIn,
    user: CurrentUser = Depends(get_current_user),
):
    creator = _get_creator(str(user.id))
    if not creator or creator["status"] != "approved":
        raise HTTPException(403, "Approved creator account required.")

    slug = _normalise_slug(body.slug)
    if not slug:
        raise HTTPException(400, "Course slug is required.")

    existing = (
        supabase
        .table("learnora_courses")
        .select("id")
        .is_("organisation_id", "null")
        .eq("ownership", "creator")
        .eq("slug", slug)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(409, "That course slug is already in use.")

    result = (
        supabase
        .table("learnora_courses")
        .insert({
            "title": body.title.strip(),
            "slug": slug,
            "description": body.description.strip() or None,
            "short_description": body.short_description.strip() or None,
            "level": body.level.strip().lower(),
            "status": "draft",
            "ownership": "creator",
            "creator_id": creator["id"],
            "created_by": user.id,
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to create creator course.")

    return {"success": True, "course": result.data[0]}


@router.get("/earnings")
def earnings(user: CurrentUser = Depends(get_current_user)):
    creator = _get_creator(str(user.id))
    if not creator:
        raise HTTPException(404, "Creator account not found.")

    result = (
        supabase
        .table("learnora_creator_ledger")
        .select("*")
        .eq("creator_id", creator["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return {"success": True, "ledger": result.data or []}


@router.post("/admin/applications/{application_id}/review")
def review_application(
    application_id: str,
    status: str,
    context: PermissionContext = Depends(
        require_permission("users.update")
    ),
):
    if status not in {"approved", "declined"}:
        raise HTTPException(400, "Status must be approved or declined.")

    application = (
        supabase
        .table("learnora_creator_applications")
        .select("*")
        .eq("id", application_id)
        .limit(1)
        .execute()
    )
    if not application.data:
        raise HTTPException(404, "Creator application not found.")

    row = application.data[0]
    now = datetime.now(timezone.utc).isoformat()

    updated = (
        supabase
        .table("learnora_creator_applications")
        .update({
            "status": status,
            "reviewed_by": context.user_id,
            "reviewed_at": now,
        })
        .eq("id", application_id)
        .execute()
    )
    if not updated.data:
        raise HTTPException(500, "Unable to update creator application.")

    if status == "approved":
        existing = (
            supabase
            .table("learnora_creator_accounts")
            .select("id")
            .eq("user_id", row["user_id"])
            .limit(1)
            .execute()
        )

        application_data = row.get("application_data") or {}
        payload = {
            "user_id": row["user_id"],
            "status": "approved",
            "approved_by": context.user_id,
            "approved_at": now,
            "application_id": application_id,
            "display_name": str(application_data.get("display_name") or "").strip() or None,
            "bio": str(application_data.get("bio") or "").strip() or None,
        }

        if existing.data:
            account = (
                supabase
                .table("learnora_creator_accounts")
                .update(payload)
                .eq("id", existing.data[0]["id"])
                .execute()
            )
        else:
            account = (
                supabase
                .table("learnora_creator_accounts")
                .insert(payload)
                .execute()
            )

        if not account.data:
            raise HTTPException(500, "Creator account activation failed.")

    return {"success": True, "status": status}
