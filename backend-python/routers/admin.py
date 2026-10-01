"""Admin routes - every route requires an admin token."""
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import (
    supabase, require_admin, CurrentUser,
    hash_password, norm_email, check_password_rules, ROLES,
)

# Router-level dependency: no route in this file is reachable without an admin token.
router = APIRouter(dependencies=[Depends(require_admin)])

SAFE_COLUMNS = "id, email, name, role, sub_status, is_paid, subscription_tier, created_at"


class CreateUser(BaseModel):
    email: str
    name: Optional[str] = None
    password: str
    role: str = "witstart"


class GrantFreeRequest(BaseModel):
    email: str
    months: int = Field(default=1, ge=1, le=12)


@router.get("/users")
def get_all_users():
    res = supabase.table("users").select(SAFE_COLUMNS).execute()
    return {"users": res.data or []}


@router.post("/users", status_code=201)
def create_user(payload: CreateUser):
    email = norm_email(payload.email)
    check_password_rules(payload.password)
    if payload.role not in ROLES:
        raise HTTPException(400, f"Role must be one of: {', '.join(sorted(ROLES))}")

    if supabase.table("users").select("id").eq("email", email).execute().data:
        raise HTTPException(400, "User with this email already exists")

    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=91)).isoformat() if payload.role == "witstart" else None

    row = {
        "email": email,
        "name": (payload.name or "").strip()[:100] or None,
        "password_hash": hash_password(payload.password),
        "role": payload.role,
        "sub_status": "active",
        "is_paid": True,
        "subscription_tier": "paid",
        "created_at": now.isoformat(),
    }
    if expires_at:
        row["expires_at"] = expires_at

    res = supabase.table("users").insert(row).execute()
    if not res.data:
        raise HTTPException(500, "Failed to create user")
    return {"status": "success", "email": email, "role": payload.role, "expires_at": expires_at}


@router.delete("/users/{email}")
def delete_user(email: str, admin: CurrentUser = Depends(require_admin)):
    email = norm_email(email)
    if email == admin.email:
        raise HTTPException(400, "You cannot delete your own account")
    res = supabase.table("users").delete().eq("email", email).execute()
    if not res.data:
        raise HTTPException(404, "User not found or already deleted")
    return {"status": "success", "message": f"User {email} deleted"}


@router.post("/grant-free-month")
def grant_free_month(payload: GrantFreeRequest):
    email = norm_email(payload.email)
    rows = supabase.table("users").select("*").eq("email", email).execute().data
    if not rows:
        raise HTTPException(404, "User not found")

    user = rows[0]
    now = datetime.now(timezone.utc)
    base_str = user.get("trial_ends_at") or user.get("expires_at")
    base = now
    if base_str:
        try:
            base = datetime.fromisoformat(str(base_str))
            if base.tzinfo is None:
                base = base.replace(tzinfo=timezone.utc)
        except ValueError:
            base = now
    if base < now:
        base = now

    new_expiry = (base + timedelta(days=30 * payload.months)).isoformat()
    supabase.table("users").update(
        {"trial_ends_at": new_expiry, "sub_status": "active"}
    ).eq("email", email).execute()
    return {"status": "success", "message": f"Granted {payload.months} month(s) to {email}", "new_expiry": new_expiry}


@router.get("/activity")
def get_activity_stream():
    res = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return {"activity": res.data or []}


@router.get("/security-logs")
def get_security_logs():
    res = supabase.table("security_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return {"logs": res.data or []}