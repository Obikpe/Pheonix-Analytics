"""Cohort-specific learner provisioning, track assignment and authentication.

Cohort identities are deliberately separate from public.users: one email may
have a distinct account for each cohort without weakening normal Learnora's
unique-email constraint.
"""
import os
import hashlib
import re
import secrets
from html import escape
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from cryptography.fernet import Fernet
from fastapi import APIRouter, Depends, HTTPException, Request
from jose import jwt
from pydantic import BaseModel, EmailStr, Field

from routers.auth import (
    ALGORITHM,
    FRONTEND_URL,
    JWT_SECRET,
    TOKEN_TTL,
    _generate_raw_token,
    _hash_token,
    _limited,
    _record_failure,
    _clear_failures,
    _get_client_ip,
    _send_email,
    check_password_rules,
    hash_password,
    verify_password,
    supabase,
    get_current_user,
    CurrentUser,
)
from routers.permissions import PermissionContext, require_permission
from services.capacity import ensure_cohort_capacity
from services.audit import audit

router = APIRouter(tags=["Cohort learners"])
ACTIVATION_TTL_MINUTES = 60

# Generate a one-time dummy bcrypt hash at cold start. Unknown usernames still
# execute the same expensive password verification path as known accounts.
# The dummy credential is never associated with a real account.
DUMMY_COHORT_PASSWORD_HASH = hash_password(secrets.token_urlsafe(32))

# Persistent cohort-login throttling: shared across serverless instances.
COHORT_LOGIN_MAX_FAILS = 5
COHORT_LOGIN_WINDOW_SECONDS = 900


