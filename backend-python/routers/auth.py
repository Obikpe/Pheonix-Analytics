"""
Learnora authentication and user management.

Account architecture
--------------------
Learners are stored in public.users:
    - normal
    - witstart

Administrators are stored in public.admins:
    - super_admin
    - staff_admin
    - witstart_admin

Authentication is JWT based, but the JWT is never treated as the final
authority for account state. The database is checked on every authenticated
request.

Learner access states
---------------------
pending
    Email/account has not been verified yet.

trialing
    User has an active server-side free trial.

active
    User has an active paid membership.

expired
    Trial or paid membership has expired.

Email verification
------------------
Registration creates a pending account and sends a verification email.

The 7-day trial does NOT begin at registration.

The 7-day trial begins only after successful email verification.

Password reset
--------------
Forgot-password requests generate short-lived, single-use reset tokens.

The API intentionally returns a generic response so attackers cannot use
the endpoint to discover whether an email address belongs to a Learnora
account.

Email delivery
--------------
Email is sent through the Resend HTTP API.

Required environment variables:

    RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
    RESEND_FROM_EMAIL=onboarding@resend.dev
    RESEND_FROM_NAME=Learnora Me

For production with a custom domain, replace RESEND_FROM_EMAIL with an
email address belonging to a domain authenticated in Resend.
"""

import hashlib
import hmac
import os
import re
import secrets
import time

from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from supabase import Client, create_client


router = APIRouter()
bearer = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# ENVIRONMENT
# ---------------------------------------------------------------------------

APP_ENV = os.getenv(
    "APP_ENV",
    "production",
).strip().lower()

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "",
).strip()

SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    or os.getenv("SUPABASE_SECRET_KEY", "").strip()
)

if not SUPABASE_URL or not SUPABASE_KEY:
    if APP_ENV != "development":
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
        )

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
)


# ---------------------------------------------------------------------------
# APPLICATION URLS
# ---------------------------------------------------------------------------

FRONTEND_URL = (
    os.getenv(
        "FRONTEND_URL",
        "https://learnora-me.vercel.app",
    )
    .strip()
    .rstrip("/")
)

EMAIL_VERIFICATION_PATH = (
    os.getenv(
        "EMAIL_VERIFICATION_PATH",
        "/verify-email",
    )
    .strip()
)

PASSWORD_RESET_PATH = (
    os.getenv(
        "PASSWORD_RESET_PATH",
        "/reset-password",
    )
    .strip()
)


# ---------------------------------------------------------------------------
# EMAIL / RESEND
# ---------------------------------------------------------------------------

RESEND_API_URL = (
    "https://api.resend.com/emails"
)

RESEND_API_KEY = (
    os.getenv(
        "RESEND_API_KEY",
        "",
    )
    .strip()
)

RESEND_FROM_EMAIL = (
    os.getenv(
        "RESEND_FROM_EMAIL",
        "",
    )
    .strip()
)

RESEND_FROM_NAME = (
    os.getenv(
        "RESEND_FROM_NAME",
        "Learnora Me",
    )
    .strip()
)


EMAIL_VERIFICATION_TTL_MINUTES = int(
    os.getenv(
        "EMAIL_VERIFICATION_TTL_MINUTES",
        "60",
    )
)

PASSWORD_RESET_TTL_MINUTES = int(
    os.getenv(
        "PASSWORD_RESET_TTL_MINUTES",
        "30",
    )
)

TRIAL_DAYS = int(
    os.getenv(
        "TRIAL_DAYS",
        "7",
    )
)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"

TOKEN_TTL = int(
    os.getenv(
        "TOKEN_TTL_SECONDS",
        "86400",
    )
)

JWT_SECRET = (
    os.getenv(
        "JWT_SECRET",
        "",
    )
    .strip()
)

if len(JWT_SECRET) < 32:

    if APP_ENV != "development":

        raise RuntimeError(
            "JWT_SECRET must be set to a random string of 32+ characters."
        )

    JWT_SECRET = secrets.token_hex(32)


# ---------------------------------------------------------------------------
# ROLES
# ---------------------------------------------------------------------------

LEARNER_ROLES = {
    "normal",
    "witstart",
    "organisation_prospect",
}

ADMIN_ROLES = {
    "super_admin",
    "staff_admin",
    "witstart_admin",
}

ACTIVE_STATUSES = {
    "trialing",
    "active",
}


# ---------------------------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------------------------

EMAIL_RE = re.compile(
    r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
)


def norm_email(
    email: str,
) -> str:

    normalized = (
        email or ""
    ).lower().strip()

    if (
        not EMAIL_RE.match(normalized)
        or len(normalized) > 254
    ):

        raise HTTPException(
            status_code=400,
            detail="Invalid email format",
        )

    return normalized


def check_password_rules(
    password: str,
):

    if len(password) < 8:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least "
                "8 characters long"
            ),
        )

    if len(
        password.encode("utf-8")
    ) > 72:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password is too long "
                "(72 bytes maximum)"
            ),
        )


# ---------------------------------------------------------------------------
# PASSWORDS
# ---------------------------------------------------------------------------

def hash_password(
    password: str,
) -> str:

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(12),
    ).decode("utf-8")


def verify_password(
    password: str,
    stored: str,
) -> tuple[bool, bool]:

    """
    Returns:

        (password_is_valid, needs_rehash)

    bcrypt:
        valid, False

    Legacy SHA256:
        valid, True
    """

    if not stored:
        return False, False

    if stored.startswith("$2"):

        try:

            return (
                bcrypt.checkpw(
                    password.encode("utf-8"),
                    stored.encode("utf-8"),
                ),
                False,
            )

        except (
            ValueError,
            TypeError,
        ):

            return False, False

    try:

        hashed_password = hashlib.sha256(
            password.encode("utf-8")
        ).hexdigest()

        ok = hmac.compare_digest(
            hashed_password,
            stored,
        )

        return ok, ok

    except Exception:

        return False, False


# ---------------------------------------------------------------------------
# TOKEN HELPERS
# ---------------------------------------------------------------------------

def _generate_raw_token() -> str:

    """
    Generates a cryptographically secure random token.

    The raw token is sent to the user by email.

    Only a SHA-256 hash is stored in the database.
    """

    return secrets.token_urlsafe(48)


def _hash_token(
    token: str,
) -> str:

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# ---------------------------------------------------------------------------
# LOGIN RATE LIMITING
# ---------------------------------------------------------------------------

_FAILS: dict[str, deque] = defaultdict(
    deque
)

MAX_FAILS = 5
WINDOW = 900


def _limited(
    key: str,
) -> bool:

    queue = _FAILS[key]

    cutoff = (
        time.time() - WINDOW
    )

    while (
        queue
        and queue[0] < cutoff
    ):

        queue.popleft()

    if not queue:

        _FAILS.pop(
            key,
            None,
        )

        return False

    return len(queue) >= MAX_FAILS


def _record_failure(
    key: str,
):

    _FAILS[key].append(
        time.time()
    )


