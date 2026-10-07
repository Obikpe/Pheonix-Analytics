"""Learnora creator application, courses and earnings API."""
from fastapi import APIRouter, Depends, HTTPException\nfrom datetime import datetime, timezone
from pydantic import BaseModel
from .auth import CurrentUser, get_current_user, supabase\nfrom .permissions import PermissionContext, require_permission

router=APIRouter(prefix="/api/creator",tags=["Creator"])

class CreatorApplicationIn(BaseModel):
    application_data:dict={}

class CreatorCourseIn(BaseModel):
    title:str
    slug:str
    description:str=""
    short_description:str=""
    level:str="beginner"

@router.post("/apply",status_code=201)
def apply(body:CreatorApplicationIn,user:CurrentUser=Depends(get_current_user)):
    existing=supabase.table("learnora_creator_accounts").select("id,status").eq("user_id",user.id).limit(1).execute()
    if existing.data:raise HTTPException(409,"Creator account already exists")
    r=supabase.table("learnora_creator_applications").insert({"user_id":user.id,"application_data":body.application_data}).execute()
    if not r.data:raise HTTPException(500,"Unable to submit creator application")
    return {"success":True,"application":r.data[0]}

@router.get("/me")
def me(user:CurrentUser=Depends(get_current_user)):
    a=supabase.table("learnora_creator_accounts").select("*").eq("user_id",user.id).limit(1).execute()
    if not a.data:return {"success":True,"creator":None}
    creator=a.data[0]
    sales=supabase.table("learnora_creator_sales").select("*").eq("creator_id",creator["id"]).execute()
    return {"success":True,"creator":creator,"sales":sales.data or []}

@router.post("/courses",status_code=201)
def create_course(body:CreatorCourseIn,user:CurrentUser=Depends(get_current_user)):
    a=supabase.table("learnora_creator_accounts").select("id,status").eq("user_id",user.id).limit(1).execute()
    if not a.data or a.data[0]["status"]!="approved":raise HTTPException(403,"Approved creator account required")
    r=supabase.table("learnora_courses").insert({"title":body.title,"slug":body.slug,"description":body.description,"short_description":body.short_description,"level":body.level,"ownership":"creator","creator_id":a.data[0]["id"],"created_by":user.id}).execute()
    if not r.data:raise HTTPException(500,"Unable to create creator course")
    return {"success":True,"course":r.data[0]}

@router.get("/earnings")
def earnings(user:CurrentUser=Depends(get_current_user)):
    a=supabase.table("learnora_creator_accounts").select("id").eq("user_id",user.id).limit(1).execute()
    if not a.data:raise HTTPException(404,"Creator account not found")
    r=supabase.table("learnora_creator_ledger").select("*").eq("creator_id",a.data[0]["id"]).order("created_at",desc=True).execute()
    return {"success":True,"ledger":r.data or []}

@router.post("/admin/applications/{application_id}/review")
def review_application(application_id:str, status:str, context:PermissionContext=Depends(require_permission("users.update"))):
    if status not in {"approved","declined"}: raise HTTPException(400,"Status must be approved or declined.")
    app=supabase.table("learnora_creator_applications").select("*").eq("id",application_id).limit(1).execute()
    if not app.data: raise HTTPException(404,"Creator application not found.")
    row=app.data[0]
    supabase.table("learnora_creator_applications").update({"status":status,"reviewed_by":context.user_id,"reviewed_at":datetime.now(timezone.utc).isoformat()}).eq("id",application_id).execute()
    if status=="approved":
        existing=supabase.table("learnora_creator_accounts").select("id").eq("user_id",row["user_id"]).limit(1).execute()
        if existing.data:
            creator=existing.data[0]
            supabase.table("learnora_creator_accounts").update({"status":"approved","approved_by":context.user_id,"approved_at":datetime.now(timezone.utc).isoformat(),"application_id":application_id}).eq("id",creator["id"]).execute()
        else:
            supabase.table("learnora_creator_accounts").insert({"user_id":row["user_id"],"status":"approved","approved_by":context.user_id,"approved_at":datetime.now(timezone.utc).isoformat(),"application_id":application_id}).execute()
    return {"success":True,"status":status}
