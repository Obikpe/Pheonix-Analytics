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

The same JWT authentication mechanism is used for both account types, but
authorization is handled according to the account type and role.
"""

import hashlib
import hmac
import os
import re
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Optional

import bcrypt
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

APP_ENV = os.getenv("APP_ENV", "production")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    if APP_ENV != "development":
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SECRET_KEY must be set."
        )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"

TOKEN_TTL = int(
    os.getenv("TOKEN_TTL_SECONDS", "86400")
)

JWT_SECRET = os.getenv("JWT_SECRET", "")

if len(JWT_SECRET) < 32:
    if APP_ENV != "development":
        raise RuntimeError(
            "JWT_SECRET must be set to a random string of 32+ characters."
        )

    JWT_SECRET = os.urandom(32).hex()


# ---------------------------------------------------------------------------
# ROLES
# ---------------------------------------------------------------------------

LEARNER_ROLES = {
    "normal",
    "witstart",
}

ADMIN_ROLES = {
    "super_admin",
    "staff_admin",
    "witstart_admin",
}

# Compatibility alias.
# Other backend modules may import ROLES when dealing with learners.
ROLES = LEARNER_ROLES

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


def norm_email(email: str) -> str:
    normalized = (email or "").lower().strip()

    if (
        not EMAIL_RE.match(normalized)
        or len(normalized) > 254
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid email format",
        )

    return normalized


def check_password_rules(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long",
        )

    # bcrypt only supports 72 bytes.
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password is too long (72 bytes maximum)",
        )


# ---------------------------------------------------------------------------
# PASSWORDS
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
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

    bcrypt passwords:
        valid, False

    Legacy SHA256 passwords:
        valid, True
    """

    if not stored:
        return False, False

    # Current bcrypt password.
    if stored.startswith("$2"):
        try:
            return (
                bcrypt.checkpw(
                    password.encode("utf-8"),
                    stored.encode("utf-8"),
                ),
                False,
            )
        except (ValueError, TypeError):
            return False, False

    # Legacy SHA256 support.
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
# LOGIN RATE LIMITING
# ---------------------------------------------------------------------------

_FAILS: dict[str, deque] = defaultdict(deque)

MAX_FAILS = 5
WINDOW = 900  # 15 minutes


def _limited(key: str) -> bool:
    queue = _FAILS[key]

    cutoff = time.time() - WINDOW

    while queue and queue[0] < cutoff:
        queue.popleft()

    if not queue:
        _FAILS.pop(key, None)
        return False

    return len(queue) >= MAX_FAILS


def _record_failure(key: str):
    _FAILS[key].append(time.time())


