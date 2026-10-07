"""Learnora commercial, organisation requests, contracts and entitlement API."""
from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field
from .auth import CurrentUser, get_current_user, supabase
from .permissions import PermissionContext, require_permission
from services.capacity import count_org

router=APIRouter(prefix="/api/commercial",tags=["Commercial"])

class OrganisationRequestIn(BaseModel):
    organisation_name:str=Field(...,min_length=2,max_length=200)
    contact_name:str=Field(...,min_length=2,max_length=150)
    email:str
    phone:Optional[str]=None
    country:Optional[str]=None
    website:Optional[str]=None
    organisation_type:Optional[str]=None
    request_type:str
    organisation_size:Optional[int]=None
    expected_learners:Optional[int]=None
    expected_instructors:Optional[int]=None
    expected_teams:Optional[int]=None
    expected_cohorts:Optional[int]=None
    duration:Optional[str]=None
    requirements:list[str]=[]
    notes:Optional[str]=None

class RequestStatusIn(BaseModel):
    status:str

class ContractIn(BaseModel):
    organisation_id:str
    request_id:Optional[str]=None
    contract_number:str
    currency:str="NGN"
    start_date:Optional[str]=None
    end_date:Optional[str]=None
    commercial_terms:Optional[str]=None
    document_url:Optional[str]=None

class EntitlementIn(BaseModel):
    entitlement_key:str
    limit_value:Optional[int]=None
    unit:Optional[str]=None
    enabled:bool=True
    metadata:dict[str,Any]={}

def _active_contract(org_id):
    r=supabase.table("learnora_contracts").select("*").eq("organisation_id",org_id).in_("status",["signed","active","expiring"]).order("created_at",desc=True).limit(1).execute()
    return r.data[0] if r.data else None

@router.post("/organisation-requests",status_code=201)
def create_request(body:OrganisationRequestIn):
    r=supabase.table("learnora_organisation_requests").insert({**body.model_dump(),"requirements":body.requirements,"status":"submitted"}).execute()
    if not r.data:raise HTTPException(500,"Unable to create organisation request")
    return {"success":True,"request":r.data[0]}

@router.get("/organisation-requests")
def list_requests(_:PermissionContext=Depends(require_permission("organisations.view"))):
    r=supabase.table("learnora_organisation_requests").select("*").order("created_at",desc=True).execute()
    return {"success":True,"requests":r.data or []}

@router.patch("/organisation-requests/{request_id}")
def update_request(request_id:str,body:RequestStatusIn,_:PermissionContext=Depends(require_permission("organisations.update"))):
    allowed={"submitted","under_review","discussion","contract_preparation","contract_sent","signed","pending_approval","active","declined","closed"}
    if body.status not in allowed:raise HTTPException(400,"Invalid request status")
    req=supabase.table("learnora_organisation_requests").select("organisation_id").eq("id",request_id).limit(1).execute()
    if not req.data:raise HTTPException(404,"Organisation request not found")
    if body.status=="active":
        oid=req.data[0].get("organisation_id")
        if not oid:raise HTTPException(409,"An organisation must be linked before activation.")
        if not _active_contract(oid):raise HTTPException(409,"An active or signed contract is required before activation.")
    r=supabase.table("learnora_organisation_requests").update({"status":body.status}).eq("id",request_id).execute()
    if not r.data:raise HTTPException(404,"Organisation request not found")
    return {"success":True,"request":r.data[0]}

@router.post("/contracts",status_code=201)
def create_contract(body:ContractIn,context:PermissionContext=Depends(require_permission("organisations.update"))):
    org=supabase.table("organisations").select("id").eq("id",body.organisation_id).limit(1).execute()
    if not org.data:raise HTTPException(404,"Organisation not found")
    r=supabase.table("learnora_contracts").insert(body.model_dump()).execute()
    if not r.data:raise HTTPException(500,"Unable to create contract")
    return {"success":True,"contract":r.data[0]}

@router.get("/organisations/{organisation_id}/contract")
def current_contract(organisation_id:str,_:PermissionContext=Depends(require_permission("organisations.view"))):
    contract=_active_contract(organisation_id)
    return {"success":True,"contract":contract}

@router.post("/contracts/{contract_id}/entitlements",status_code=201)
def add_entitlement(contract_id:str,body:EntitlementIn,_:PermissionContext=Depends(require_permission("organisations.update"))):
    r=supabase.table("learnora_contract_entitlements").upsert({"contract_id":contract_id,**body.model_dump()},on_conflict="contract_id,entitlement_key").execute()
    if not r.data:raise HTTPException(500,"Unable to save entitlement")
    return {"success":True,"entitlement":r.data[0]}

@router.get("/organisations/{organisation_id}/capacity")
def capacity(organisation_id:str,_:PermissionContext=Depends(require_permission("organisations.view"))):
    contract=_active_contract(organisation_id)
    if not contract:return {"success":True,"contract":None,"capacity":[]}
    r=supabase.table("learnora_contract_entitlements").select("*").eq("contract_id",contract["id"]).execute()
    usage=[]
    for e in r.data or []:
        key=e["entitlement_key"]; limit=e.get("limit_value")
        count=count_org(organisation_id,key)
        usage.append({"entitlement":e,"used":count,"remaining":None if limit is None else max(0,limit-count)})
    return {"success":True,"contract":contract,"capacity":usage}
