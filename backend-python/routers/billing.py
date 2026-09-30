"""Billing - Paystack first, then register."""
import os
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .auth import supabase, make_token, allowed_for, norm_email, hash_password, check_password_rules, _env_accounts

router = APIRouter()
log = logging.getLogger("billing")
PAYSTACK_BASE = "https://api.paystack.co"

# (currency, amount in kobo/cents). Must match your Paystack plans and the frontend PRICING.
ALLOWED_CHARGES = {
    ("NGN", 1200000), ("NGN", 12000000),
    ("USD", 1000), ("USD", 10000),
    ("USD", 1500), ("USD", 15000),
}

def get_secret() -> str:
    raw = os.getenv("PAYSTACK_SECRET_KEY", "") or ""
    s = raw.strip().strip('"').strip("'")
    if not s:
        raise HTTPException(500, "Payments are not configured on the server")
    return s

class VerifyAndRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    reference: str
    billing_interval: Optional[str] = "monthly"
    region: Optional[str] = "NG"
    plan_code: Optional[str] = None

@router.post("/verify-and-register")
def verify_and_register(body: VerifyAndRegisterRequest):
    secret = get_secret()
    email = norm_email(body.email)
    check_password_rules(body.password)
    name = (body.name or "").strip()[:100] or None

    if email in _env_accounts():
        raise HTTPException(400, "Email already registered")

    # 1. Verify the Paystack reference BEFORE any DB write
    try:
        r = httpx.get(
            f"{PAYSTACK_BASE}/transaction/verify/{body.reference}",
            headers={"Authorization": f"Bearer {secret}"},
            timeout=20,
        )
        r.raise_for_status()
        res = r.json()
    except Exception:
        log.exception("Paystack verification failed")
        raise HTTPException(502, "Paystack verification failed")

    data = res.get("data") or {}
    if not res.get("status") or data.get("status") != "success":
        raise HTTPException(402, "Payment not successful - verification failed")

    customer = data.get("customer") or {}
    if norm_email(customer.get("email", "")) != email:
        raise HTTPException(400, "Payment email does not match the registration email")

    if (data.get("currency"), data.get("amount")) not in ALLOWED_CHARGES:
        raise HTTPException(402, "Unexpected payment amount")

    reference = data.get("reference") or body.reference

    # 2. Each payment reference can only be used once
    used = supabase.table("users").select("id").eq("paystack_reference", reference).execute().data
    if used:
        raise HTTPException(400, "This payment has already been used")

    fields = {
        "hashed_password": hash_password(body.password),
        "name": name,
        "sub_status": "active",
        "is_paid": True,
        "subscription_tier": "paid",
        "paystack_customer_code": customer.get("customer_code"),
        "paystack_reference": reference,
        "billing_interval": body.billing_interval,
        "region": body.region,
    }

    # 3. Only now create or upgrade the user
    try:
        existing = supabase.table("users").select("id, sub_status, role").eq("email", email).execute().data
        if existing:
            row = existing[0]
            if row.get("sub_status") in ("active", "trialing"):
                raise HTTPException(400, "Email already registered and active - please login")
            supabase.table("users").update(fields).eq("id", row["id"]).execute()
            role = row.get("role") or "normal"
        else:
            supabase.table("users").insert({
                **fields,
                "email": email,
                "role": "normal",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
            role = "normal"
    except HTTPException:
        raise
    except Exception:
        log.exception("Account setup failed after verified payment %s", reference)
        raise HTTPException(500, "Account setup failed")

    return {
        "ok": True,
        "access_token": make_token(email, role),
        "email": email,
        "role": role,
        "subscription_status": "active",
        "allowed": allowed_for(role),
    }