def _clear_failures(
    key: str,
):

    _FAILS.pop(
        key,
        None,
    )


# ---------------------------------------------------------------------------
# DATE HELPERS
# ---------------------------------------------------------------------------

def _parse_datetime(
    value,
) -> Optional[datetime]:

    """
    Converts a Supabase/PostgreSQL timestamp into an aware datetime.
    """

    if not value:
        return None

    if isinstance(
        value,
        datetime,
    ):

        dt = value

    else:

        try:

            text = str(
                value
            ).strip()

            if text.endswith("Z"):

                text = (
                    text[:-1]
                    + "+00:00"
                )

            dt = datetime.fromisoformat(
                text
            )

        except (
            ValueError,
            TypeError,
        ):

            return None

    if dt.tzinfo is None:

        dt = dt.replace(
            tzinfo=timezone.utc
        )

    return dt.astimezone(
        timezone.utc
    )


def _iso(
    value,
) -> Optional[str]:

    dt = _parse_datetime(
        value
    )

    if not dt:
        return None

    return dt.isoformat()


# ---------------------------------------------------------------------------
# EMAIL CONFIGURATION
# ---------------------------------------------------------------------------

def _email_configured() -> bool:

    return bool(
        RESEND_API_KEY
        and RESEND_FROM_EMAIL
    )


def _send_email(
    *,
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str,
):
    """
    Sends an email using the Resend HTTP API.

    Required:

        RESEND_API_KEY
        RESEND_FROM_EMAIL

    Optional:

        RESEND_FROM_NAME
    """

    if not _email_configured():

        if APP_ENV == "development":

            print(
                "EMAIL DEV MODE"
            )

            print(
                f"To: {recipient}"
            )

            print(
                f"Subject: {subject}"
            )

            print(
                text_body
            )

            return

        raise RuntimeError(
            "Resend email service is not configured."
        )

    from_value = (
        f"{RESEND_FROM_NAME} <{RESEND_FROM_EMAIL}>"
        if RESEND_FROM_NAME
        else RESEND_FROM_EMAIL
    )

    payload = {
        "from": from_value,
        "to": [recipient],
        "subject": subject,
        "text": text_body,
        "html": html_body,
    }

    headers = {
        "Authorization": (
            f"Bearer {RESEND_API_KEY}"
        ),
        "Content-Type": "application/json",
    }

    try:

        with httpx.Client(
            timeout=30.0
        ) as client:

            response = client.post(
                RESEND_API_URL,
                headers=headers,
                json=payload,
            )

        if not response.is_success:

            print(
                "Resend email API failed: "
                f"HTTP {response.status_code}"
            )

            try:
                print(
                    f"Resend response: {response.text}"
                )

            except Exception:
                pass

            raise RuntimeError(
                "Unable to send email."
            )

    except httpx.RequestError as exc:

        print(
            f"Resend connection failed: {exc}"
        )

        raise RuntimeError(
            "Unable to connect to email service."
        )

    except Exception as exc:

        if isinstance(
            exc,
            RuntimeError,
        ):
            raise

        print(
            f"Email sending failed: {exc}"
        )

        raise RuntimeError(
            "Unable to send email."
        )


# ---------------------------------------------------------------------------
# VERIFICATION EMAIL
# ---------------------------------------------------------------------------

def _build_verification_url(
    token: str,
) -> str:

    return (
        f"{FRONTEND_URL}"
        f"{EMAIL_VERIFICATION_PATH}"
        f"?token={token}"
    )


def _send_verification_email(
    *,
    email: str,
    name: Optional[str],
    token: str,
):

    verification_url = (
        _build_verification_url(
            token
        )
    )

    display_name = (
        name
        or "there"
    )

    subject = (
        "Verify your Learnora Me account"
    )

    text_body = f"""
Hi {display_name},

Welcome to Learnora Me.

Please verify your email address by opening the link below:

{verification_url}

This verification link expires in {EMAIL_VERIFICATION_TTL_MINUTES} minutes.

Once your email is verified, your 7-day free trial will begin.

If you did not create a Learnora Me account, you can ignore this email.

Learnora Me
""".strip()

    html_body = f"""
<!doctype html>
<html>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:40px auto;padding:32px;background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;">

    <h1 style="margin:0 0 16px;color:#111827;">
      Welcome to Learnora Me
    </h1>

    <p style="line-height:1.7;">
      Hi {display_name},
    </p>

    <p style="line-height:1.7;">
      Please verify your email address to activate your Learnora Me account.
    </p>

    <p style="margin:28px 0;">
      <a
        href="{verification_url}"
        style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;"
      >
        Verify Email Address
      </a>
    </p>

    <p style="font-size:13px;color:#64748b;line-height:1.6;">
      This link expires in {EMAIL_VERIFICATION_TTL_MINUTES} minutes.
      Your 7-day free trial begins after successful verification.
    </p>

    <p style="font-size:13px;color:#94a3b8;line-height:1.6;">
      If you did not create a Learnora Me account, you can safely ignore this email.
    </p>

  </div>
</body>
</html>
""".strip()

    _send_email(
        recipient=email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )


# ---------------------------------------------------------------------------
# PASSWORD RESET EMAIL
# ---------------------------------------------------------------------------

def _build_password_reset_url(
    token: str,
) -> str:

    return (
        f"{FRONTEND_URL}"
        f"{PASSWORD_RESET_PATH}"
        f"?token={token}"
    )