def _clear_failures(key: str):
    _FAILS.pop(key, None)


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def make_token(
    email: str,
    role: str,
    account_type: str,
) -> str:
    now = int(time.time())

    return jwt.encode(
        {
            "sub": email,
            "email": email,
            "role": role,
            "account_type": account_type,
            "iat": now,
            "exp": now + TOKEN_TTL,
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
    """
    Describes frontend capabilities.

    This is informational for the frontend.
    Actual authorization is enforced server-side.
    """

    if account_type == "admin":

        if role == "super_admin":
            return {
                "courses": 85,
                "tracks": ["all"],
                "is_admin": True,
                "admin_role": role,
                "redirect_view": "/dashboard/admin/super_admin",
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
                "redirect_view": "/dashboard/admin/staff_admin",
                "permissions": [
                    "manage_normal_learners",
                    "view_learnora_activity",
                ],
            }

        if role == "witstart_admin":
            return {
                "courses": 12,
                "tracks": ["WitStart Private"],
                "is_admin": True,
                "admin_role": role,
                "redirect_view": "/dashboard/admin/witstart_admin",
                "permissions": [
                    "manage_witstart_learners",
                    "view_witstart_activity",
                ],
            }

    # Learners
    if role == "witstart":
        return {
            "courses": 12,
            "tracks": ["Witstart Private"],
            "is_admin": False,
            "redirect_view": "/dashboard/witstart",
        }

    return {
        "courses": 85,
        "tracks": ["all"],
        "is_admin": False,
        "redirect_view": "/dashboard/general",
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


# ---------------------------------------------------------------------------
# AUDIT LOGGING
# ---------------------------------------------------------------------------

def _get_client_ip(request: Optional[Request]) -> Optional[str]:
    if not request:
        return None

    forwarded = request.headers.get("x-forwarded-for")

    if forwarded:
        return forwarded.split(",")[0].strip()

    return request.client.host if request.client else None


def log_audit_event(
    *,
    action: str,
    email: Optional[str] = None,
    account_type: Optional[str] = None,
    role: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[dict] = None,
):
    """
    Writes an event to audit_logs.

    This function intentionally fails silently so an audit logging problem
    cannot prevent authentication or normal application functionality.
    """

    try:
        row = {
            "action": action,
            "email": email,
            "account_type": account_type,
            "role": role,
            "ip": _get_client_ip(request),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if metadata is not None:
            row["metadata"] = metadata

        supabase.table("audit_logs").insert(row).execute()

    except Exception as exc:
        print(f"Audit logging failed: {exc}")


def log_security_event(
    *,
    action: str,
    email: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[dict] = None,
):
    """
    Writes security-related events to security_logs.

    Like audit logging, this must never break the main request.
    """

    try:
        row = {
            "action": action,
            "email": email,
            "ip": _get_client_ip(request),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        if metadata is not None:
            row["metadata"] = metadata

        supabase.table("security_logs").insert(row).execute()

    except Exception as exc:
        print(f"Security logging failed: {exc}")


# ---------------------------------------------------------------------------
# FIND ACCOUNT
# ---------------------------------------------------------------------------

def _find_admin(email: str):
    response = (
        supabase
        .table("admins")
        .select(
            "id, email, name, password_hash, role, "
            "is_active, last_login_at"
        )
        .eq("email", email)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return rows[0] if rows else None


def _find_user(email: str):
    response = (
        supabase
        .table("users")
        .select(
            "id, name, email, password_hash, role, "
            "sub_status, is_paid, subscription_tier, "
            "expires_at, trial_ends_at"
        )
        .eq("email", email)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return rows[0] if rows else None


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

    token_role = payload.get("role")
    token_account_type = payload.get("account_type")

    # ---------------------------------------------------------------
    # ADMIN ACCOUNT
    # ---------------------------------------------------------------

    admin = _find_admin(email)

    if admin:
        if not admin.get("is_active", False):
            raise HTTPException(
                status_code=403,
                detail="Administrator account is disabled",
            )

        role = admin.get("role")

        if role not in ADMIN_ROLES:
            raise HTTPException(
                status_code=403,
                detail="Invalid administrator role",
            )

        # Ensure the token has not been manipulated into another role.
        if token_role and token_role != role:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        if (
            token_account_type
            and token_account_type != "admin"
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        return CurrentUser(
            id=(
                str(admin["id"])
                if admin.get("id") is not None
                else None
            ),
            name=(
                str(admin.get("name")).strip()
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
        )

    # ---------------------------------------------------------------
    # LEARNER ACCOUNT
    # ---------------------------------------------------------------

    user = _find_user(email)

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account not found",
        )

    role = user.get("role") or "normal"

    if role not in LEARNER_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Invalid learner role",
        )

    if token_role and token_role != role:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    if (
        token_account_type
        and token_account_type != "learner"
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    sub_status = (
        user.get("sub_status")
        or (
            "active"
            if user.get("is_paid")
            else "pending"
        )
    )

    return CurrentUser(
        id=(
            str(user["id"])
            if user.get("id") is not None
            else None
        ),
        name=(
            str(user.get("name")).strip()
            if user.get("name")
            else None
        ),
        email=(
            user.get("email")
            or email
        ).lower().strip(),
        role=role,
        sub_status=sub_status,
        account_type="learner",
        is_paid=bool(user.get("is_paid")),
    )


# ---------------------------------------------------------------------------
# AUTHORIZATION DEPENDENCIES
# ---------------------------------------------------------------------------

def require_active(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:

    if user.sub_status not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=402,
            detail="An active subscription is required",
        )

    return user


def require_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:

    if user.account_type != "admin":
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
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:

    if (
        user.account_type != "admin"
        or user.role != "super_admin"
    ):
        raise HTTPException(
            status_code=403,
            detail="Super administrator access required",
        )

    return user


def require_learnora_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:

    if user.account_type != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required",
        )

    if user.role not in {
        "super_admin",
        "staff_admin",
    }:
        raise HTTPException(
            status_code=403,
            detail="Learnora administrator access required",
        )

    return user


def require_witstart_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:

    if user.account_type != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required",
        )

    if user.role not in {
        "super_admin",
        "witstart_admin",
    }:
        raise HTTPException(
            status_code=403,
            detail="WitStart administrator access required",
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


# ---------------------------------------------------------------------------
# LOGIN
# ---------------------------------------------------------------------------

@router.post("/login")
def login(
    payload: LoginRequest,
    request: Request,
):
    email = norm_email(payload.email)

    # Prevent obvious brute-force attacks.
    rate_key = f"{email}:{_get_client_ip(request) or 'unknown'}"

    if _limited(rate_key):
        log_security_event(
            action="login_rate_limited",
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Try again later.",
        )

    # ---------------------------------------------------------------
    # ADMIN FIRST
    # ---------------------------------------------------------------

    admin = _find_admin(email)

    if admin:

        if not admin.get("is_active", False):
            _record_failure(rate_key)

            log_security_event(
                action="disabled_admin_login_attempt",
                email=email,
                request=request,
            )

            raise HTTPException(
                status_code=403,
                detail="This administrator account is disabled.",
            )

        valid, needs_rehash = verify_password(
            payload.password,
            admin.get("password_hash", ""),
        )

        if not valid:
            _record_failure(rate_key)

            log_security_event(
                action="failed_admin_login",
                email=email,
                request=request,
            )

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password",
            )

        _clear_failures(rate_key)

        role = admin["role"]

        # Upgrade legacy SHA256 admin password.
        if needs_rehash:
            try:
                supabase.table("admins").update(
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
                    f"Admin password rehash failed: {exc}"
                )

        now = datetime.now(timezone.utc).isoformat()

        try:
            supabase.table("admins").update(
                {
                    "last_login_at": now,
                }
            ).eq(
                "id",
                admin["id"],
            ).execute()
        except Exception as exc:
            print(
                f"Failed to update admin last_login_at: {exc}"
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
            "email": email,
            "name": admin.get("name"),
            "role": role,
            "account_type": "admin",
            "sub_status": "active",
            "allowed": allowed_for(
                role,
                "admin",
            ),
        }

    # ---------------------------------------------------------------
    # LEARNER
    # ---------------------------------------------------------------

    user = _find_user(email)

    if not user:
        _record_failure(rate_key)

        log_security_event(
            action="failed_login_unknown_email",
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    valid, needs_rehash = verify_password(
        payload.password,
        user.get("password_hash", ""),
    )

    if not valid:
        _record_failure(rate_key)

        log_security_event(
            action="failed_learner_login",
            email=email,
            request=request,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    _clear_failures(rate_key)

    role = user.get("role") or "normal"

    if role not in LEARNER_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Invalid learner account role",
        )

    if needs_rehash:
        try:
            supabase.table("users").update(
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
                f"Learner password rehash failed: {exc}"
            )

    sub_status = (
        user.get("sub_status")
        or (
            "active"
            if user.get("is_paid")
            else "pending"
        )
    )

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
        "email": email,
        "name": user.get("name"),
        "role": role,
        "account_type": "learner",
        "sub_status": sub_status,
        "allowed": allowed_for(
            role,
            "learner",
        ),
    }


# ---------------------------------------------------------------------------
# REGISTER
# ---------------------------------------------------------------------------

@router.post("/register", status_code=201)
def register(
    payload: RegisterRequest,
    request: Request,
):
    email = norm_email(payload.email)

    check_password_rules(payload.password)

    name = (
        (payload.name or "").strip()[:100]
        or None
    )

    # Never allow a learner to register using an
    # existing administrator email.
    if _find_admin(email):
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists",
        )

    if _find_user(email):
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists",
        )

    now = datetime.now(timezone.utc)

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
    }

    try:
        response = (
            supabase
            .table("users")
            .insert(row)
            .execute()
        )

    except Exception as exc:
        print(f"Registration failed: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Unable to create account",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create account",
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
        "message": "Account created successfully",
        "email": email,
        "name": name,
        "role": "normal",
        "account_type": "learner",
    }


# ---------------------------------------------------------------------------
# CURRENT ACCOUNT
# ---------------------------------------------------------------------------

@router.get("/me")
def me(
    user: CurrentUser = Depends(get_current_user),
):
    return {
        "status": "success",
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "sub_status": user.sub_status,
        "account_type": user.account_type,
        "is_paid": user.is_paid,
        "allowed": allowed_for(
            user.role,
            user.account_type,
        ),
    }