"""Central audit writer for sensitive Learnora operations."""
from fastapi import Request
from routers.auth import supabase

def audit(actor_user_id=None, action="", resource_type=None, resource_id=None,
          organisation_id=None, success=True, request:Request=None, metadata=None, actor_staff_id=None):
    try:
        payload={
            "actor_user_id":actor_user_id,
            "actor_staff_id":actor_staff_id,
            "action":action,
            "resource_type":resource_type,
            "resource_id":str(resource_id) if resource_id is not None else None,
            "organisation_id":organisation_id,
            "success":success,
            "metadata":metadata or {}
        }
        if request:
            payload["ip_address"]=request.client.host if request.client else None
            payload["user_agent"]=request.headers.get("user-agent")
        supabase.table("learnora_audit_events").insert(payload).execute()
    except Exception as exc:
        print(f"Audit write failed: {exc}")
