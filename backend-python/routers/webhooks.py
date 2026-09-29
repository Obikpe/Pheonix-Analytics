import hashlib, hmac, os, json
from fastapi import APIRouter, Request, HTTPException
from routers.auth import supabase

router = APIRouter()

@router.post("/paystack")
async def paystack_webhook(request: Request):
    raw = await request.body()  # must be the raw bytes, not parsed JSON
    secret = os.getenv("PAYSTACK_SECRET_KEY", "")
    expected = hmac.new(secret.encode(), raw, hashlib.sha512).hexdigest()
    sig = request.headers.get("x-paystack-signature", "")
    if not secret or not hmac.compare_digest(sig, expected):
        raise HTTPException(401, "Invalid signature")

    event = json.loads(raw)
    etype = event.get("event")
    email = ((event.get("data") or {}).get("customer") or {}).get("email", "").lower().strip()

    if email:
        if etype in ("charge.success", "subscription.create"):
            supabase.table("users").update(
                {"sub_status": "active", "is_paid": True}).eq("email", email).execute()
        elif etype in ("subscription.disable", "invoice.payment_failed"):
            supabase.table("users").update(
                {"sub_status": "canceled", "is_paid": False}).eq("email", email).execute()
    return {"received": True}