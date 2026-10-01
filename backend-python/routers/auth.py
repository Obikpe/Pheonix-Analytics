"""Authentication and user management using Supabase PostgreSQL."""

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
from supabase import create_client, Client


router = APIRouter()
bearer = HTTPBearer(auto_error=False)


# ============================================================
# CONFIGURATION
# ============================================================

APP_ENV = os.getenv("APP_ENV", "production")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    if APP_ENV != "development":
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SECRET_KEY must be set."
        )

supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
)

ALGORITHM = "HS256"

TOKEN_TTL = int(
    os.getenv("TOKEN_TTL_SECONDS", "86400")
)

ACTIVE_STATUSES = {"trialing", "active"}

ROLES = {
    "normal",
    "witstart",
    "admin",
}

EMAIL_RE = re.compile(
    r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
)

JWT_SECRET = os.getenv("JWT_SECRET", "")

if len(JWT_SECRET) < 32:
    if APP_ENV != "development":
        raise RuntimeError(
            "JWT_SECRET must be set to a random string of 32+ characters."
        )

    JWT_SECRET = os.urandom(32).hex()


# Used when an email does not exist, so password verification
# still takes time and does not immediately reveal whether an
# account exists.
_DUMMY_HASH = (
    "$2b$12$5pR3p5R3p5R3p5R3p5R3p5R3p5R3p5R3p5R3p5R3p5"
)


# ============================================================
# PASSWORD FUNCTIONS
# ============================================================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(12),
    ).decode("utf-8")


def verify_password(
    password: str,
    stored: str,
) -> tuple[bool, bool]:
    """
    Verify a password.

    Returns:
        (is_valid, needs_rehash)

    bcrypt passwords:
        needs_rehash = False

    Legacy SHA-256 passwords:
        needs_rehash = True when valid
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
        except (ValueError, TypeError):
            return False, False

    # Legacy SHA-256 support
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


def check_password_rules(password: str):
    """Validate password requirements."""

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long",
        )

    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password is too long (72 bytes maximum)",
        )


# ============================================================
# GENERAL HELPERS
# ============================================================

def norm_email(email: str) -> str:
    """Normalize and validate an email address."""

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


def make_token(email: str, role: str) -> str:
    """
    Create the authentication JWT.

    The user's email is stored as the subject and is used
    to retrieve the user's current database record.
    """

    now = int(time.time())

    return jwt.encode(
        {
            "sub": email,
            "email": email,
            "role": role,
            "iat": now,
            "exp": now + TOKEN_TTL,
        },
        JWT_SECRET,
        algorithm=ALGORITHM,
    )


def allowed_for(role: str) -> dict:
    """Return permissions/configuration for a user role."""

    if role == "witstart":
        return {
            "courses": 12,
            "tracks": ["Witstart Private"],
            "redirect_view": "/witstart",
        }

    if role == "admin":
        return {
            "courses": 85,
            "tracks": ["all"],
            "is_admin": True,
            "redirect_view": "/admin",
        }

    return {
        "courses": 85,
        "tracks": ["all"],
        "redirect_view": "/general",
    }


# ============================================================
# LOGIN RATE LIMITING
# ============================================================

_FAILS: dict[str, deque] = defaultdict(deque)

MAX_FAILS = 5
WINDOW = 900  # 15 minutes


def _limited(key: str) -> bool:
    """Check whether an IP/email combination is rate limited."""

    queue = _FAILS[key]

    cutoff = time.time() - WINDOW

    while queue and queue[0] < cutoff:
        queue.popleft()

    if not queue:
        _FAILS.pop(key, None)
        return False

    return len(queue) >= MAX_FAILS


# ============================================================
# CURRENT USER MODEL
# ============================================================

class CurrentUser(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    email: str
    role: str
    sub_status: str


# ============================================================
# CURRENT USER / JWT AUTHENTICATION
# ============================================================

def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> CurrentUser:
    """
    Validate the JWT and retrieve the CURRENT user directly
    from the Supabase users table.

    The database is the source of truth for:
        - id
        - name
        - email
        - role
        - subscription status
    """

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

    # IMPORTANT:
    # Always retrieve the current user from Supabase.
    # We do NOT trust the role/name stored in the JWT.
    response = (
        supabase
        .table("users")
        .select(
            "id, name, email, role, sub_status, is_paid"
        )
        .eq("email", email)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        raise HTTPException(
            status_code=401,
            detail="User account not found",
        )

    row = rows[0]

    sub_status = (
        row.get("sub_status")
        or (
            "active"
            if row.get("is_paid")
            else "pending"
        )
    )

    return CurrentUser(
        id=str(row["id"]) if row.get("id") is not None else None,
        name=(
            str(row.get("name")).strip()
            if row.get("name")
            else None
        ),
        email=(
            row.get("email")
            or email
        ).lower().strip(),
        role=row.get("role", "normal"),
        sub_status=sub_status,
    )


def require_active(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Require an active subscription."""

    if user.sub_status not in ACTIVE_STATUSES:
        raise HTTPException(
            status_code=402,
            detail="An active subscription is required",
        )

    return user


