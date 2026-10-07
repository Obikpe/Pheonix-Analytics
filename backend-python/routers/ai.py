"""Learnora AI API. Accessible before the new frontend exists."""
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel,Field
from .auth import CurrentUser,get_current_user,supabase
from .permissions import PermissionContext,require_permission,get_permission_context
from ..services.ai import generate

router=APIRouter(prefix="/api/ai",tags=["Learnora AI"])

class AskIn(BaseModel):
    feature:str="tutor"
    message:str=Field(...,min_length=1,max_length=12000)
    conversation_id:str|None=None
    organisation_id:str|None=None
    model:str|None=None

ALLOWED={"tutor","coach","practice","project","instructor","organisation"}

@router.post("/ask")
async def ask(body:AskIn,user:CurrentUser=Depends(get_current_user),context:PermissionContext=Depends(get_permission_context)):
    if body.feature not in ALLOWED:raise HTTPException(400,"Unsupported AI feature.")
    if body.feature in {"instructor","organisation"}:
        required="analytics.organisation" if body.feature=="organisation" else "ai.view"
        if not context.has_permission(required):
            raise HTTPException(403,"You are not authorised to use this AI feature.")
    elif context.organisation_id and not context.has_permission("ai.view") and context.organisation_role not in {"learner","instructor","admin","owner"}:
        raise HTTPException(403,"AI access is not available for this account.")
    conversation_id=body.conversation_id
    if conversation_id:
        c=supabase.table("learnora_ai_conversations").select("id,user_id").eq("id",conversation_id).limit(1).execute()
        if not c.data or str(c.data[0]["user_id"])!=str(user.id):raise HTTPException(403,"Conversation access denied.")
    else:
        c=supabase.table("learnora_ai_conversations").insert({"user_id":user.id,"organisation_id":body.organisation_id,"feature":body.feature}).execute()
        conversation_id=c.data[0]["id"] if c.data else None
    if conversation_id:
        supabase.table("learnora_ai_messages").insert({"conversation_id":conversation_id,"role":"user","content":body.message}).execute()
    result=await generate(user.id,body.feature,body.message,body.organisation_id,conversation_id,body.model)
    if conversation_id:
        supabase.table("learnora_ai_messages").insert({"conversation_id":conversation_id,"role":"assistant","content":result["content"],"provider":result.get("provider"),"model":result.get("model"),"latency_ms":result.get("latency_ms")}).execute()
    return {"success":True,"conversation_id":conversation_id,**result}

@router.get("/conversations")
def conversations(user:CurrentUser=Depends(get_current_user)):
    r=supabase.table("learnora_ai_conversations").select("id,organisation_id,feature,title,status,created_at,updated_at").eq("user_id",user.id).eq("status","active").order("updated_at",desc=True).execute()
    return {"success":True,"conversations":r.data or []}

@router.get("/conversations/{conversation_id}")
def conversation(conversation_id:str,user:CurrentUser=Depends(get_current_user)):
    c=supabase.table("learnora_ai_conversations").select("*").eq("id",conversation_id).eq("user_id",user.id).limit(1).execute()
    if not c.data:raise HTTPException(404,"Conversation not found.")
    m=supabase.table("learnora_ai_messages").select("*").eq("conversation_id",conversation_id).order("created_at").execute()
    return {"success":True,"conversation":c.data[0],"messages":m.data or []}

@router.get("/usage")
def usage(user:CurrentUser=Depends(get_current_user)):
    r=supabase.table("ai_usage_logs").select("feature,provider,model,request_status,input_tokens,output_tokens,latency_ms,created_at").eq("user_id",user.id).order("created_at",desc=True).limit(100).execute()
    return {"success":True,"usage":r.data or []}

@router.get("/admin/providers")
def providers(context:PermissionContext=Depends(require_permission("ai.manage"))):
    r=supabase.table("learnora_ai_providers").select("id,provider_key,display_name,base_url,default_model,enabled,priority,config,created_at,updated_at").order("priority").execute()
    return {"success":True,"providers":r.data or []}

@router.patch("/admin/providers/{provider_id}")
def update_provider(provider_id:str,enabled:bool|None=None,default_model:str|None=None,priority:int|None=None,context:PermissionContext=Depends(require_permission("ai.manage"))):
    updates={}
    if enabled is not None:updates["enabled"]=enabled
    if default_model is not None:updates["default_model"]=default_model
    if priority is not None:updates["priority"]=priority
    if not updates:raise HTTPException(400,"No provider changes supplied.")
    r=supabase.table("learnora_ai_providers").update(updates).eq("id",provider_id).execute()
    if not r.data:raise HTTPException(404,"Provider not found.")
    return {"success":True,"provider":r.data[0]}
