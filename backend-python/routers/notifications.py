"""Authenticated learner notification inbox."""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from .auth import CurrentUser, get_current_user, supabase

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/me")
def list_my_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    unread_only: bool = False,
    user: CurrentUser = Depends(get_current_user),
):
    query = (
        supabase.table("learnora_notifications")
        .select("id,notification_type,title,body,action_url,data,read_at,created_at")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .limit(limit)
    )
    if unread_only:
        query = query.is_("read_at", "null")
    rows = query.execute().data or []
    return {
        "success": True,
        "notifications": rows,
        "unread_count": sum(1 for row in rows if not row.get("read_at")),
    }


@router.get("/unread-count")
def unread_notification_count(user: CurrentUser = Depends(get_current_user)):
    rows = (
        supabase.table("learnora_notifications")
        .select("id")
        .eq("user_id", str(user.id))
        .is_("read_at", "null")
        .limit(500)
        .execute()
    ).data or []
    return {"success": True, "unread_count": len(rows)}


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID,
    user: CurrentUser = Depends(get_current_user),
):
    result = (
        supabase.table("learnora_notifications")
        .update({"read_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(notification_id))
        .eq("user_id", str(user.id))
        .is_("read_at", "null")
        .execute()
    )
    if not result.data:
        # Don't reveal whether an ID belongs to another account.
        existing = (
            supabase.table("learnora_notifications")
            .select("id,read_at")
            .eq("id", str(notification_id))
            .eq("user_id", str(user.id))
            .limit(1)
            .execute()
        ).data or []
        if not existing:
            raise HTTPException(404, "Notification not found.")
        return {"success": True, "already_read": True}
    return {"success": True, "notification": result.data[0]}


@router.post("/read-all")
def mark_all_notifications_read(user: CurrentUser = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    result = (
        supabase.table("learnora_notifications")
        .update({"read_at": now})
        .eq("user_id", str(user.id))
        .is_("read_at", "null")
        .execute()
    )
    return {"success": True, "updated": len(result.data or [])}
