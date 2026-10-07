"""Internal Learnora staff authentication."""
import os, time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from .auth import hash_password, log_audit_event, norm_email, supabase, verify_password

router=APIRouter(prefix="/api/internal/auth",tags=["Internal Auth"])
bearer=HTTPBearer(auto_error=False)
JWT_SECRET=os.getenv("JWT_SECRET","").strip()
ALGORITHM="HS256"

class InternalLoginRequest(BaseModel):
    email:str
    password:str

class InternalStaffContext(BaseModel):
    staff_id:str
    user_id:str
    email:str
    name:Optional[str]=None
    job_title:Optional[str]=None
    status:str
    roles:list[str]=Field(default_factory=list)
    department_ids:list[str]=Field(default_factory=list)
    team_ids:list[str]=Field(default_factory=list)

def _staff_by_email(email):
    u=supabase.table("users").select("id,email,name,password_hash,role").eq("email",email).limit(1).execute()
    if not u.data:return None
    s=supabase.table("learnora_staff_accounts").select("id,user_id,job_title,status,employee_code").eq("user_id",u.data[0]["id"]).limit(1).execute()
    return {"user":u.data[0],"staff":s.data[0]} if s.data else None

def _load_staff_context(email):
    found=_staff_by_email(email)
    if not found:raise HTTPException(403,"Internal staff access is not enabled for this account.")
    u,s=found["user"],found["staff"]
    if s["status"]!="active":raise HTTPException(403,"This staff account is not active.")
    a=supabase.table("learnora_staff_role_assignments").select("role_id").eq("staff_id",s["id"]).eq("status","active").execute()
    ids=[x["role_id"] for x in (a.data or [])]
    roles=[]
    if ids:
        rr=supabase.table("learnora_staff_roles").select("slug").in_("id",ids).eq("status","active").execute()
        roles=[x["slug"] for x in (rr.data or [])]
    m=supabase.table("learnora_staff_team_members").select("team_id").eq("staff_id",s["id"]).eq("status","active").execute()
    teams=[x["team_id"] for x in (m.data or [])]
    deps=[]
    if teams:
        tr=supabase.table("learnora_staff_teams").select("department_id").in_("id",teams).execute()
        deps=sorted({x["department_id"] for x in (tr.data or []) if x.get("department_id")})
    return InternalStaffContext(staff_id=str(s["id"]),user_id=str(u["id"]),email=str(u["email"]).lower(),name=u.get("name"),job_title=s.get("job_title"),status=s["status"],roles=roles,department_ids=deps,team_ids=teams)

def get_current_staff(creds:Optional[HTTPAuthorizationCredentials]=Depends(bearer)):
    if not creds:raise HTTPException(401,"Not authenticated")
    if len(JWT_SECRET)<32:raise HTTPException(500,"Internal authentication is not configured")
    try:p=jwt.decode(creds.credentials,JWT_SECRET,algorithms=[ALGORITHM])
    except JWTError:raise HTTPException(401,"Invalid or expired internal token")
    if p.get("context")!="internal" or p.get("account_type")!="staff":raise HTTPException(403,"Internal staff token required")
    email=(p.get("email") or p.get("sub") or "").lower().strip()
    if not email:raise HTTPException(401,"Invalid internal token")
    return _load_staff_context(email)


INTERNAL_ROLE_PERMISSIONS={
 "super_admin":{"staff.view","staff.create","staff.update","staff.roles","staff.teams","staff.departments","system.audit"},
 "executive":{"staff.view","staff.teams","staff.departments","system.audit"},
 "operations":{"staff.view","staff.teams","staff.departments"},
 "product":{"staff.view","staff.teams"},
 "engineering":{"staff.view"},
 "data_analytics":{"staff.view"},
 "learning_curriculum":{"staff.view"},
 "customer_success":{"staff.view"},
 "sales_partnerships":{"staff.view"},
 "finance":{"staff.view"},
 "support":{"staff.view"},
 "ai_research":{"staff.view"},
}

def require_internal_permission(permission):
    def dependency(staff:InternalStaffContext=Depends(get_current_staff)):
        if any(permission in INTERNAL_ROLE_PERMISSIONS.get(role,set()) for role in staff.roles):
            return staff
        raise HTTPException(status_code=403,detail=f"Permission required: {permission}")
    return dependency

@router.post("/login")
def internal_login(payload:InternalLoginRequest,request:Request):
    email=norm_email(payload.email); found=_staff_by_email(email)
    if not found:raise HTTPException(401,"Invalid email or password")
    u,s=found["user"],found["staff"]
    if s["status"] not in {"active","pending_activation"}:raise HTTPException(403,"This staff account is not available for login")
    valid,rehash=verify_password(payload.password,u.get("password_hash",""))
    if not valid:raise HTTPException(401,"Invalid email or password")
    if rehash:supabase.table("users").update({"password_hash":hash_password(payload.password)}).eq("id",u["id"]).execute()
    if s["status"]=="pending_activation":
        supabase.table("learnora_staff_accounts").update({"status":"active","joined_at":datetime.now(timezone.utc).isoformat()}).eq("id",s["id"]).execute()
    now=int(time.time())
    token=jwt.encode({"sub":email,"email":email,"role":"staff","account_type":"staff","context":"internal","iat":now,"exp":now+int(os.getenv("TOKEN_TTL_SECONDS","86400"))},JWT_SECRET,algorithm=ALGORITHM)
    context=_load_staff_context(email)
    log_audit_event(action="internal_staff_login",email=email,account_type="staff",role="staff",request=request,metadata={"staff_id":context.staff_id})
    return {"status":"success","token":token,"staff":context.model_dump()}

@router.get("/me")
def internal_me(staff:InternalStaffContext=Depends(get_current_staff)):
    return {"status":"success","staff":staff.model_dump()}
