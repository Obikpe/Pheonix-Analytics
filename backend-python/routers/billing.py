"""Billing - Paystack first, then register."""
import os
import time
import hashlib
import hmac
import httpx
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel

from .auth import db, make_token, allowed_for, norm_email, hash_password, check_password_rules, _env_accounts

router = APIRouter()
PAYSTACK_BASE = "https://api.paystack.co"

def get_secret():
    raw = os.getenv("NEXT_PUBLIC_PAYSTACK_SECRET_KEY", "") or ""
    s = raw.strip().strip('"').strip("'")
    if not s:
        raise HTTPException(500, "PAYSTACK_SECRET_KEY missing in backend .env - set sk_test_ or sk_live_ and restart uvicorn")
    return s

class VerifyAndRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    reference: str
    billing_interval: Optional[str] = "monthly"
    region: Optional[str] = "NG"
    plan_code: Optional[str] = None

class VerifyRequest(BaseModel):
    reference: str

@router.post("/verify-and-register")
def verify_and_register(body: VerifyAndRegisterRequest):
    secret = get_secret()
    email = norm_email(body.email)
    check_password_rules(body.password)
    name = (body.name or "").strip()[:100]

    if email in _env_accounts():
        raise HTTPException(400, "Email already registered")

    # 1. Verify Paystack reference BEFORE any DB write
    headers = {"Authorization": f"Bearer {secret}"}
    try:
        r = httpx.get(f"{PAYSTACK_BASE}/transaction/verify/{body.reference}", headers=headers, timeout=20)
        r.raise_for_status()
        res = r.json()
    except Exception as e:
        raise HTTPException(502, f"Paystack verification failed: {e}")

    if not res.get("status") or res["data"]["status"] != "success":
        raise HTTPException(402, "Payment not successful - verification failed")

    data = res["data"]
    paystack_email = norm_email(data["customer"]["email"])
    if paystack_email != email:
        # allow but warn - paystack email must match registration email
        # for strictness you can enforce: raise HTTPException(400, "Email mismatch")
        pass

    if data["amount"] < 50:  # basic sanity - prevent 0 amount
        raise HTTPException(402, "Invalid payment amount")

    customer_code = data["customer"].get("customer_code")
    subscription_code = data.get("subscription") or data.get("plan") or body.plan_code

    # 2. Only now create ACTIVE user
    with db() as c:
        existing = c.execute("SELECT id, sub_status FROM users WHERE email=?", (email,)).fetchone()
        if existing:
            if existing["sub_status"] in ("active", "trialing"):
                raise HTTPException(400, "Email already registered and active - please login")
            # pending exists -> upgrade to active
            c.execute(
                "UPDATE users SET password=?, name=?, sub_status='active', paystack_customer_code=?, paystack_subscription_code=?, billing_interval=?, region=?, trial_ends_at=?, created_at=CASE WHEN created_at=0 THEN ? ELSE created_at END WHERE email=?",
                (hash_password(body.password), name, customer_code, subscription_code, body.billing_interval, body.region, int(time.time()) + 30*86400, int(time.time()), email)
            )
            row = c.execute("SELECT role FROM users WHERE email=?", (email,)).fetchone()
            role = row["role"] if row else "normal"
        else:
            c.execute(
                "INSERT INTO users (email, password, role, name, sub_status, paystack_customer_code, paystack_subscription_code, billing_interval, region, trial_ends_at, created_at) VALUES (?,?,?,?, 'active',?,?,?,?,?,?)",
                (email, hash_password(body.password), "normal", name, customer_code, subscription_code, body.billing_interval, body.region, int(time.time()) + 30*86400, int(time.time()))
            )
            role = "normal"

    token = make_token(email, role)
    return {
        "ok": True,
        "access_token": token,
        "email": email,
        "role": role,
        "subscription_status": "active",
        "allowed": allowed_for(role)
    }

@router.post("/verify")
def verify_only(body: VerifyRequest):
    # kept for callback page if you use redirect flow later
    secret = get_secret()
    headers = {"Authorization": f"Bearer {secret}"}
    r = httpx.get(f"{PAYSTACK_BASE}/transaction/verify/{body.reference}", headers=headers, timeout=20)
    res = r.json()
    if not res.get("status") or res["data"]["status"] != "success":
        raise HTTPException(402, "Not successful")
    return {"ok": True, "data": res["data"]}

@router.post("/webhook")
async def webhook(request: Request, x_paystack_signature: str = Header(None)):
    secret = get_secret()
    body = await request.body()
    expected = hmac.new(secret.encode(), body, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(expected, x_paystack_signature or ""):
        raise HTTPException(400, "Invalid signature")
    event = await request.json()
    return {"ok": True, "event": event.get("event")}