def _send_password_reset_email(
    *,
    email: str,
    name: Optional[str],
    token: str,
):

    reset_url = (
        _build_password_reset_url(
            token
        )
    )

    display_name = (
        name
        or "there"
    )

    subject = (
        "Reset your Learnora Me password"
    )

    text_body = f"""
Hi {display_name},

We received a request to reset your Learnora Me password.

Use the link below to choose a new password:

{reset_url}

This password reset link expires in {PASSWORD_RESET_TTL_MINUTES} minutes.

If you did not request a password reset, you can safely ignore this email.

Learnora Me
""".strip()

    html_body = f"""
<!doctype html>
<html>
<body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:40px auto;padding:32px;background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;">

    <h1 style="margin:0 0 16px;color:#111827;">
      Reset your password
    </h1>

    <p style="line-height:1.7;">
      Hi {display_name},
    </p>

    <p style="line-height:1.7;">
      We received a request to reset your Learnora Me password.
    </p>

    <p style="margin:28px 0;">
      <a
        href="{reset_url}"
        style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:bold;"
      >
        Reset Password
      </a>
    </p>

    <p style="font-size:13px;color:#64748b;line-height:1.6;">
      This link expires in {PASSWORD_RESET_TTL_MINUTES} minutes.
    </p>

    <p style="font-size:13px;color:#94a3b8;line-height:1.6;">
      If you did not request this, you can safely ignore this email.
    </p>

  </div>
</body>
</html>
""".strip()

    _send_email(
        recipient=email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def make_token(
    email: str,
    role: str,
    account_type: str,
) -> str:

    now = int(
        time.time()
    )

    return jwt.encode(
        {
            "sub": email,
            "email": email,
            "role": role,
            "account_type": account_type,
            "iat": now,
            "exp": (
                now
                + TOKEN_TTL
            ),
        },
        JWT_SECRET,
        algorithm=ALGORITHM,
    )


# ---------------------------------------------------------------------------
# ACCOUNT PERMISSIONS
# ---------------------------------------------------------------------------

def allowed_for(
    role: str,
    account_type: str,
) -> dict:

    if account_type == "admin":

        if role == "super_admin":

            return {
                "courses": 85,
                "tracks": ["all"],
                "is_admin": True,
                "admin_role": role,
                "redirect_view": (
                    "/dashboard/admin/super_admin"
                ),
                "permissions": [
                    "manage_all_learners",
                    "manage_admins",
                    "manage_witstart",
                    "grant_free_month",
                    "view_activity",
                    "view_traffic",
                    "view_security_logs",
                ],
            }

        if role == "staff_admin":

            return {
                "courses": 85,
                "tracks": ["Learnora"],
                "is_admin": True,
                "admin_role": role,
                "redirect_view": (
                    "/dashboard/admin/staff_admin"
                ),
                "permissions": [
                    "manage_normal_learners",
                    "view_learnora_activity",
                ],
            }

        if role == "witstart_admin":

            return {
                "courses": 12,
                "tracks": [
                    "WitStart Private"
                ],
                "is_admin": True,
                "admin_role": role,
                "redirect_view": (
                    "/dashboard/admin/witstart_admin"
                ),
                "permissions": [
                    "manage_witstart_learners",
                    "view_witstart_activity",
                ],
            }

    if role == "witstart":

        return {
            "courses": 12,
            "tracks": [
                "Witstart Private"
            ],
            "is_admin": False,
            "redirect_view": (
                "/dashboard/witstart"
            ),
        }

    return {
        "courses": 85,
        "tracks": ["all"],
        "is_admin": False,
        "redirect_view": (
            "/dashboard/general"
        ),
    }


# ---------------------------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------------------------

class CurrentUser(BaseModel):

    id: Optional[str] = None
    name: Optional[str] = None
    email: str
    role: str
    sub_status: str
    account_type: str
    is_paid: bool = False

    expires_at: Optional[str] = None
    trial_ends_at: Optional[str] = None

    access_state: str = "expired"
    course_access: bool = False
    organisation_id: Optional[str] = None
    organisation_role: Optional[str] = None


# ---------------------------------------------------------------------------
# AUDIT LOGGING
# ---------------------------------------------------------------------------

def _get_client_ip(
    request: Optional[Request],
) -> Optional[str]:

    if not request:
        return None

    forwarded = request.headers.get(
        "x-forwarded-for"
    )

    if forwarded:

        return (
            forwarded
            .split(",")[0]
            .strip()
        )

    return (
        request.client.host
        if request.client
        else None
    )


def log_audit_event(
    *,
    action: str,
    email: Optional[str] = None,
    account_type: Optional[str] = None,
    role: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[dict] = None,
):

    try:

        row = {
            "action": action,
            "email": email,
            "account_type": account_type,
            "role": role,
            "ip": _get_client_ip(
                request
            ),
            "created_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

        if metadata is not None:
            row["metadata"] = metadata

        supabase.table(
            "audit_logs"
        ).insert(row).execute()

    except Exception as exc:

        print(
            f"Audit logging failed: {exc}"
        )


def log_security_event(
    *,
    action: str,
    email: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[dict] = None,
):
    """
    Record a security event in public.security_logs.

    The security_logs table contains:
        id
        event_type
        ip_address
        details
        created_at
        action
        email
        ip
        metadata

    Security logging must never interrupt the authentication flow.
    """

    try:
        client_ip = _get_client_ip(request)

        row = {
            "event_type": action,
            "ip_address": client_ip,
            "action": action,
            "email": email,
            "ip": client_ip,
            "created_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

        if metadata is not None:
            row["metadata"] = metadata

        supabase.table(
            "security_logs"
        ).insert(row).execute()

    except Exception as exc:
        print(
            f"Security logging failed: {exc}"
        )

# ---------------------------------------------------------------------------
# FIND ACCOUNT
# ---------------------------------------------------------------------------

def _find_admin(
    email: str,
):

    response = (
        supabase
        .table("admins")
        .select(
            "id, email, name, password_hash, role, "
            "is_active, last_login_at"
        )
        .ilike(
            "email",
            email,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


def _find_user(
    email: str,
):

    response = (
        supabase
        .table("users")
        .select(
            "id, name, email, password_hash, role, "
            "sub_status, is_paid, subscription_tier, "
            "expires_at, trial_ends_at, email_verified_at"
        )
        .ilike(
            "email",
            email,
        )
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return (
        rows[0]
        if rows
        else None
    )


# ---------------------------------------------------------------------------
# LEARNER ENTITLEMENT
# ---------------------------------------------------------------------------

def _resolve_learner_access(
    user: dict,
) -> dict:

    now = datetime.now(
        timezone.utc
    )

    sub_status = (
        user.get("sub_status")
        or "pending"
    )

    is_paid = bool(
        user.get("is_paid")
    )

    trial_ends = _parse_datetime(
        user.get(
            "trial_ends_at"
        )
    )

    expires_at = _parse_datetime(
        user.get(
            "expires_at"
        )
    )

    # ---------------------------------------------------------------
    # PAID MEMBERSHIP
    # ---------------------------------------------------------------

    if is_paid:

        if (
            expires_at
            and expires_at <= now
        ):

            try:

                supabase.table(
                    "users"
                ).update(
                    {
                        "is_paid": False,
                        "subscription_tier": "free",
                        "sub_status": "expired",
                    }
                ).eq(
                    "id",
                    user["id"],
                ).execute()

            except Exception as exc:

                print(
                    "Failed to expire "
                    f"paid membership: {exc}"
                )

            return {
                "sub_status": "expired",
                "is_paid": False,
                "access_state": "expired",
                "course_access": False,
                "trial_ends_at": _iso(
                    trial_ends
                ),
                "expires_at": _iso(
                    expires_at
                ),
            }

        return {
            "sub_status": "active",
            "is_paid": True,
            "access_state": "pro",
            "course_access": True,
            "trial_ends_at": _iso(
                trial_ends
            ),
            "expires_at": _iso(
                expires_at
            ),
        }

    # ---------------------------------------------------------------
    # FREE TRIAL
    # ---------------------------------------------------------------

    if sub_status == "trialing":

        if (
            trial_ends
            and trial_ends > now
        ):

            return {
                "sub_status": "trialing",
                "is_paid": False,
                "access_state": "trial",
                "course_access": True,
                "trial_ends_at": _iso(
                    trial_ends
                ),
                "expires_at": _iso(
                    expires_at
                ),
            }

        try:

            supabase.table(
                "users"
            ).update(
                {
                    "is_paid": False,
                    "subscription_tier": "free",
                    "sub_status": "expired",
                }
            ).eq(
                "id",
                user["id"],
            ).execute()

        except Exception as exc:

            print(
                f"Failed to expire trial: {exc}"
            )

        return {
            "sub_status": "expired",
            "is_paid": False,
            "access_state": "expired",
            "course_access": False,
            "trial_ends_at": _iso(
                trial_ends
            ),
            "expires_at": _iso(
                expires_at
            ),
        }

    # ---------------------------------------------------------------
    # PENDING / EXPIRED / FREE
    # ---------------------------------------------------------------

    return {
        "sub_status": sub_status,
        "is_paid": False,
        "access_state": (
            "pending"
            if sub_status == "pending"
            else "expired"
        ),
        "course_access": False,
        "trial_ends_at": _iso(
            trial_ends
        ),
        "expires_at": _iso(
            expires_at
        ),
    }


# ---------------------------------------------------------------------------
# AUTH DEPENDENCY
# ---------------------------------------------------------------------------

def get_current_user(
    creds: Optional[
        HTTPAuthorizationCredentials
    ] = Depends(bearer),
) -> CurrentUser:

    if not creds:

        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    try:

        payload = jwt.decode(
            creds.credentials,
            JWT_SECRET,
            algorithms=[ALGORITHM],
        )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    email = (
        payload.get("email")
        or payload.get("sub")
        or ""
    ).lower().strip()

    if not email:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    token_role = payload.get(
        "role"
    )

    token_account_type = payload.get(
        "account_type"
    )

    # ---------------------------------------------------------------
    # ADMIN ACCOUNT
    # ---------------------------------------------------------------

    admin = _find_admin(
        email
    )

    if admin:

        if not admin.get(
            "is_active",
            False,
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "Administrator account is disabled"
                ),
            )

        role = admin.get(
            "role"
        )

        if role not in ADMIN_ROLES:

            raise HTTPException(
                status_code=403,
                detail=(
                    "Invalid administrator role"
                ),
            )

        if (
            token_role
            and token_role != role
        ):

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid authentication token"
                ),
            )

        if (
            token_account_type
            and token_account_type != "admin"
        ):

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid authentication token"
                ),
            )

        return CurrentUser(
            id=(
                str(admin["id"])
                if admin.get("id") is not None
                else None
            ),
            name=(
                str(
                    admin.get("name")
                ).strip()
                if admin.get("name")
                else None
            ),
            email=(
                admin.get("email")
                or email
            ).lower().strip(),
            role=role,
            sub_status="active",
            account_type="admin",
            is_paid=True,
            access_state="admin",
            course_access=True,
        )

    # ---------------------------------------------------------------
    # LEARNER ACCOUNT
    # ---------------------------------------------------------------

    user = _find_user(
        email
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User account not found",
        )

    role = (
        user.get("role")
        or "normal"
    )

    if role not in LEARNER_ROLES:

        raise HTTPException(
            status_code=403,
            detail=(
                "Invalid learner role"
            ),
        )

    if (
        token_role
        and token_role != role
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid authentication token"
            ),
        )

    if (
        token_account_type
        and token_account_type != "learner"
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid authentication token"
            ),
        )

    # ---------------------------------------------------------------
    # EMAIL VERIFICATION CHECK
    # ---------------------------------------------------------------

    if (
        user.get("sub_status")
        == "pending"
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email address "
                "before accessing Learnora."
            ),
        )

    entitlement = (
        _resolve_learner_access(
            user
        )
    )
    if role == "organisation_prospect":
        entitlement = {
            **entitlement,
            "is_paid": False,
            "access_state": "prospect",
            "course_access": False,
        }

    organisation_id = None
    organisation_role = None
    if role != "organisation_prospect":
        try:
            memberships = (
                supabase.table("organisation_members")
                .select("organisation_id,role")
                .eq("user_id", user["id"])
                .eq("status", "active")
                .order("joined_at", desc=True)
                .limit(10)
                .execute()
            ).data or []
            for membership in memberships:
                organisation = (
                    supabase.table("organisations")
                    .select("id,is_active")
                    .eq("id", membership["organisation_id"])
                    .limit(1)
                    .execute()
                )
                if organisation.data and organisation.data[0].get("is_active"):
                    organisation_id = str(membership["organisation_id"])
                    organisation_role = str(membership["role"])
                    break
        except Exception:
            pass

    return CurrentUser(
        id=(
            str(user["id"])
            if user.get("id") is not None
            else None
        ),
        name=(
            str(
                user.get("name")
            ).strip()
            if user.get("name")
            else None
        ),
        email=(
            user.get("email")
            or email
        ).lower().strip(),
        role=role,
        sub_status=(
            entitlement["sub_status"]
        ),
        account_type="learner",
        is_paid=(
            entitlement["is_paid"]
        ),
        expires_at=(
            entitlement["expires_at"]
        ),
        trial_ends_at=(
            entitlement["trial_ends_at"]
        ),
        access_state=(
            entitlement["access_state"]
        ),
        course_access=(
            entitlement["course_access"]
        ),
        organisation_id=organisation_id,
        organisation_role=organisation_role,
    )


