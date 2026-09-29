from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import os
from supabase import create_client, Client

router = APIRouter(prefix="/api/admin", tags=["admin"])

# --- Supabase & Security Configuration ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SECRET_KEY", "") # Use service role key for full admin bypass of RLS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "your-super-secret-production-key")
JWT_ALGORITHM = "HS256"

# --- Pydantic Schemas ---
class CreateWitstartUser(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: str
    role: str = "witstart"

class GrantFreeRequest(BaseModel):
    email: EmailStr
    months: int = 1

# --- Dependency: Admin JWT Verification ---
def get_current_admin(authorization: Optional[str] = None):
    # Note: In FastAPI, extract Authorization header properly via Request or Header dependency
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token format")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_email: str = payload.get("sub")
        user_role: str = payload.get("role")
        
        if not user_email or user_role != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
            
        return {"email": user_email, "role": user_role}
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")


# --- 1. Get All Real Users from Supabase ---
@router.get("/users")
def get_all_users():
    # Query your actual Supabase table (mapping to the users/profiles table linked to auth)
    response = supabase.table("users").select("*").execute()
    return {"users": response.data or []}


# --- 2. Create User / Witstart Account in Supabase ---
@router.post("/users")
def create_user(payload: CreateWitstartUser):
    # Check if user already exists
    existing = supabase.table("users").select("email").eq("email", payload.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(days=91)).isoformat() if payload.role == "witstart" else None
    hashed_password = pwd_context.hash(payload.password[:72])

    new_user = {
        "email": payload.email,
        "name": payload.name,
        "password_hash": hashed_password,
        "role": payload.role,
        "sub_status": "active" if payload.role == "witstart" else "inactive",
        "created_at": now.isoformat(),
        "expires_at": expires_at
    }
    
    res = supabase.table("users").insert(new_user).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to insert user into Supabase")

    return {
        "status": "success",
        "message": f"User {payload.email} created successfully",
        "expires_at": expires_at
    }


# --- 3. Delete Real User from Supabase ---
@router.delete("/users/{email}")
def delete_user(email: str):
    res = supabase.table("users").delete().eq("email", email).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found or already deleted")
        
    return {"status": "success", "message": f"User {email} permanently deleted from database"}


# --- 4. Grant Free Month Extension in Supabase ---
@router.post("/grant-free-month")
def grant_free_month(payload: GrantFreeRequest):
    user_res = supabase.table("users").select("*").eq("email", payload.email).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    user = user_res.data[0]
    base_date_str = user.get("trial_ends_at") or user.get("expires_at")
    
    base_date = datetime.fromisoformat(base_date_str) if base_date_str else datetime.now(timezone.utc)
    if base_date < datetime.now(timezone.utc):
        base_date = datetime.now(timezone.utc)
        
    new_expiry = (base_date + timedelta(days=30 * payload.months)).isoformat()
    
    supabase.table("users").update({
        "trial_ends_at": new_expiry,
        "sub_status": "active"
    }).eq("email", payload.email).execute()
    
    return {"status": "success", "message": f"Granted {payload.months} month(s) extension to {payload.email}"}


# --- 5. Real Live Activity Stream from Supabase (`audit_logs`) ---
@router.get("/activity")
def get_activity_stream():
    # Matches the audit_logs table from your schema file
    res = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return {"activity": res.data or []}


# --- 6. Real Security Audit Logs from Supabase ---
@router.get("/security-logs")
def get_security_logs():
    res = supabase.table("security_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return {"logs": res.data or []}