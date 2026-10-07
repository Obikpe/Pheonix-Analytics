"""Creator marketplace settlement and payout workflow."""
from datetime import datetime,timezone
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel
from .auth import CurrentUser,get_current_user,supabase
from .permissions import PermissionContext,require_permission

router=APIRouter(prefix="/api/creator-finance",tags=["Creator Finance"])

class SaleIn(BaseModel):
    creator_id:str
    buyer_user_id:str|None=None
    course_id:str
    gross_amount_minor:int
    currency:str
    platform_fee_minor:int
    creator_earnings_minor:int
    provider_reference:str|None=None

class PayoutIn(BaseModel):
    amount_minor:int
    currency:str

def creator_for_user(uid):
    r=supabase.table("learnora_creator_accounts").select("id,status").eq("user_id",uid).limit(1).execute()
    if not r.data:raise HTTPException(404,"Creator account not found.")
    if r.data[0]["status"]!="approved":raise HTTPException(403,"Creator account is not active.")
    return r.data[0]

@router.post("/sales",status_code=201)
def record_sale(body:SaleIn,context:PermissionContext=Depends(require_permission("courses.assign"))):
    if body.gross_amount_minor<0 or body.platform_fee_minor<0 or body.creator_earnings_minor<0:raise HTTPException(400,"Amounts cannot be negative.")
    if body.platform_fee_minor+body.creator_earnings_minor>body.gross_amount_minor:raise HTTPException(400,"Creator earnings and platform fee exceed gross sale.")
    payload=body.model_dump()
    payload["status"]="pending"
    r=supabase.table("learnora_creator_sales").insert(payload).execute()
    if not r.data:raise HTTPException(500,"Unable to record creator sale.")
    sale=r.data[0]
    supabase.table("learnora_creator_ledger").insert({"creator_id":body.creator_id,"sale_id":sale["id"],"entry_type":"sale","amount_minor":body.creator_earnings_minor,"currency":body.currency,"available_at":None}).execute()
    supabase.table("learnora_creator_ledger").insert({"creator_id":body.creator_id,"sale_id":sale["id"],"entry_type":"platform_fee","amount_minor":body.platform_fee_minor,"currency":body.currency}).execute()
    return {"success":True,"sale":sale}

@router.post("/sales/{sale_id}/release")
def release_sale(sale_id:str,context:PermissionContext=Depends(require_permission("courses.assign"))):
    sale=supabase.table("learnora_creator_sales").select("*").eq("id",sale_id).limit(1).execute()
    if not sale.data:raise HTTPException(404,"Sale not found.")
    if sale.data[0]["status"]!="pending":raise HTTPException(409,"Sale is not pending.")
    now=datetime.now(timezone.utc).isoformat()
    r=supabase.table("learnora_creator_sales").update({"status":"available","available_at":now}).eq("id",sale_id).execute()
    supabase.table("learnora_creator_ledger").update({"available_at":now}).eq("sale_id",sale_id).eq("entry_type","sale").execute()
    return {"success":True,"sale":r.data[0] if r.data else None}

@router.post("/payouts",status_code=201)
def request_payout(body:PayoutIn,user:CurrentUser=Depends(get_current_user)):
    if body.amount_minor<=0:raise HTTPException(400,"Payout amount must be positive.")
    creator=creator_for_user(user.id)
    ledger=supabase.table("learnora_creator_ledger").select("entry_type,amount_minor,available_at").eq("creator_id",creator["id"]).execute()
    now=datetime.now(timezone.utc)
    earned=0
    paid_out=0
    reserved=0
    for entry in ledger.data or []:
        amount=int(entry.get("amount_minor") or 0)
        available_at=entry.get("available_at")
        ready=not available_at
        if available_at:
            try: ready=datetime.fromisoformat(str(available_at).replace("Z","+00:00"))<=now
            except ValueError: ready=False
        if entry["entry_type"]=="sale" and ready: earned+=amount
        elif entry["entry_type"]=="refund": earned-=amount
        elif entry["entry_type"]=="payout": paid_out+=amount
    pending=supabase.table("learnora_creator_payouts").select("amount_minor").eq("creator_id",creator["id"]).in_("status",["requested","processing"]).execute()
    reserved=sum(int(x.get("amount_minor") or 0) for x in pending.data or [])
    available_total=max(0,earned-paid_out-reserved)
    if body.amount_minor>available_total:raise HTTPException(409,"Requested payout exceeds available creator earnings.")
    r=supabase.table("learnora_creator_payouts").insert({"creator_id":creator["id"],**body.model_dump(),"status":"requested"}).execute()
    if not r.data:raise HTTPException(500,"Unable to request payout.")
    return {"success":True,"payout":r.data[0]}

@router.get("/payouts")
def payouts(user:CurrentUser=Depends(get_current_user)):
    creator=creator_for_user(user.id)
    r=supabase.table("learnora_creator_payouts").select("*").eq("creator_id",creator["id"]).order("requested_at",desc=True).execute()
    return {"success":True,"payouts":r.data or []}

@router.post("/admin/payouts/{payout_id}/process")
def process_payout(payout_id:str,status:str,context:PermissionContext=Depends(require_permission("users.update"))):
    if status not in {"processing","paid","failed","cancelled"}:raise HTTPException(400,"Invalid payout status.")
    current=supabase.table("learnora_creator_payouts").select("*").eq("id",payout_id).limit(1).execute()
    if not current.data:raise HTTPException(404,"Payout not found.")
    if current.data[0]["status"]=="paid":raise HTTPException(409,"Payout is already paid.")
    r=supabase.table("learnora_creator_payouts").update({"status":status,"processed_at":datetime.now(timezone.utc).isoformat() if status in {"paid","failed","cancelled"} else None}).eq("id",payout_id).execute()
    if not r.data:raise HTTPException(404,"Payout not found.")
    if status=="paid":
        p=r.data[0]
        supabase.table("learnora_creator_ledger").insert({"creator_id":p["creator_id"],"entry_type":"payout","amount_minor":p["amount_minor"],"currency":p["currency"]}).execute()
    return {"success":True,"payout":r.data[0]}