def require_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Require administrator privileges."""

    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrators only",
        )

    return user


# ============================================================
# REQUEST MODELS
# ============================================================

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: Optional[str] = None
    email: str
    password: str


class AdminCreateUser(BaseModel):
    name: Optional[str] = None
    email: str
    password: str
    role: str = "normal"


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
):
    """
    Authenticate a user against the Supabase users table.

    IMPORTANT:
    The user's name is retrieved from Supabase and returned
    directly in the login response.
    """

    email = norm_email(body.email)

    if not body.password:
        raise HTTPException(
            status_code=400,
            detail="Password is required",
        )

    client_ip = (
        request.client.host
        if request.client
        else "unknown"
    )

    rate_limit_key = f"{client_ip}|{email}"

    if _limited(rate_limit_key):
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many failed attempts. "
                "Try again in 15 minutes."
            ),
        )

    # --------------------------------------------------------
    # ALWAYS retrieve the user from Supabase.
    # No environment/test accounts are used.
    # --------------------------------------------------------

    response = (
        supabase
        .table("users")
        .select(
            "id, name, email, password_hash, "
            "role, sub_status, is_paid"
        )
        .eq("email", email)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if not rows:
        # Perform dummy verification to reduce timing
        # differences between existing/non-existing accounts.
        verify_password(
            body.password,
            _DUMMY_HASH,
        )

        _FAILS[rate_limit_key].append(
            time.time()
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    row = rows[0]

    stored_password = (
        row.get("password_hash")
        or ""
    )

    valid_password, needs_rehash = verify_password(
        body.password,
        stored_password,
    )

    if not valid_password:
        _FAILS[rate_limit_key].append(
            time.time()
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # --------------------------------------------------------
    # Retrieve all user information from the database.
    # --------------------------------------------------------

    role = row.get("role") or "normal"

    name = (
        str(row.get("name")).strip()
        if row.get("name")
        else None
    )

    sub_status = (
        row.get("sub_status")
        or (
            "active"
            if row.get("is_paid")
            else "pending"
        )
    )

    # --------------------------------------------------------
    # Rehash legacy passwords with bcrypt when necessary.
    # --------------------------------------------------------

    if needs_rehash:
        new_hash = hash_password(
            body.password
        )

        (
            supabase
            .table("users")
            .update(
                {
                    "password_hash": new_hash
                }
            )
            .eq("id", row["id"])
            .execute()
        )

    # --------------------------------------------------------
    # Pending users cannot log in.
    # --------------------------------------------------------

    if sub_status == "pending":
        raise HTTPException(
            status_code=402,
            detail=(
                "Payment pending - please complete "
                "checkout. Check your email."
            ),
        )

    # Successful login: clear failed attempts.
    _FAILS.pop(rate_limit_key, None)

    access_token = make_token(
        email=email,
        role=role,
    )

    # --------------------------------------------------------
    # IMPORTANT:
    # name comes directly from the Supabase users table.
    # --------------------------------------------------------

    return {
        "ok": True,
        "access_token": access_token,
        "email": email,
        "name": name,
        "role": role,
        "subscription_status": sub_status,
        "allowed": allowed_for(role),
    }


# ============================================================
# REGISTER
# ============================================================

@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    """
    Create a new user in the Supabase users table.

    New accounts start as pending until payment/activation.
    """

    email = norm_email(body.email)

    check_password_rules(
        body.password
    )

    name = (
        (body.name or "").strip()[:100]
        or None
    )

    password_hash = hash_password(
        body.password
    )

    # --------------------------------------------------------
    # Check whether the email already exists.
    # --------------------------------------------------------

    response = (
        supabase
        .table("users")
        .select(
            "id, password_hash, sub_status"
        )
        .eq("email", email)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    if rows:
        row = rows[0]

        # Existing active/non-pending account
        if row.get("sub_status") != "pending":
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        # Existing pending account
        stored_password = (
            row.get("password_hash")
            or ""
        )

        valid_password, _ = verify_password(
            body.password,
            stored_password,
        )

        if not valid_password:
            raise HTTPException(
                status_code=400,
                detail=(
                    "An account with this email is "
                    "pending payment. Use the original "
                    "password or check your email to "
                    "complete checkout."
                ),
            )

        # Update name if supplied.
        if name:
            (
                supabase
                .table("users")
                .update(
                    {
                        "name": name
                    }
                )
                .eq("id", row["id"])
                .execute()
            )

        return {
            "ok": True,
            "email": email,
            "role": "normal",
            "subscription_status": "pending",
            "detail": (
                "Payment pending - complete checkout"
            ),
        }

    # --------------------------------------------------------
    # Create new user.
    # --------------------------------------------------------

    new_user_data = {
        "email": email,
        "password_hash": password_hash,
        "role": "normal",
        "name": name,
        "sub_status": "pending",
        "is_paid": False,
        "subscription_tier": "free",
        "created_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    try:
        (
            supabase
            .table("users")
            .insert(new_user_data)
            .execute()
        )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {str(e)}",
        )

    return {
        "ok": True,
        "email": email,
        "role": "normal",
        "subscription_status": "pending",
        "detail": (
            "Account created. "
            "Complete payment to activate."
        ),
    }


# ============================================================
# ADMIN CREATE USER
# ============================================================

@router.post(
    "/admin/users",
    status_code=201,
)
def admin_create_user(
    body: AdminCreateUser,
    _: CurrentUser = Depends(require_admin),
):
    """Allow an administrator to create a user."""

    email = norm_email(body.email)

    check_password_rules(
        body.password
    )

    if body.role not in ROLES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be one of: "
                + ", ".join(sorted(ROLES))
            ),
        )

    name = (
        (body.name or "").strip()[:100]
        or None
    )

    new_user_data = {
        "email": email,
        "password_hash": hash_password(
            body.password
        ),
        "role": body.role,
        "name": name,
        "sub_status": "active",
        "is_paid": True,
        "subscription_tier": "paid",
        "created_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    try:
        (
            supabase
            .table("users")
            .insert(new_user_data)
            .execute()
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    return {
        "ok": True,
        "email": email,
        "role": body.role,
        "name": name,
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
def me(
    user: CurrentUser = Depends(get_current_user),
):
    """
    Return the currently authenticated user's
    current database information.

    The frontend should use this endpoint as the
    authoritative source for the user's name.
    """

    return {
        "ok": True,
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "subscription_status": user.sub_status,
    }