def _cohort_rate_hash(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def _cohort_rate_limited(key: str) -> bool:
    result = supabase.rpc("cohort_login_is_limited", {
        "p_key_hash": _cohort_rate_hash(key),
        "p_max_failures": COHORT_LOGIN_MAX_FAILS,
        "p_window_seconds": COHORT_LOGIN_WINDOW_SECONDS,
    }).execute()
    value = result.data
    if isinstance(value, list):
        value = value[0] if value else False
    if isinstance(value, dict):
        value = value.get("cohort_login_is_limited", False)
    return bool(value)


def _cohort_record_failure(key: str) -> None:
    supabase.rpc("cohort_login_record_failure", {
        "p_key_hash": _cohort_rate_hash(key),
        "p_max_failures": COHORT_LOGIN_MAX_FAILS,
        "p_window_seconds": COHORT_LOGIN_WINDOW_SECONDS,
    }).execute()


def _cohort_clear_failures(key: str) -> None:
    supabase.rpc("cohort_login_clear_failure", {
        "p_key_hash": _cohort_rate_hash(key),
    }).execute()



class TrackCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: Optional[str] = Field(default=None, max_length=140)
    description: Optional[str] = Field(default=None, max_length=3000)


class CohortTrackAdd(BaseModel):
    track_id: str


class CohortLearnerCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    date_of_birth: date
    track_id: str


class CohortActivation(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    password: str = Field(min_length=8, max_length=72)
    confirm_password: str = Field(min_length=8, max_length=72)


class CohortLogin(BaseModel):
    username: str = Field(min_length=1, max_length=160)
    password: str = Field(min_length=1, max_length=72)


def _scope(context: PermissionContext, organisation_id: str) -> None:
    if context.is_platform_admin:
        return
    if str(context.organisation_id or "") != str(organisation_id):
        raise HTTPException(403, "Organisation access denied.")


def _slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    if not value:
        raise HTTPException(400, "A valid name is required.")
    return value[:140]


def _cohort_for_org(organisation_id: str, cohort_id: str) -> dict:
    result = (
        supabase.table("cohorts")
        .select("id,organisation_id,name,status,capacity")
        .eq("id", cohort_id)
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Cohort not found.")
    cohort = result.data[0]
    if cohort.get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(409, "This cohort is closed to learner changes.")
    return cohort


def _username(first_name: str, last_name: str) -> str:
    base = f"{_slug(first_name)}.{_slug(last_name)}".strip(".")[:130]
    # Random suffix prevents predictable collisions; a partial unique index
    # still provides the final concurrency-safe guarantee.
    return f"{base}-{secrets.token_hex(3)}"

def _encrypt_date_of_birth(value: date) -> str:
    """Encrypt DOB at the application boundary; never persist it in plaintext."""
    key = os.getenv("COHORT_DOB_ENCRYPTION_KEY", "").strip()
    if not key:
        raise HTTPException(503, "Cohort date-of-birth encryption is not configured.")
    try:
        return Fernet(key.encode("ascii")).encrypt(value.isoformat().encode("ascii")).decode("ascii")
    except (ValueError, UnicodeEncodeError):
        raise HTTPException(503, "Cohort date-of-birth encryption is not configured.")


def _send_activation(*, email: str, first_name: str, username: str, token: str) -> None:
    url = f"{FRONTEND_URL}/cohort-activate#token={token}"
    subject = "Activate your Learnora cohort account"
    text_body = (
        f"Hi {first_name},\n\n"
        "Your organisation has created a Learnora account for your cohort.\n\n"
        f"Username: {username}\n"
        f"Activate your account and choose a password: {url}\n\n"
        f"This one-time link expires in {ACTIVATION_TTL_MINUTES} minutes.\n"
        "Do not share this link.\n\nLearnora"
    )
    safe_first_name = escape(first_name)
    safe_username = escape(username)
    html_body = (
        '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#111827">'
        f"<h1>Activate your Learnora account</h1><p>Hi {safe_first_name},</p>"
        "<p>Your organisation has created a cohort account for you.</p>"
        f"<p><strong>Username:</strong> {safe_username}</p>"
        f'<p><a href="{url}" style="display:inline-block;padding:12px 18px;background:#111827;color:white;text-decoration:none;border-radius:8px">Activate account</a></p>'
        f"<p>This one-time link expires in {ACTIVATION_TTL_MINUTES} minutes. Do not share it.</p>"
        "</div>"
    )
    _send_email(recipient=email, subject=subject, text_body=text_body, html_body=html_body)


@router.post("/api/organisations/{organisation_id}/tracks", status_code=201)
def create_track(
    organisation_id: str,
    body: TrackCreate,
    context: PermissionContext = Depends(require_permission("courses.create")),
):
    _scope(context, organisation_id)
    org = supabase.table("organisations").select("id,is_active").eq("id", organisation_id).limit(1).execute()
    if not org.data:
        raise HTTPException(404, "Organisation not found.")
    if not org.data[0].get("is_active"):
        raise HTTPException(409, "Organisation is inactive.")
    slug = _slug(body.slug or body.name)
    result = supabase.table("learnora_tracks").insert({
        "organisation_id": organisation_id,
        "name": body.name.strip(),
        "slug": slug,
        "description": body.description,
        "created_by": context.user_id,
    }).execute()
    if not result.data:
        raise HTTPException(500, "Track could not be created.")
    return {"success": True, "track": result.data[0]}


@router.get("/api/organisations/{organisation_id}/tracks")
def list_tracks(
    organisation_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _scope(context, organisation_id)
    selected = "id,organisation_id,name,slug,description,status,created_at"
    organisation_tracks = (
        supabase.table("learnora_tracks")
        .select(selected)
        .eq("organisation_id", organisation_id)
        .eq("status", "active")
        .execute()
    ).data or []
    global_tracks = (
        supabase.table("learnora_tracks")
        .select(selected)
        .is_("organisation_id", "null")
        .eq("status", "active")
        .execute()
    ).data or []
    tracks = sorted(
        [*organisation_tracks, *global_tracks],
        key=lambda item: (str(item.get("name") or "").casefold(), str(item.get("id") or "")),
    )
    return {"success": True, "tracks": tracks}


@router.post("/api/organisations/{organisation_id}/cohorts/{cohort_id}/tracks", status_code=201)
def add_track_to_cohort(
    organisation_id: str,
    cohort_id: str,
    body: CohortTrackAdd,
    context: PermissionContext = Depends(require_permission("courses.assign")),
):
    _scope(context, organisation_id)
    cohort = _cohort_for_org(organisation_id, cohort_id)
    track = (
        supabase.table("learnora_tracks")
        .select("id,organisation_id,status")
        .eq("id", body.track_id)
        .limit(1)
        .execute()
    )
    if not track.data or track.data[0].get("status") != "active":
        raise HTTPException(404, "Active track not found.")
    track_org = track.data[0].get("organisation_id")
    if track_org and str(track_org) != str(organisation_id):
        raise HTTPException(403, "Track belongs to another organisation.")
    existing_members = (
        supabase.table("cohort_members")
        .select("id")
        .eq("cohort_id", cohort_id)
        .eq("track_id", body.track_id)
        .limit(1)
        .execute()
    )
    if existing_members.data:
        raise HTTPException(409, "This track is already assigned to learners in the cohort and cannot be removed or replaced here.")
    result = supabase.table("cohort_track_options").upsert({
        "cohort_id": cohort_id,
        "track_id": body.track_id,
        "status": "active",
        "created_by": context.user_id,
    }, on_conflict="cohort_id,track_id").execute()
    if not result.data:
        raise HTTPException(500, "Track could not be added to the cohort.")
    return {"success": True, "cohort_track": result.data[0]}


@router.get("/api/organisations/{organisation_id}/cohorts/{cohort_id}/tracks")
def list_cohort_tracks(
    organisation_id: str,
    cohort_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    _scope(context, organisation_id)
    _cohort_for_org(organisation_id, cohort_id)
    options = (
        supabase.table("cohort_track_options")
        .select("id,cohort_id,track_id,status,created_at")
        .eq("cohort_id", cohort_id)
        .eq("status", "active")
        .execute()
    ).data or []
    ids = [row["track_id"] for row in options]
    tracks = []
    if ids:
        tracks = (
            supabase.table("learnora_tracks")
            .select("id,name,slug,description,status")
            .in_("id", ids)
            .order("name")
            .execute()
        ).data or []
    return {"success": True, "tracks": tracks}


@router.get("/api/organisations/{organisation_id}/cohorts/{cohort_id}/learners")
def list_cohort_learners(
    organisation_id: str,
    cohort_id: str,
    context: PermissionContext = Depends(require_permission("organisations.view")),
):
    """Return a safe roster for the organisation UI; never expose hashes or activation tokens."""
    _scope(context, organisation_id)
    _cohort_for_org(organisation_id, cohort_id)
    accounts = (
        supabase.table("cohort_accounts")
        .select("id,cohort_id,organisation_id,first_name,last_name,email,username,status,activated_at,last_login_at,created_at")
        .eq("organisation_id", organisation_id)
        .eq("cohort_id", cohort_id)
        .order("created_at")
        .execute()
    ).data or []
    account_ids = [str(row["id"]) for row in accounts]
    memberships = (
        supabase.table("cohort_members")
        .select("id,cohort_account_id,track_id,status,joined_at")
        .eq("cohort_id", cohort_id)
        .in_("cohort_account_id", account_ids)
        .execute()
    ).data or [] if account_ids else []
    membership_by_account = {str(row["cohort_account_id"]): row for row in memberships if row.get("cohort_account_id")}
    track_ids = list({str(row["track_id"]) for row in memberships if row.get("track_id")})
    tracks = (
        supabase.table("learnora_tracks")
        .select("id,name,slug")
        .in_("id", track_ids)
        .execute()
    ).data or [] if track_ids else []
    track_by_id = {str(row["id"]): row for row in tracks}
    roster = []
    for account in accounts:
        membership = membership_by_account.get(str(account["id"]))
        track_id = membership.get("track_id") if membership else None
        roster.append({
            **account,
            "member_id": membership.get("id") if membership else None,
            "membership_status": membership.get("status") if membership else None,
            "joined_at": membership.get("joined_at") if membership else None,
            "track_id": track_id,
            "track": track_by_id.get(str(track_id)) if track_id else None,
        })
    return {"success": True, "learners": roster}


@router.post("/api/organisations/{organisation_id}/cohorts/{cohort_id}/learners", status_code=201)
def create_cohort_learner(
    organisation_id: str,
    cohort_id: str,
    body: CohortLearnerCreate,
    request: Request,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    _scope(context, organisation_id)
    org = supabase.table("organisations").select("id,is_active").eq("id", organisation_id).limit(1).execute()
    if not org.data:
        raise HTTPException(404, "Organisation not found.")
    if not org.data[0].get("is_active"):
        raise HTTPException(409, "Organisation is inactive.")
    cohort = _cohort_for_org(organisation_id, cohort_id)
    if body.date_of_birth >= date.today():
        raise HTTPException(400, "Date of birth must be in the past.")
    encrypted_dob = _encrypt_date_of_birth(body.date_of_birth)
    email = str(body.email).strip().lower()
    track_option = (
        supabase.table("cohort_track_options")
        .select("id,status")
        .eq("cohort_id", cohort_id)
        .eq("track_id", body.track_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not track_option.data:
        raise HTTPException(400, "Choose a track already enabled for this cohort.")

    now = datetime.now(timezone.utc)
    existing_result = (
        supabase.table("cohort_accounts")
        .select("*")
        .eq("cohort_id", cohort_id)
        .eq("email", email)
        .limit(1)
        .execute()
    )
    existing = existing_result.data[0] if existing_result.data else None
    membership_result = (
        supabase.table("cohort_members")
        .select("id,track_id,status,cohort_account_id")
        .eq("cohort_id", cohort_id)
        .eq("cohort_account_id", existing["id"])
        .limit(1)
        .execute()
    ) if existing else None

    if existing and existing.get("status") != "inactive":
        raise HTTPException(409, "An account for this email already exists in this cohort.")
    if existing and membership_result and membership_result.data:
        previous_track = membership_result.data[0].get("track_id")
        if previous_track and str(previous_track) != str(body.track_id):
            raise HTTPException(409, "This learner's track is fixed for this cohort. Create a new cohort to assign a different track.")
        if membership_result.data[0].get("status") != "active":
            ensure_cohort_capacity(cohort_id, 1)
    elif not existing:
        ensure_cohort_capacity(cohort_id, 1)

    raw_token = _generate_raw_token()
    username = _username(body.first_name, body.last_name)
    token_hash = _hash_token(raw_token)
    expires = (now + timedelta(minutes=ACTIVATION_TTL_MINUTES)).isoformat()
    payload = {
        "cohort_id": cohort_id,
        "organisation_id": organisation_id,
        "first_name": body.first_name.strip(),
        "last_name": body.last_name.strip(),
        "email": email,
        "username": username,
        "date_of_birth": None,
        "date_of_birth_encrypted": encrypted_dob,
        "password_hash": None,
        "status": "pending_activation",
        "activation_token_hash": token_hash,
        "activation_expires_at": expires,
        "activated_at": None,
        "updated_at": now.isoformat(),
    }
    if existing:
        saved = (
            supabase.table("cohort_accounts")
            .update(payload)
            .eq("id", existing["id"])
            .eq("status", "inactive")
            .execute()
        )
        if not saved.data:
            raise HTTPException(409, "The learner account changed while it was being reactivated.")
        account = saved.data[0]
    else:
        try:
            saved = supabase.table("cohort_accounts").insert(payload).execute()
        except Exception:
            raise HTTPException(409, "The account could not be created; the email or username may already be in use.")
        if not saved.data:
            raise HTTPException(500, "Learner account could not be created.")
        account = saved.data[0]

    membership = membership_result.data[0] if membership_result and membership_result.data else None
    if membership:
        membership_update = supabase.table("cohort_members").update({
            "status": "active",
            "joined_at": now.isoformat(),
            "track_id": membership.get("track_id") or body.track_id,
        }).eq("id", membership["id"]).execute()
        if not membership_update.data:
            raise HTTPException(500, "Learner membership could not be reactivated.")
    else:
        membership_insert = supabase.table("cohort_members").insert({
            "cohort_id": cohort_id,
            "user_id": None,
            "cohort_account_id": account["id"],
            "track_id": body.track_id,
            "joined_at": now.isoformat(),
            "status": "active",
        }).execute()
        if not membership_insert.data:
            raise HTTPException(500, "Learner membership could not be created.")

    try:
        _send_activation(email=email, first_name=body.first_name.strip(), username=username, token=raw_token)
    except Exception as exc:
        # Keep only the hashed token in storage. The org can request a fresh
        # activation link; do not expose raw credentials in the API response.
        print(f"Cohort activation email failed: {type(exc).__name__}")
        raise HTTPException(503, "Learner was created but activation email could not be sent. Configure email delivery and retry activation.")

    audit(
        actor_user_id=context.user_id,
        action="cohort_learner_created" if not existing else "cohort_learner_reactivated",
        resource_type="cohort_account",
        resource_id=account["id"],
        organisation_id=organisation_id,
        metadata={"cohort_id": cohort_id, "track_id": body.track_id},
    )
    return {
        "success": True,
        "learner": {
            "id": account["id"],
            "cohort_id": cohort_id,
            "organisation_id": organisation_id,
            "first_name": account["first_name"],
            "last_name": account["last_name"],
            "email": account["email"],
            "username": account["username"],
            "track_id": body.track_id,
            "status": "pending_activation",
            "activation_expires_at": expires,
        },
    }


@router.post("/api/organisations/{organisation_id}/cohorts/{cohort_id}/learners/{account_id}/resend-activation")
def resend_cohort_activation(
    organisation_id: str,
    cohort_id: str,
    account_id: str,
    context: PermissionContext = Depends(require_permission("organisations.members")),
):
    _scope(context, organisation_id)
    _cohort_for_org(organisation_id, cohort_id)
    result = (
        supabase.table("cohort_accounts")
        .select("id,cohort_id,organisation_id,first_name,email,username,status")
        .eq("id", account_id)
        .eq("cohort_id", cohort_id)
        .eq("organisation_id", organisation_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Cohort learner account not found.")
    account = result.data[0]
    if account.get("status") != "pending_activation":
        raise HTTPException(409, "Only accounts awaiting activation can receive a new activation link.")

    raw_token = _generate_raw_token()
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(minutes=ACTIVATION_TTL_MINUTES)).isoformat()
    updated = (
        supabase.table("cohort_accounts")
        .update({
            "activation_token_hash": _hash_token(raw_token),
            "activation_expires_at": expires,
            "updated_at": now.isoformat(),
        })
        .eq("id", account_id)
        .eq("status", "pending_activation")
        .execute()
    )
    if not updated.data:
        raise HTTPException(409, "The account changed while a new activation link was being issued.")
    try:
        _send_activation(
            email=account["email"],
            first_name=account["first_name"],
            username=account["username"],
            token=raw_token,
        )
    except Exception as exc:
        print(f"Cohort activation resend failed: {type(exc).__name__}")
        raise HTTPException(503, "Activation email could not be sent. Check email delivery settings and retry.")
    audit(
        actor_user_id=context.user_id,
        action="cohort_activation_resent",
        resource_type="cohort_account",
        resource_id=account_id,
        organisation_id=organisation_id,
        metadata={"cohort_id": cohort_id},
    )
    return {"success": True, "message": "A fresh activation link has been sent.", "activation_expires_at": expires}


@router.post("/api/cohort-auth/activate")
def activate_cohort_account(body: CohortActivation):
    if body.password != body.confirm_password:
        raise HTTPException(400, "Password confirmation does not match.")
    check_password_rules(body.password)
    now = datetime.now(timezone.utc)
    result = (
        supabase.table("cohort_accounts")
        .select("id,cohort_id,status,activation_expires_at")
        .eq("activation_token_hash", _hash_token(body.token))
        .eq("status", "pending_activation")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(400, "Activation link is invalid, expired, or already used.")
    account = result.data[0]
    expiry = account.get("activation_expires_at")
    try:
        expires_at = datetime.fromisoformat(str(expiry).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        raise HTTPException(400, "Activation link is invalid or expired.")
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= now:
        raise HTTPException(400, "Activation link is invalid or expired.")
    cohort = supabase.table("cohorts").select("status").eq("id", account["cohort_id"]).limit(1).execute()
    if not cohort.data or cohort.data[0].get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(409, "This cohort is closed and the account cannot be activated.")
    updated = supabase.table("cohort_accounts").update({
        "password_hash": hash_password(body.password),
        "status": "active",
        "activation_token_hash": None,
        "activation_expires_at": None,
        "activated_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }).eq("id", account["id"]).eq("status", "pending_activation").eq("activation_token_hash", _hash_token(body.token)).execute()
    if not updated.data:
        raise HTTPException(409, "Activation link has already been used.")
    return {"success": True, "message": "Account activated. Sign in with your username and password."}


@router.post("/api/cohort-auth/login")
def login_cohort_account(body: CohortLogin, request: Request):
    username = body.username.strip().lower()
    client_ip = _get_client_ip(request) or "unknown"
    rate_key = f"cohort:{username}:{client_ip}"
    ip_rate_key = f"cohort-ip:{client_ip}"

    # A client-wide bucket prevents username rotation from bypassing the
    # per-account bucket. Both checks run before any account lookup.
    if _cohort_rate_limited(rate_key) or _cohort_rate_limited(ip_rate_key):
        raise HTTPException(429, "Too many failed login attempts. Try again later.")

    if not re.fullmatch(r"[a-z0-9.-]{2,160}", username):
        verify_password(body.password, DUMMY_COHORT_PASSWORD_HASH)
        _cohort_record_failure(rate_key)
        _cohort_record_failure(ip_rate_key)
        raise HTTPException(401, "Invalid username or password.")

    result = (
        supabase.table("cohort_accounts")
        .select("id,cohort_id,organisation_id,email,username,password_hash,status")
        .eq("username", username)
        .limit(1)
        .execute()
    )
    account = result.data[0] if result.data else None
    # Do not disclose account existence through a skipped password hash check.
    valid, _ = verify_password(
        body.password,
        (account.get("password_hash") or "") if account else DUMMY_COHORT_PASSWORD_HASH,
    )
    if not account or not valid:
        _cohort_record_failure(rate_key)
        _cohort_record_failure(ip_rate_key)
        raise HTTPException(401, "Invalid username or password.")
    if account.get("status") != "active":
        _cohort_record_failure(rate_key)
        _cohort_record_failure(ip_rate_key)
        raise HTTPException(403, "This cohort account is not active. Activate it or contact your organisation.")
    cohort = supabase.table("cohorts").select("status").eq("id", account["cohort_id"]).limit(1).execute()
    if not cohort.data or cohort.data[0].get("status") not in {"draft", "upcoming", "active"}:
        raise HTTPException(403, "This cohort has ended and the account is no longer available.")
    # Clear only this account's bucket. The client-wide bucket intentionally
    # remains so successful login to another account cannot reset spray limits.
    _cohort_clear_failures(rate_key)
    now = datetime.now(timezone.utc).isoformat()
    supabase.table("cohort_accounts").update({"last_login_at": now}).eq("id", account["id"]).execute()
    token_now = int(datetime.now(timezone.utc).timestamp())
    token = jwt.encode({
        "sub": str(account["id"]),
        "cohort_account_id": str(account["id"]),
        "email": account["email"],
        "username": account["username"],
        "role": "cohort_learner",
        "account_type": "cohort",
        "iat": token_now,
        "exp": token_now + TOKEN_TTL,
    }, JWT_SECRET, algorithm=ALGORITHM)
    return {
        "success": True,
        "access_token": token,
        "token_type": "bearer",
        "account": {
            "id": account["id"],
            "username": account["username"],
            "email": account["email"],
            "cohort_id": account["cohort_id"],
            "organisation_id": account["organisation_id"],
            "cohort_status": cohort.data[0]["status"],
        },
    }


@router.get("/api/cohort-auth/me")
def get_cohort_account_me(user: CurrentUser = Depends(get_current_user)):
    if user.account_type != "cohort":
        raise HTTPException(403, "Cohort learner account required.")
    return {
        "success": True,
        "account": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "organisation_id": user.organisation_id,
            "cohort_id": user.cohort_id,
            "track_id": user.track_id,
            "role": user.role,
            "course_access": user.course_access,
        },
    }