# ---------------------------------------------------------------------------
# AUTHORIZATION DEPENDENCIES
# ---------------------------------------------------------------------------

def require_active(
    user: CurrentUser = Depends(
        get_current_user
    ),
) -> CurrentUser:

    if not user.course_access:

        raise HTTPException(
            status_code=402,
            detail=(
                "An active trial or paid "
                "membership is required"
            ),
        )

    return user


def require_admin(
    user: CurrentUser = Depends(
        get_current_user
    ),
) -> CurrentUser:

    if (
        user.account_type
        != "admin"
    ):

        raise HTTPException(
            status_code=403,
            detail="Administrators only",
        )

    if user.role not in ADMIN_ROLES:

        raise HTTPException(
            status_code=403,
            detail="Administrators only",
        )

    return user


def require_super_admin(
    user: CurrentUser = Depends(
        get_current_user
    ),
) -> CurrentUser:

    if (
        user.account_type != "admin"
        or user.role != "super_admin"
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Super administrator "
                "access required"
            ),
        )

    return user


def require_learnora_admin(
    user: CurrentUser = Depends(
        get_current_user
    ),
) -> CurrentUser:

    if (
        user.account_type
        != "admin"
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator access "
                "required"
            ),
        )

    if user.role not in {
        "super_admin",
        "staff_admin",
    }:

        raise HTTPException(
            status_code=403,
            detail=(
                "Learnora administrator "
                "access required"
            ),
        )

    return user


def require_witstart_admin(
    user: CurrentUser = Depends(
        get_current_user
    ),
) -> CurrentUser:

    if (
        user.account_type
        != "admin"
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "Administrator access "
                "required"
            ),
        )

    if user.role not in {
        "super_admin",
        "witstart_admin",
    }:

        raise HTTPException(
            status_code=403,
            detail=(
                "WitStart administrator "
                "access required"
            ),
        )

    return user


# ---------------------------------------------------------------------------
# REQUEST MODELS
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: str


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

