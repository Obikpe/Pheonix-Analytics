"""Auth and user management using Supabase PostgreSQL."""
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

APP_ENV = os.getenv("APP_ENV", "production")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    if APP_ENV != "development":
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ALGORITHM = "HS256"
TOKEN_TTL = int(os.getenv("TOKEN_TTL_SECONDS", "86400"))
ACTIVE_STATUSES = {"trialing", "active"}
ROLES = {"normal", "witstart", "admin"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

JWT_SECRET = os.getenv("JWT_SECRET", "")
if len(JWT_SECRET) < 32:
    if APP_ENV != "development":
        raise RuntimeError("JWT_SECRET must be set to a random string of 32+ characters.")
    JWT_SECRET = os.urandom(32).hex()

_DUMMY_HASH = "$2b$12$5pR3p5R3p5R3p5R3p5R3"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

def verify_password(password: str, stored: str) -> tuple[bool, bool]:
    """Returns (is_valid, needs_rehash)."""
    if stored.startswith("$2"):
        try:
            return bcrypt.checkpw(password.encode(), stored.encode()), False
        except ValueError:
            return False, False
    ok = hmac.compare_digest(hashlib.sha256(password.encode()).hexdigest(), stored)
    return ok, ok

def check_password_rules(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters long")
    if len(password.encode()) > 72:
        raise HTTPException(400, "Password is too long (72 bytes maximum)")

def norm_email(email: str) -> str:
    e = (email or "").lower().strip()
    if not EMAIL_RE.match(e) or len(e) > 254:
        raise HTTPException(400, "Invalid email format")
    return e

def make_token(email: str, role: str) -> str:
    now = int(time.time())
    return jwt.encode(
        {"sub": email, "email": email, "iat": now, "exp": now + TOKEN_TTL},
        JWT_SECRET,
        algorithm=ALGORITHM,
    )

def _env_accounts() -> dict[str, tuple[str, str]]:
    out = {}
    for role, prefix in (("admin", "ADMIN"), ("witstart", "WITSTART"), ("normal", "NORMAL")):
        email = os.getenv(f"{prefix}_EMAIL", "").lower().strip()
        pw_hash = os.getenv(f"{prefix}_PASSWORD_HASH", "") or os.getenv(f"{prefix}_PASSWORD", "")
        if email and pw_hash:
            out[email] = (role, pw_hash)
    return out

def allowed_for(role: str) -> dict:
    if role == "witstart":
        return {"courses": 12, "tracks": ["Witstart Private"], "redirect_view": "/witstart"}
    if role == "admin":
        return {"courses": 85, "tracks": ["all"], "is_admin": True, "redirect_view": "/admin"}
    return {"courses": 85, "tracks": ["all"], "redirect_view": "/general"}

_FAILS: dict[str, deque] = defaultdict(deque)
MAX_FAILS, WINDOW = 5, 900

def _limited(key: str) -> bool:
    q = _FAILS[key]
    cutoff = time.time() - WINDOW
    while q and q[0] < cutoff:
        q.popleft()
    if not q:
        _FAILS.pop(key, None)
        return False
    return len(q) >= MAX_FAILS

class CurrentUser(BaseModel):
    id: Optional[str] = None
    email: str
    role: str
    sub_status: str

def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> CurrentUser:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

    email = (payload.get("email") or payload.get("sub") or "").lower().strip()
    if not email:
        raise HTTPException(401, "Invalid or expired token")

    env = _env_accounts().get(email)
    if env:
        return CurrentUser(email=email, role=env[0], sub_status="active")

    response = supabase.table("users").select("id, role, sub_status, is_paid").eq("email", email).execute()
    rows = response.data
    if not rows:
        raise HTTPException(401, "Invalid or expired token")
    row = rows[0]
    sub_status = row.get("sub_status") or ("active" if row.get("is_paid") else "pending")
    return CurrentUser(id=str(row["id"]), email=email, role=row.get("role", "normal"), sub_status=sub_status)

def require_active(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.sub_status not in ACTIVE_STATUSES:
        raise HTTPException(402, "An active subscription is required")
    return user

def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(403, "Administrators only")
    return user

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

@router.post("/login")
def login(body: LoginRequest, request: Request):
    email = norm_email(body.email)
    if not body.password:
        raise HTTPException(400, "Password is required")
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}|{email}"
    if _limited(key):
        raise HTTPException(429, "Too many failed attempts. Try again in 15 minutes.")
    
    role: Optional[str] = None
    sub_status = "active"
    
    env = _env_accounts().get(email)
    if env:
        env_role, env_hash = env
        if env_hash.startswith("$2"):
            if bcrypt.checkpw(body.password.encode(), env_hash.encode()):
                role = env_role
        else:
            if hmac.compare_digest(body.password.encode(), env_hash.encode()):
                role = env_role
        if not role:
            verify_password(body.password, _DUMMY_HASH)
    else:
        response = supabase.table("users").select("id, password_hash,role, sub_status, is_paid").eq("email", email).execute()
        rows = response.data
        if rows:
            row = rows[0]
            stored_pw = row.get("password_hash") or ""
            ok, rehash = verify_password(body.password, stored_pw)
            if ok:
                role = row.get("role", "normal")
                sub_status = row.get("sub_status") or ("active" if row.get("is_paid") else "pending")
                if rehash:
                    new_hash = hash_password(body.password)
                    supabase.table("users").update({"password_hash": new_hash}).eq("email", email).execute()
            else:
                verify_password(body.password, _DUMMY_HASH)
        else:
            verify_password(body.password, _DUMMY_HASH)

    if not role:
        _FAILS[key].append(time.time())
        raise HTTPException(401, "Invalid email or password")
    if sub_status == "pending":
        raise HTTPException(402, "Payment pending - please complete checkout. Check your email.")
    
    _FAILS.pop(key, None)
    return {
        "ok": True,
        "access_token": make_token(email, role),
        "email": email,
        "role": role,
        "subscription_status": sub_status,
        "allowed": allowed_for(role),
    }

@router.post("/register", status_code=201)
def register(body: RegisterRequest):
    """Creates a PENDING account and saves data directly to Supabase SQL."""
    email = norm_email(body.email)
    check_password_rules(body.password)
    name = (body.name or "").strip()[:100] or None
    if email in _env_accounts():
        raise HTTPException(400, "Email already registered")
    
    pw_hash = hash_password(body.password)
    
    # Check if user already exists in Supabase
    response = supabase.table("users").select("id, password_hash, sub_status").eq("email", email).execute()
    rows = response.data
    
    if rows:
        row = rows[0]
        if row.get("sub_status") != "pending":
            raise HTTPException(400, "Email already registered")
        stored_pw = row.get("password_hash") or row.get("password") or ""
        ok, _ = verify_password(body.password, stored_pw)
        if not ok:
            raise HTTPException(400, "An account with this email is pending payment. Use the original password or check your email to complete checkout.")
        if name:
            supabase.table("users").update({"name": name}).eq("id", row["id"]).execute()
        return {
            "ok": True,
            "email": email,
            "role": "normal",
            "subscription_status": "pending",
            "detail": "Payment pending - complete checkout"
        }
    
    # Save new user to Supabase SQL table with timestamp compatible with TIMESTAMPTZ
    new_user_data = {
        "email": email,
        "password_hash": pw_hash,
        "role": "normal",
        "name": name,
        "sub_status": "pending",
        "is_paid": False,
        "subscription_tier": "free",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        supabase.table("users").insert(new_user_data).execute()
    except Exception as e:
        raise HTTPException(400, f"Registration failed: {str(e)}")

    return {
        "ok": True,
        "email": email,
        "role": "normal",
        "subscription_status": "pending",
        "detail": "Account created. Complete payment to activate."
    }

@router.post("/admin/users", status_code=201)
def admin_create_user(body: AdminCreateUser, _: CurrentUser = Depends(require_admin)):
    email = norm_email(body.email)
    check_password_rules(body.password)
    if body.role not in ROLES:
        raise HTTPException(400, f"Role must be one of: {', '.join(sorted(ROLES))}")
    
    new_user_data = {
        "email": email,
        "password_hash": hash_password(body.password),
        "role": body.role,
        "name": (body.name or "").strip()[:100] or None,
        "sub_status": "active",
        "is_paid": True,
        "subscription_tier": "paid",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        supabase.table("users").insert(new_user_data).execute()
    except Exception:
        raise HTTPException(400, "Email already registered")
    
    return {"ok": True, "email": email, "role": body.role}

@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    return {"ok": True, "email": user.email, "role": user.role, "subscription_status": user.sub_status}