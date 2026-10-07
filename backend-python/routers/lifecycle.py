"""Organisation and cohort lifecycle/renewal API."""
from datetime import date
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from .auth import supabase
from .permissions import PermissionContext,require_permission
from ..services.audit import audit

router=APIRouter(prefix="/api/lifecycle",tags=["Lifecycle"])
ORG_STATES={"requested","under_review","contract_pending","pending_activation","active","expiring","expired","inactive","suspended","archived"}
COHORT_STATES={"draft","upcoming","active","ending","completed","expired","closed"}

class StatusIn(BaseModel):
    status:str
    reason:str|None=None

class RenewalIn(BaseModel):
    contract_number:str
    start_date:date|None=None
    end_date:date|None=None
    currency:str="NGN"
    commercial_terms:str|None=None
    document_url:str|None=None

def _org_access(context,oid):
    if context.is_platform_admin:return
    if str(context.organisation_id)!=str(oid):raise HTTPException(403,"Organisation access denied.")

@router.post("/organisations/{organisation_id}/status")
def org_status(organisation_id:str,body:StatusIn,context:PermissionContext=Depends(require_permission("organisations.update"))):
    _org_access(context,organisation_id)
    if body.status not in ORG_STATES:raise HTTPException(400,"Invalid organisation lifecycle status.")
    old=supabase.table("learnora_organisation_lifecycle").select("*").eq("organisation_id",organisation_id).limit(1).execute()
    old_status=old.data[0]["status"] if old.data else None
    payload={"organisation_id":organisation_id,"status":body.status,"status_reason":body.reason,"changed_by":context.user_id}
    if old.data:r=supabase.table("learnora_organisation_lifecycle").update(payload).eq("organisation_id",organisation_id).execute()
    else:r=supabase.table("learnora_organisation_lifecycle").insert(payload).execute()
    supabase.table("learnora_organisation_lifecycle_events").insert({"organisation_id":organisation_id,"from_status":old_status,"to_status":body.status,"reason":body.reason,"actor_user_id":context.user_id}).execute()
    audit(actor_user_id=context.user_id,action="organisation_lifecycle_changed",resource_type="organisation",resource_id=organisation_id,organisation_id=organisation_id,metadata={"from":old_status,"to":body.status,"reason":body.reason})
    return {"success":True,"lifecycle":r.data[0] if r.data else None}

@router.post("/contracts/{contract_id}/activate")
def activate_contract(contract_id:str,context:PermissionContext=Depends(require_permission("organisations.update"))):
    r=supabase.table("learnora_contracts").select("*").eq("id",contract_id).limit(1).execute()
    if not r.data:raise HTTPException(404,"Contract not found.")
    c=r.data[0]
    if c["status"] not in {"signed","sent","draft"}:raise HTTPException(409,"Contract cannot be activated from its current state.")
    upd=supabase.table("learnora_contracts").update({"status":"active","approved_at":"now()"}).eq("id",contract_id).execute()
    supabase.table("learnora_organisation_lifecycle").upsert({"organisation_id":c["organisation_id"],"status":"active","changed_by":context.user_id}).execute()
    audit(actor_user_id=context.user_id,action="contract_activated",resource_type="contract",resource_id=contract_id,organisation_id=c["organisation_id"])
    return {"success":True,"contract":upd.data[0] if upd.data else None}

@router.post("/organisations/{organisation_id}/renew")
def renew(organisation_id:str,body:RenewalIn,context:PermissionContext=Depends(require_permission("organisations.update"))):
    _org_access(context,organisation_id)
    current=supabase.table("learnora_contracts").select("id").eq("organisation_id",organisation_id).in_("status",["active","expiring","expired","renewed"]).order("created_at",desc=True).limit(1).execute()
    previous=current.data[0]["id"] if current.data else None
    payload={**body.model_dump(mode="json"),"organisation_id":organisation_id,"status":"draft","previous_contract_id":previous,"created_by":context.user_id}
    r=supabase.table("learnora_contracts").insert(payload).execute()
    if not r.data:raise HTTPException(500,"Unable to create renewal contract.")
    if previous:supabase.table("learnora_contracts").update({"status":"renewed"}).eq("id",previous).execute()
    audit(actor_user_id=context.user_id,action="organisation_contract_renewal_created",resource_type="contract",resource_id=r.data[0]["id"],organisation_id=organisation_id,metadata={"previous_contract_id":previous})
    return {"success":True,"contract":r.data[0]}

@router.post("/cohorts/{cohort_id}/status")
def cohort_status(cohort_id:str,body:StatusIn,context:PermissionContext=Depends(require_permission("organisations.update"))):
    if body.status not in COHORT_STATES:raise HTTPException(400,"Invalid cohort lifecycle status.")
    c=supabase.table("cohorts").select("id,organisation_id").eq("id",cohort_id).limit(1).execute()
    if not c.data:raise HTTPException(404,"Cohort not found.")
    _org_access(context,c.data[0]["organisation_id"])
    old=supabase.table("learnora_cohort_lifecycle").select("status").eq("cohort_id",cohort_id).limit(1).execute()
    old_status=old.data[0]["status"] if old.data else None
    r=supabase.table("learnora_cohort_lifecycle").upsert({"cohort_id":cohort_id,"status":body.status,"changed_by":context.user_id}).execute()
    supabase.table("cohorts").update({"status":body.status}).eq("id",cohort_id).execute()
    supabase.table("learnora_cohort_lifecycle_events").insert({"cohort_id":cohort_id,"from_status":old_status,"to_status":body.status,"reason":body.reason,"actor_user_id":context.user_id}).execute()
    return {"success":True,"lifecycle":r.data[0] if r.data else None}

@router.post("/cohorts/{cohort_id}/renew")
def renew_cohort(cohort_id:str,context:PermissionContext=Depends(require_permission("organisations.update"))):
    c=supabase.table("cohorts").select("*").eq("id",cohort_id).limit(1).execute()
    if not c.data:raise HTTPException(404,"Cohort not found.")
    old=c.data[0]; _org_access(context,old["organisation_id"])
    name=old["name"]+" — Renewal"
    r=supabase.table("cohorts").insert({"organisation_id":old["organisation_id"],"name":name,"description":old.get("description"),"start_date":None,"end_date":None,"status":"draft","programme_id":old.get("programme_id"),"capacity":old.get("capacity"),"instructor_capacity":old.get("instructor_capacity")}).execute()
    if not r.data:raise HTTPException(500,"Unable to create renewal cohort.")
    new=r.data[0]
    supabase.table("learnora_cohort_lifecycle").upsert({"cohort_id":cohort_id,"status":"completed","next_cohort_id":new["id"],"changed_by":context.user_id}).execute()
    supabase.table("learnora_cohort_lifecycle").upsert({"cohort_id":new["id"],"status":"draft","previous_cohort_id":cohort_id,"changed_by":context.user_id}).execute()
    audit(actor_user_id=context.user_id,action="cohort_renewed",resource_type="cohort",resource_id=new["id"],organisation_id=old["organisation_id"],metadata={"previous_cohort_id":cohort_id})
    return {"success":True,"previous_cohort":old,"new_cohort":new}