@router.post("/login")
def login(
    payload: LoginRequest,
    request: Request,
):

    email = norm_email(
        payload.email
    )

    rate_key = (
        f"{email}:"
        f"{_get_client_ip(request) or 'unknown'}"
    )

    if _limited(rate_key):

        log_security_event(
            action="login_rate_limited",
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=429,
            detail=(
                "Too many failed login attempts. "
                "Try again later."
            ),
        )

    # ---------------------------------------------------------------
    # ADMIN
    # ---------------------------------------------------------------

    admin = _find_admin(
        email
    )

    if admin:

        if not admin.get(
            "is_active",
            False,
        ):

            _record_failure(
                rate_key
            )

            log_security_event(
                action=(
                    "disabled_admin_login_attempt"
                ),
                email=email,
                request=request,
            )

            raise HTTPException(
                status_code=403,
                detail=(
                    "This administrator "
                    "account is disabled."
                ),
            )

        valid, needs_rehash = (
            verify_password(
                payload.password,
                admin.get(
                    "password_hash",
                    "",
                ),
            )
        )

        if not valid:

            _record_failure(
                rate_key
            )

            log_security_event(
                action="failed_admin_login",
                email=email,
                request=request,
            )

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid email or password"
                ),
            )

        _clear_failures(
            rate_key
        )

        role = admin["role"]

        if needs_rehash:

            try:

                supabase.table(
                    "admins"
                ).update(
                    {
                        "password_hash": hash_password(
                            payload.password
                        )
                    }
                ).eq(
                    "id",
                    admin["id"],
                ).execute()

            except Exception as exc:

                print(
                    "Admin password rehash "
                    f"failed: {exc}"
                )

        now = datetime.now(
            timezone.utc
        ).isoformat()

        try:

            supabase.table(
                "admins"
            ).update(
                {
                    "last_login_at": now,
                }
            ).eq(
                "id",
                admin["id"],
            ).execute()

        except Exception as exc:

            print(
                "Failed to update admin "
                f"last_login_at: {exc}"
            )

        token = make_token(
            email=email,
            role=role,
            account_type="admin",
        )

        log_audit_event(
            action="admin_login",
            email=email,
            account_type="admin",
            role=role,
            request=request,
        )

        return {
            "status": "success",
            "token": token,
            "access_token": token,
            "email": email,
            "name": admin.get("name"),
            "role": role,
            "account_type": "admin",
            "sub_status": "active",
            "is_paid": True,
            "access_state": "admin",
            "course_access": True,
            "allowed": allowed_for(
                role,
                "admin",
            ),
        }

    # ---------------------------------------------------------------
    # LEARNER
    # ---------------------------------------------------------------

    user = _find_user(
        email
    )

    if not user:

        _record_failure(
            rate_key
        )

        log_security_event(
            action=(
                "failed_login_unknown_email"
            ),
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )

    valid, needs_rehash = (
        verify_password(
            payload.password,
            user.get(
                "password_hash",
                "",
            ),
        )
    )

    if not valid:

        _record_failure(
            rate_key
        )

        log_security_event(
            action="failed_learner_login",
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )

    _clear_failures(
        rate_key
    )

    role = (
        user.get("role")
        or "normal"
    )

    if role not in LEARNER_ROLES:

        raise HTTPException(
            status_code=403,
            detail=(
                "Invalid learner "
                "account role"
            ),
        )

    # ---------------------------------------------------------------
    # EMAIL VERIFICATION CHECK
    # ---------------------------------------------------------------

    if (
        user.get("sub_status")
        == "pending"
    ):

        log_security_event(
            action=(
                "login_unverified_account"
            ),
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=403,
            detail=(
                "Please verify your email address "
                "before logging in."
            ),
        )

    if needs_rehash:

        try:

            supabase.table(
                "users"
            ).update(
                {
                    "password_hash": hash_password(
                        payload.password
                    )
                }
            ).eq(
                "id",
                user["id"],
            ).execute()

        except Exception as exc:

            print(
                "Learner password rehash "
                f"failed: {exc}"
            )

    entitlement = (
        _resolve_learner_access(
            user
        )
    )
    if role == "organisation_prospect":
        entitlement = {
            **entitlement,
            "is_paid": False,
            "access_state": "prospect",
            "course_access": False,
        }

    organisation_id = None
    organisation_role = None
    if role != "organisation_prospect":
        try:
            memberships = (
                supabase.table("organisation_members")
                .select("organisation_id,role")
                .eq("user_id", user["id"])
                .eq("status", "active")
                .order("joined_at", desc=True)
                .limit(10)
                .execute()
            ).data or []
            for membership in memberships:
                organisation = (
                    supabase.table("organisations")
                    .select("id,is_active")
                    .eq("id", membership["organisation_id"])
                    .limit(1)
                    .execute()
                )
                if organisation.data and organisation.data[0].get("is_active"):
                    organisation_id = str(membership["organisation_id"])
                    organisation_role = str(membership["role"])
                    break
        except Exception:
            pass

    token = make_token(
        email=email,
        role=role,
        account_type="learner",
    )

    log_audit_event(
        action="learner_login",
        email=email,
        account_type="learner",
        role=role,
        request=request,
    )

    return {
        "status": "success",
        "token": token,
        "access_token": token,
        "email": email,
        "name": user.get("name"),
        "role": role,
        "account_type": "learner",
        "sub_status": (
            entitlement["sub_status"]
        ),
        "is_paid": (
            entitlement["is_paid"]
        ),
        "access_state": (
            entitlement["access_state"]
        ),
        "course_access": (
            entitlement["course_access"]
        ),
        "trial_ends_at": (
            entitlement["trial_ends_at"]
        ),
        "expires_at": (
            entitlement["expires_at"]
        ),
        "organisation_id": organisation_id,
        "organisation_role": organisation_role,
        "allowed": allowed_for(
            role,
            "learner",
        ),
    }


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    status_code=201,
)
def register(
    payload: RegisterRequest,
    request: Request,
):

    email = norm_email(
        payload.email
    )

    check_password_rules(
        payload.password
    )

    name = (
        (payload.name or "")
        .strip()[:100]
        or None
    )

    if _find_admin(email):

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this "
                "email already exists"
            ),
        )

    existing_user = _find_user(
        email
    )

    if existing_user:

        if (
            existing_user.get(
                "sub_status"
            )
            == "pending"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "An account with this email "
                    "already exists but has not "
                    "been verified. Please use "
                    "the verification email or "
                    "request a new one."
                ),
            )

        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this "
                "email already exists"
            ),
        )

    now = datetime.now(
        timezone.utc
    )

    # ---------------------------------------------------------------
    # CREATE PENDING ACCOUNT
    # ---------------------------------------------------------------

    row = {
        "email": email,
        "name": name,
        "password_hash": hash_password(
            payload.password
        ),
        "role": "normal",
        "sub_status": "pending",
        "is_paid": False,
        "subscription_tier": "free",
        "created_at": now.isoformat(),
        "email_verified_at": None,
    }

    try:

        response = (
            supabase
            .table("users")
            .insert(row)
            .execute()
        )

    except Exception as exc:

        print(
            f"Registration failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create account"
            ),
        )

    if not response.data:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to create account"
            ),
        )

    created_user = response.data[0]

    # ---------------------------------------------------------------
    # CREATE VERIFICATION TOKEN
    # ---------------------------------------------------------------

    raw_token = (
        _generate_raw_token()
    )

    token_hash = _hash_token(
        raw_token
    )

    expires_at = (
        now
        + timedelta(
            minutes=EMAIL_VERIFICATION_TTL_MINUTES
        )
    )

    try:

        supabase.table(
            "email_verification_tokens"
        ).insert(
            {
                "user_id": created_user["id"],
                "email": email,
                "token_hash": token_hash,
                "expires_at": (
                    expires_at.isoformat()
                ),
                "used_at": None,
                "created_at": now.isoformat(),
            }
        ).execute()

    except Exception as exc:

        print(
            "Failed to create "
            f"verification token: {exc}"
        )

        try:

            supabase.table(
                "users"
            ).delete().eq(
                "id",
                created_user["id"],
            ).execute()

        except Exception as cleanup_exc:

            print(
                "Registration cleanup failed: "
                f"{cleanup_exc}"
            )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to initialise "
                "email verification."
            ),
        )

    # ---------------------------------------------------------------
    # SEND VERIFICATION EMAIL
    # ---------------------------------------------------------------

    try:

        _send_verification_email(
            email=email,
            name=name,
            token=raw_token,
        )

    except Exception as exc:

        print(
            "Verification email failed: "
            f"{exc}"
        )

        log_security_event(
            action=(
                "verification_email_failed"
            ),
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Your account was created, "
                "but we could not send the verification "
                "email. Please request a new verification email."
            ),
        )

    log_audit_event(
        action="learner_registered",
        email=email,
        account_type="learner",
        role="normal",
        request=request,
    )

    return {
        "status": "success",
        "message": (
            "Account created. "
            "Please check your email and verify "
            "your account before logging in."
        ),
        "email": email,
        "name": name,
        "role": "normal",
        "account_type": "learner",
        "sub_status": "pending",
        "verification_required": True,
    }


