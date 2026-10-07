"""Learnora AI service layer.

Provider-independent orchestration:
Learnora AI -> provider router -> OpenRouter initially.
The database remains the source of truth; AI generates interpretation,
explanations and suggestions only.
"""
import os,time
from datetime import datetime,timezone,timedelta
import httpx
from ..routers.auth import supabase

DEFAULT_MODEL=os.getenv("OPENROUTER_MODEL","openrouter/auto")
OPENROUTER_URL=os.getenv("OPENROUTER_BASE_URL","https://openrouter.ai/api/v1").rstrip("/")

SYSTEM_PROMPTS={
 "tutor":"You are Learnora AI Tutor. Explain concepts clearly, use examples, check understanding, and never pretend a learner has completed work they have not shown.",
 "coach":"You are Learnora Learning Coach. Help the learner plan study, practise deliberately, reflect on weak areas, and take the next useful action.",
 "practice":"You are Learnora Practice Coach. Generate practical exercises from the supplied topic and give hints before solutions unless the learner explicitly asks for the solution.",
 "project":"You are Learnora Project Coach. Help learners scope, debug, explain and improve projects without fabricating evidence or claiming work was done.",
 "instructor":"You are Learnora Instructor Assistant. Help instructors draft explanations, exercises, feedback rubrics and learning activities.",
 "organisation":"You are Learnora Organisation Assistant. Help authorised organisation users understand learning operations, progress and course administration."
}

def _limit_ok(user_id,feature):
    day=datetime.now(timezone.utc).date().isoformat()
    r=supabase.table("ai_usage_logs").select("id").eq("user_id",user_id).gte("created_at",day+"T00:00:00+00:00").execute()
    limit=supabase.table("learnora_ai_limits").select("requests_per_day").eq("scope_type","global").eq("scope_id","*").eq("feature","*").limit(1).execute()
    max_requests=(limit.data[0].get("requests_per_day") if limit.data else 20) or 20
    return len(r.data or [])<max_requests

def _fallback(feature,message):
    text=message.strip()
    if not text:return "Tell me what you are learning or trying to accomplish, and I will help you take the next step."
    if feature=="practice":return f"Let's practise this step by step. First, explain in your own words what you already understand about: {text[:300]}"
    if feature=="coach":return f"Start with one concrete action: write down what you want to achieve with '{text[:300]}', then identify the smallest task you can complete in 15 minutes."
    if feature=="project":return f"For '{text[:300]}', define the goal, inputs, expected output and how you will prove the result. Then tackle one small component at a time."
    return f"Let's break this down. What part of '{text[:300]}' is confusing or where are you currently stuck?"

async def generate(user_id,feature,message,organisation_id=None,conversation_id=None,model=None):
    if not _limit_ok(user_id,feature):
        return {"status":"rate_limited","content":_fallback(feature,message),"provider":"rules","model":None}
    started=time.perf_counter()
    key=os.getenv("OPENROUTER_API_KEY")
    provider="openrouter"
    selected_model=model or DEFAULT_MODEL
    if not key:
        content=_fallback(feature,message)
        latency=int((time.perf_counter()-started)*1000)
        supabase.table("ai_usage_logs").insert({"user_id":user_id,"organisation_id":organisation_id,"feature":feature,"provider":"rules","model":None,"request_status":"success","latency_ms":latency,"metadata":{"fallback":True}}).execute()
        return {"status":"success","content":content,"provider":"rules","model":None,"latency_ms":latency}
    try:
        headers={"Authorization":f"Bearer {key}","Content-Type":"application/json","HTTP-Referer":os.getenv("LEARNORA_AI_REFERER","https://learnora-me.vercel.app"),"X-Title":"Learnora ME"}
        payload={"model":selected_model,"messages":[{"role":"system","content":SYSTEM_PROMPTS.get(feature,SYSTEM_PROMPTS["tutor"])},{"role":"user","content":message[:12000]}],"max_tokens":1200,"temperature":0.3}
        async with httpx.AsyncClient(timeout=45) as client:
            response=await client.post(OPENROUTER_URL+"/chat/completions",headers=headers,json=payload)
        if response.status_code>=400: raise RuntimeError(f"Provider returned {response.status_code}")
        data=response.json(); content=((data.get("choices") or [{}])[0].get("message") or {}).get("content")
        if not content:raise RuntimeError("Provider returned no content")
        usage=data.get("usage") or {}; latency=int((time.perf_counter()-started)*1000)
        supabase.table("ai_usage_logs").insert({"user_id":user_id,"organisation_id":organisation_id,"feature":feature,"provider":provider,"model":selected_model,"request_status":"success","latency_ms":latency,"input_tokens":usage.get("prompt_tokens"),"output_tokens":usage.get("completion_tokens")}).execute()
        return {"status":"success","content":content,"provider":provider,"model":selected_model,"latency_ms":latency}
    except Exception as exc:
        latency=int((time.perf_counter()-started)*1000)
        supabase.table("ai_usage_logs").insert({"user_id":user_id,"organisation_id":organisation_id,"feature":feature,"provider":provider,"model":selected_model,"request_status":"failed","latency_ms":latency,"metadata":{"error":str(exc)[:500],"fallback":True}}).execute()
        return {"status":"success","content":_fallback(feature,message),"provider":"rules","model":None,"latency_ms":latency}