# ---------------------------------------------------------------------------
# VERIFY EMAIL
# ---------------------------------------------------------------------------

@router.post("/verify-email")
def verify_email(
    payload: VerifyEmailRequest,
    request: Request,
):

    raw_token = (
        payload.token or ""
    ).strip()

    if not raw_token:

        raise HTTPException(
            status_code=400,
            detail=(
                "Verification token is required."
            ),
        )

    token_hash = _hash_token(
        raw_token
    )

    now = datetime.now(
        timezone.utc
    )

    try:

        response = (
            supabase
            .table(
                "email_verification_tokens"
            )
            .select(
                "id, user_id, email, token_hash, "
                "expires_at, used_at"
            )
            .eq(
                "token_hash",
                token_hash,
            )
            .limit(1)
            .execute()
        )

    except Exception as exc:

        print(
            f"Verification lookup failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to verify email right now."
            ),
        )

    rows = response.data or []

    if not rows:

        raise HTTPException(
            status_code=400,
            detail=(
                "This verification link is invalid "
                "or has expired."
            ),
        )

    token_record = rows[0]

    if token_record.get(
        "used_at"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This verification link "
                "has already been used."
            ),
        )

    token_expires = _parse_datetime(
        token_record.get(
            "expires_at"
        )
    )

    if (
        not token_expires
        or token_expires <= now
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This verification link has expired. "
                "Please request a new one."
            ),
        )

    # ---------------------------------------------------------------
    # FIND USER
    # ---------------------------------------------------------------

    try:

        user_response = (
            supabase
            .table("users")
            .select(
                "id, email, name, role, "
                "sub_status, is_paid, "
                "trial_ends_at, expires_at, "
                "email_verified_at"
            )
            .eq(
                "id",
                token_record["user_id"],
            )
            .limit(1)
            .execute()
        )

    except Exception as exc:

        print(
            f"Verification user lookup failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to verify email right now."
            ),
        )

    users = (
        user_response.data
        or []
    )

    if not users:

        raise HTTPException(
            status_code=404,
            detail="User account not found.",
        )

    user = users[0]

    # ---------------------------------------------------------------
    # ALREADY VERIFIED
    # ---------------------------------------------------------------

    if user.get(
        "sub_status"
    ) != "pending":

        try:

            supabase.table(
                "email_verification_tokens"
            ).update(
                {
                    "used_at": now.isoformat(),
                }
            ).eq(
                "id",
                token_record["id"],
            ).execute()

        except Exception as exc:

            print(
                "Failed to mark old "
                f"verification token used: {exc}"
            )

        return {
            "status": "success",
            "message": (
                "Your email has already been verified. "
                "You can log in."
            ),
            "email": user.get(
                "email"
            ),
        }

    # ---------------------------------------------------------------
    # VERIFY IDENTITY WITHOUT GRANTING A LEARNER TRIAL TO PROSPECTS
    # ---------------------------------------------------------------

    is_prospect = user.get("role") == "organisation_prospect"
    trial_ends_at = (
        None
        if is_prospect
        else now + timedelta(days=TRIAL_DAYS)
    )
    verification_update = {
        "sub_status": "expired" if is_prospect else "trialing",
        "is_paid": False,
        "subscription_tier": "free",
        "trial_ends_at": trial_ends_at.isoformat() if trial_ends_at else None,
        "email_verified_at": now.isoformat(),
    }

    try:

        update_response = (
            supabase
            .table("users")
            .update(
                verification_update
            )
            .eq(
                "id",
                user["id"],
            )
            .eq(
                "sub_status",
                "pending",
            )
            .execute()
        )

    except Exception as exc:

        print(
            f"Account activation failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to activate your account."
            ),
        )

    if not update_response.data:

        raise HTTPException(
            status_code=409,
            detail=(
                "The account could not be activated. "
                "Please try again."
            ),
        )

    # ---------------------------------------------------------------
    # CONSUME TOKEN
    # ---------------------------------------------------------------

    try:

        supabase.table(
            "email_verification_tokens"
        ).update(
            {
                "used_at": now.isoformat(),
            }
        ).eq(
            "id",
            token_record["id"],
        ).execute()

    except Exception as exc:

        print(
            "Failed to mark verification "
            f"token used: {exc}"
        )

    # ---------------------------------------------------------------
    # INVALIDATE OTHER VERIFICATION TOKENS
    # ---------------------------------------------------------------

    try:

        supabase.table(
            "email_verification_tokens"
        ).update(
            {
                "used_at": now.isoformat(),
            }
        ).eq(
            "user_id",
            user["id"],
        ).is_(
            "used_at",
            "null",
        ).execute()

    except Exception as exc:

        print(
            "Failed to invalidate old "
            f"verification tokens: {exc}"
        )

    # ---------------------------------------------------------------
    # CREATE SESSION TOKEN
    # ---------------------------------------------------------------

    role = (
        user.get("role")
        or "normal"
    )

    email = (
        user.get("email")
        or token_record.get("email")
        or ""
    ).lower().strip()

    token = make_token(
        email=email,
        role=role,
        account_type="learner",
    )

    log_audit_event(
        action="email_verified",
        email=email,
        account_type="learner",
        role=role,
        request=request,
        metadata={
            "trial_days": TRIAL_DAYS,
            "trial_ends_at": (
                trial_ends_at.isoformat()
            ),
        },
    )

    return {
        "status": "success",
        "message": (
            "Email verified successfully. "
            f"Your {TRIAL_DAYS}-day free trial has started."
        ),
        "token": token,
        "access_token": token,
        "email": email,
        "name": user.get("name"),
        "role": role,
        "account_type": "learner",
        "sub_status": "trialing",
        "is_paid": False,
        "access_state": "trial",
        "trial_ends_at": (
            trial_ends_at.isoformat()
        ),
        "course_access": True,
        "allowed": allowed_for(
            role,
            "learner",
        ),
        "redirect_view": (
            "/dashboard/general"
        ),
    }


# ---------------------------------------------------------------------------
# RESEND VERIFICATION EMAIL
# ---------------------------------------------------------------------------

@router.post(
    "/resend-verification"
)
def resend_verification(
    payload: ResendVerificationRequest,
    request: Request,
):

    email = norm_email(
        payload.email
    )

    generic_response = {
        "status": "success",
        "message": (
            "If an unverified account exists for this email, "
            "a verification email has been sent."
        ),
    }

    user = _find_user(
        email
    )

    if not user:
        return generic_response

    if (
        user.get("sub_status")
        != "pending"
    ):
        return generic_response

    now = datetime.now(
        timezone.utc
    )

    # ---------------------------------------------------------------
    # INVALIDATE PREVIOUS TOKENS
    # ---------------------------------------------------------------

    try:

        supabase.table(
            "email_verification_tokens"
        ).update(
            {
                "used_at": now.isoformat(),
            }
        ).eq(
            "user_id",
            user["id"],
        ).is_(
            "used_at",
            "null",
        ).execute()

    except Exception as exc:

        print(
            "Failed to invalidate old "
            f"verification tokens: {exc}"
        )

    # ---------------------------------------------------------------
    # CREATE NEW TOKEN
    # ---------------------------------------------------------------

    raw_token = (
        _generate_raw_token()
    )

    token_hash = _hash_token(
        raw_token
    )

    expires_at = (
        now
        + timedelta(
            minutes=EMAIL_VERIFICATION_TTL_MINUTES
        )
    )

    try:

        supabase.table(
            "email_verification_tokens"
        ).insert(
            {
                "user_id": user["id"],
                "email": email,
                "token_hash": token_hash,
                "expires_at": (
                    expires_at.isoformat()
                ),
                "used_at": None,
                "created_at": (
                    now.isoformat()
                ),
            }
        ).execute()

    except Exception as exc:

        print(
            "Failed to create "
            f"resend token: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to resend verification email."
            ),
        )

    try:

        _send_verification_email(
            email=email,
            name=user.get("name"),
            token=raw_token,
        )

    except Exception as exc:

        print(
            "Resend verification email failed: "
            f"{exc}"
        )

        log_security_event(
            action=(
                "resend_verification_email_failed"
            ),
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to send the verification email "
                "right now. Please try again later."
            ),
        )

    log_security_event(
        action="verification_email_resent",
        email=email,
        request=request,
    )

    return generic_response


# ---------------------------------------------------------------------------
# FORGOT PASSWORD
# ---------------------------------------------------------------------------

@router.post(
    "/forgot-password"
)
def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
):

    email = norm_email(
        payload.email
    )

    generic_response = {
        "status": "success",
        "message": (
            "If an account exists for this email, "
            "a password reset email has been sent."
        ),
    }

    admin = _find_admin(
        email
    )

    if admin:

        if not admin.get(
            "is_active",
            False,
        ):
            return generic_response

        account_id = admin["id"]
        account_type = "admin"
        account_name = admin.get("name")

    else:

        user = _find_user(
            email
        )

        if not user:
            return generic_response

        account_id = user["id"]
        account_type = "learner"
        account_name = user.get("name")

    now = datetime.now(
        timezone.utc
    )

    # ---------------------------------------------------------------
    # INVALIDATE PREVIOUS RESET TOKENS
    # ---------------------------------------------------------------

    try:

        supabase.table(
            "password_reset_tokens"
        ).update(
            {
                "used_at": now.isoformat(),
            }
        ).eq(
            "account_id",
            account_id,
        ).is_(
            "used_at",
            "null",
        ).execute()

    except Exception as exc:

        print(
            "Failed to invalidate previous "
            f"reset tokens: {exc}"
        )

    # ---------------------------------------------------------------
    # CREATE RESET TOKEN
    # ---------------------------------------------------------------

    raw_token = (
        _generate_raw_token()
    )

    token_hash = _hash_token(
        raw_token
    )

    expires_at = (
        now
        + timedelta(
            minutes=PASSWORD_RESET_TTL_MINUTES
        )
    )

    try:

        supabase.table(
            "password_reset_tokens"
        ).insert(
            {
                "account_id": account_id,
                "email": email,
                "account_type": account_type,
                "token_hash": token_hash,
                "expires_at": (
                    expires_at.isoformat()
                ),
                "used_at": None,
                "created_at": (
                    now.isoformat()
                ),
            }
        ).execute()

    except Exception as exc:

        print(
            "Failed to create password "
            f"reset token: {exc}"
        )

        return generic_response

    # ---------------------------------------------------------------
    # SEND RESET EMAIL
    # ---------------------------------------------------------------

    try:

        _send_password_reset_email(
            email=email,
            name=account_name,
            token=raw_token,
        )

    except Exception as exc:

        print(
            "Password reset email failed: "
            f"{exc}"
        )

        log_security_event(
            action=(
                "password_reset_email_failed"
            ),
            email=email,
            request=request,
        )

        return generic_response

    log_security_event(
        action="password_reset_requested",
        email=email,
        request=request,
        metadata={
            "account_type": account_type,
        },
    )

    return generic_response


# ---------------------------------------------------------------------------
# RESET PASSWORD
# ---------------------------------------------------------------------------

@router.post(
    "/reset-password"
)
def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
):

    raw_token = (
        payload.token or ""
    ).strip()

    if not raw_token:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password reset token is required."
            ),
        )

    check_password_rules(
        payload.new_password
    )

    if (
        payload.new_password
        != payload.confirm_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "New passwords do not match."
            ),
        )

    token_hash = _hash_token(
        raw_token
    )

    now = datetime.now(
        timezone.utc
    )

    try:

        response = (
            supabase
            .table(
                "password_reset_tokens"
            )
            .select(
                "id, account_id, email, account_type, "
                "token_hash, expires_at, used_at"
            )
            .eq(
                "token_hash",
                token_hash,
            )
            .limit(1)
            .execute()
        )

    except Exception as exc:

        print(
            f"Password reset lookup failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to reset password right now."
            ),
        )

    rows = response.data or []

    if not rows:

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link is invalid "
                "or has expired."
            ),
        )

    token_record = rows[0]

    if token_record.get(
        "used_at"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link "
                "has already been used."
            ),
        )

    token_expires = _parse_datetime(
        token_record.get(
            "expires_at"
        )
    )

    if (
        not token_expires
        or token_expires <= now
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This password reset link has expired. "
                "Please request a new one."
            ),
        )

    account_id = token_record[
        "account_id"
    ]

    account_type = token_record[
        "account_type"
    ]

    if account_type not in {
        "admin",
        "learner",
    }:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid password reset request."
            ),
        )

    table = (
        "admins"
        if account_type == "admin"
        else "users"
    )

    new_hash = hash_password(
        payload.new_password
    )

    try:

        response = (
            supabase
            .table(table)
            .update(
                {
                    "password_hash": new_hash,
                }
            )
            .eq(
                "id",
                account_id,
            )
            .execute()
        )

    except Exception as exc:

        print(
            f"Password reset update failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to reset password."
            ),
        )

    if not response.data:

        raise HTTPException(
            status_code=404,
            detail=(
                "Account could not be found."
            ),
        )

    # ---------------------------------------------------------------
    # CONSUME RESET TOKEN
    # ---------------------------------------------------------------

    try:

        supabase.table(
            "password_reset_tokens"
        ).update(
            {
                "used_at": now.isoformat(),
            }
        ).eq(
            "id",
            token_record["id"],
        ).execute()

    except Exception as exc:

        print(
            "Failed to mark reset token "
            f"used: {exc}"
        )

    # ---------------------------------------------------------------
    # INVALIDATE OTHER RESET TOKENS
    # ---------------------------------------------------------------

    try:

        supabase.table(
            "password_reset_tokens"
        ).update(
            {
                "used_at": now.isoformat(),
            }
        ).eq(
            "account_id",
            account_id,
        ).is_(
            "used_at",
            "null",
        ).execute()

    except Exception as exc:

        print(
            "Failed to invalidate other "
            f"reset tokens: {exc}"
        )

    log_security_event(
        action="password_reset_completed",
        request=request,
        metadata={
            "account_type": account_type,
            "account_id": str(
                account_id
            ),
        },
    )

    log_audit_event(
        action="password_reset_completed",
        account_type=account_type,
        request=request,
        metadata={
            "account_id": str(
                account_id
            ),
        },
    )

    return {
        "status": "success",
        "message": (
            "Password reset successfully. "
            "You can now log in with your new password."
        ),
    }


# ---------------------------------------------------------------------------
# CURRENT ACCOUNT
# ---------------------------------------------------------------------------

@router.get("/me")
def me(
    user: CurrentUser = Depends(
        get_current_user
    ),
):
    memberships = []
    if user.account_type != "admin":
        try:
            memberships = (
                supabase.table("organisation_members")
                .select("organisation_id,role,status")
                .eq("user_id", user.id)
                .eq("status", "active")
                .execute()
            ).data or []
        except Exception as exc:
            print("Current-user organisation membership lookup failed:", exc)
            memberships = []

    organisation_ids = list({str(row["organisation_id"]) for row in memberships if row.get("organisation_id")})
    if organisation_ids:
        try:
            organisation_rows = (
                supabase.table("organisations")
                .select("id,name,slug,is_active")
                .in_("id", organisation_ids)
                .execute()
            ).data or []
            organisation_map = {str(row["id"]): row for row in organisation_rows if row.get("is_active")}
            memberships = [
                {**row, "organisation_name": organisation_map[str(row["organisation_id"])].get("name"),
                 "organisation_slug": organisation_map[str(row["organisation_id"])].get("slug")}
                for row in memberships if str(row.get("organisation_id")) in organisation_map
            ]
        except Exception as exc:
            print("Current-user organisation details lookup failed:", exc)

    # A single default organisation is safe to infer. If the user belongs to
    # multiple organisations, return the memberships but do not silently pick one.
    single_membership = memberships[0] if len(memberships) == 1 else None
    return {
        "status": "success",
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "sub_status": user.sub_status,
        "account_type": user.account_type,
        "is_paid": user.is_paid,
        "access_state": user.access_state,
        "course_access": user.course_access,
        "trial_ends_at": user.trial_ends_at,
        "expires_at": user.expires_at,
        "organisation_id": single_membership.get("organisation_id") if single_membership else None,
        "organisation_role": single_membership.get("role") if single_membership else None,
        "organisation_memberships": memberships,
        "allowed": allowed_for(
            user.role,
            user.account_type,
        ),
    }


# ---------------------------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------------------------

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    user: CurrentUser = Depends(
        get_current_user
    ),
):

    check_password_rules(
        payload.new_password
    )

    if (
        payload.new_password
        != payload.confirm_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "New passwords do not match"
            ),
        )

    if (
        payload.current_password
        == payload.new_password
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "New password must be different "
                "from the current password"
            ),
        )

    # ---------------------------------------------------------------
    # FIND DATABASE ACCOUNT
    # ---------------------------------------------------------------

    if (
        user.account_type
        == "admin"
    ):

        account = _find_admin(
            user.email
        )

        if not account:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Administrator account "
                    "not found"
                ),
            )

        table = "admins"

    else:

        account = _find_user(
            user.email
        )

        if not account:

            raise HTTPException(
                status_code=404,
                detail=(
                    "User account not found"
                ),
            )

        table = "users"

    # ---------------------------------------------------------------
    # VERIFY CURRENT PASSWORD
    # ---------------------------------------------------------------

    valid, _ = verify_password(
        payload.current_password,
        account.get(
            "password_hash",
            "",
        ),
    )

    if not valid:

        log_security_event(
            action="failed_password_change",
            email=user.email,
            request=request,
        )

        raise HTTPException(
            status_code=401,
            detail=(
                "Current password is incorrect"
            ),
        )

    # ---------------------------------------------------------------
    # UPDATE PASSWORD
    # ---------------------------------------------------------------

    new_hash = hash_password(
        payload.new_password
    )

    try:

        response = (
            supabase
            .table(table)
            .update(
                {
                    "password_hash": new_hash,
                }
            )
            .eq(
                "id",
                account["id"],
            )
            .execute()
        )

    except Exception as exc:

        print(
            f"Password update failed: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to change password"
            ),
        )

    if not response.data:

        raise HTTPException(
            status_code=500,
            detail=(
                "Password was not changed"
            ),
        )

    log_audit_event(
        action="password_changed",
        email=user.email,
        account_type=user.account_type,
        role=user.role,
        request=request,
    )

    log_security_event(
        action="password_changed",
        email=user.email,
        request=request,
    )

    return {
        "status": "success",
        "message": (
            "Password changed successfully"
        ),
    }