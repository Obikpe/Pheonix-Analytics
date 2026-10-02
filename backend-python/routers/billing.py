"""
Billing - Paystack payment verification and subscription upgrades.

Account creation and email verification are handled by auth.py.

Flow:
    Registration
        -> Email verification
        -> 7-day server-side trial
        -> Dashboard
        -> Paystack upgrade
        -> Server-side payment verification
        -> Paid membership
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .auth import (
    supabase,
    make_token,
    allowed_for,
    norm_email,
)

router = APIRouter()
log = logging.getLogger("billing")

PAYSTACK_BASE = "https://api.paystack.co"


# ---------------------------------------------------------------------------
# PAYSTACK CONFIGURATION
# ---------------------------------------------------------------------------

# (currency, amount)
#
# NGN values are in kobo.
# USD values are in cents.
#
# These must match the prices configured in Paystack and the frontend.
ALLOWED_CHARGES = {
    ("NGN", 1200000),   # ₦12,000
    ("NGN", 12000000),  # ₦120,000

    ("USD", 1000),      # $10
    ("USD", 10000),     # $100

    ("USD", 1500),      # $15
    ("USD", 15000),     # $150
}


def get_secret() -> str:
    """
    Get and validate the Paystack secret key.
    """

    raw = os.getenv("PAYSTACK_SECRET_KEY", "") or ""

    secret = (
        raw
        .strip()
        .strip('"')
        .strip("'")
    )

    if not secret:
        raise HTTPException(
            status_code=500,
            detail="Payments are not configured on the server",
        )

    return secret


# ---------------------------------------------------------------------------
# REQUEST MODELS
# ---------------------------------------------------------------------------

class VerifyPaymentRequest(BaseModel):
    """
    Used when an already registered Learnora user completes payment.
    """

    email: str
    reference: str
    billing_interval: Optional[str] = "monthly"
    region: Optional[str] = "NG"
    plan_code: Optional[str] = None


# ---------------------------------------------------------------------------
# PAYSTACK HELPERS
# ---------------------------------------------------------------------------

def verify_paystack_transaction(
    reference: str,
    secret: str,
) -> dict:
    """
    Verify a Paystack transaction directly with Paystack.

    Never trust payment success information supplied by the frontend.
    """

    reference = (reference or "").strip()

    if not reference:
        raise HTTPException(
            status_code=400,
            detail="Payment reference is required",
        )

    try:
        response = httpx.get(
            f"{PAYSTACK_BASE}/transaction/verify/{reference}",
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )

        response.raise_for_status()
        result = response.json()

    except httpx.HTTPStatusError:
        log.exception(
            "Paystack returned an HTTP error while verifying payment"
        )
        raise HTTPException(
            status_code=502,
            detail="Paystack verification failed",
        )

    except Exception:
        log.exception(
            "Unexpected error while verifying Paystack payment"
        )
        raise HTTPException(
            status_code=502,
            detail="Paystack verification failed",
        )

    data = result.get("data") or {}

    if not result.get("status"):
        raise HTTPException(
            status_code=502,
            detail="Paystack verification failed",
        )

    if data.get("status") != "success":
        raise HTTPException(
            status_code=402,
            detail="Payment was not successful",
        )

    return data


def validate_payment_amount(data: dict) -> None:
    """
    Make sure the verified Paystack transaction matches one of the
    prices Learnora actually accepts.
    """

    currency = str(data.get("currency") or "").upper()
    amount = data.get("amount")

    if (currency, amount) not in ALLOWED_CHARGES:
        log.warning(
            "Unexpected Paystack payment amount: currency=%s amount=%s",
            currency,
            amount,
        )

        raise HTTPException(
            status_code=402,
            detail="Unexpected payment amount",
        )


# ---------------------------------------------------------------------------
# PAYMENT VERIFICATION / UPGRADE
# ---------------------------------------------------------------------------

@router.post("/verify-payment")
def verify_payment(body: VerifyPaymentRequest):
    """
    Verify a successful Paystack payment and upgrade an existing learner.

    This endpoint DOES NOT create accounts.

    The learner must already exist in public.users and must have completed
    email verification before they can be upgraded.
    """

    secret = get_secret()

    email = norm_email(body.email)
    reference = (body.reference or "").strip()

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    if not reference:
        raise HTTPException(
            status_code=400,
            detail="Payment reference is required",
        )

    # -----------------------------------------------------------------------
    # 1. Find the existing learner
    # -----------------------------------------------------------------------

    try:
        result = (
            supabase
            .table("users")
            .select(
                """
                id,
                email,
                name,
                role,
                sub_status,
                is_paid,
                subscription_tier,
                email_verified_at,
                paystack_reference,
                paystack_customer_code,
                expires_at,
                trial_ends_at
                """
            )
            .eq("email", email)
            .limit(1)
            .execute()
        )

        users = result.data or []

    except Exception:
        log.exception(
            "Failed to find learner during payment verification"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to verify account",
        )

    if not users:
        raise HTTPException(
            status_code=404,
            detail="Account not found. Please register before subscribing.",
        )

    user = users[0]

    # Only normal/witstart learner accounts should be upgraded here.
    role = user.get("role") or "normal"

    if role not in ("normal", "witstart"):
        raise HTTPException(
            status_code=403,
            detail="This account cannot be upgraded through learner billing",
        )

    # -----------------------------------------------------------------------
    # 2. Email verification must happen before payment activation
    # -----------------------------------------------------------------------

    if not user.get("email_verified_at"):
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before subscribing.",
        )

    # -----------------------------------------------------------------------
    # 3. Verify payment directly with Paystack
    # -----------------------------------------------------------------------

    payment = verify_paystack_transaction(
        reference=reference,
        secret=secret,
    )

    # -----------------------------------------------------------------------
    # 4. Confirm Paystack customer email matches Learnora account
    # -----------------------------------------------------------------------

    customer = payment.get("customer") or {}

    payment_email = norm_email(
        customer.get("email", "")
    )

    if payment_email != email:
        raise HTTPException(
            status_code=400,
            detail="Payment email does not match the Learnora account",
        )

    # -----------------------------------------------------------------------
    # 5. Confirm amount/currency
    # -----------------------------------------------------------------------

    validate_payment_amount(payment)

    # -----------------------------------------------------------------------
    # 6. Get authoritative Paystack reference
    # -----------------------------------------------------------------------

    verified_reference = (
        payment.get("reference")
        or reference
    )

    # -----------------------------------------------------------------------
    # 7. Prevent reuse of a payment reference
    # -----------------------------------------------------------------------

    try:
        already_used = (
            supabase
            .table("users")
            .select("id,email")
            .eq("paystack_reference", verified_reference)
            .limit(1)
            .execute()
            .data
            or []
        )

    except Exception:
        log.exception(
            "Failed checking Paystack reference reuse"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to verify payment",
        )

    if already_used:
        existing_id = already_used[0].get("id")

        if existing_id == user.get("id"):
            raise HTTPException(
                status_code=400,
                detail="This payment has already been processed",
            )

        raise HTTPException(
            status_code=400,
            detail="This payment has already been used",
        )

    # -----------------------------------------------------------------------
    # 8. Determine subscription expiry
    # -----------------------------------------------------------------------

    now = datetime.now(timezone.utc)

    billing_interval = (
        body.billing_interval or "monthly"
    ).strip().lower()

    if billing_interval not in ("monthly", "yearly", "annual"):
        raise HTTPException(
            status_code=400,
            detail="Invalid billing interval",
        )

    if billing_interval in ("yearly", "annual"):
        # 365 days
        from datetime import timedelta

        expires_at = now + timedelta(days=365)

    else:
        # 30-day subscription period
        from datetime import timedelta

        expires_at = now + timedelta(days=30)

    # -----------------------------------------------------------------------
    # 9. Update existing learner
    # -----------------------------------------------------------------------

    update_fields = {
        "sub_status": "active",
        "is_paid": True,
        "subscription_tier": "paid",
        "expires_at": expires_at.isoformat(),
        "paystack_customer_code": customer.get(
            "customer_code"
        ),
        "paystack_reference": verified_reference,
        "billing_interval": billing_interval,
        "region": (
            body.region or "NG"
        ).strip().upper(),
    }

    if body.plan_code:
        update_fields["paystack_plan_code"] = (
            body.plan_code.strip()
        )

    try:
        updated = (
            supabase
            .table("users")
            .update(update_fields)
            .eq("id", user["id"])
            .execute()
        )

        if not updated.data:
            raise RuntimeError(
                "No learner row was updated"
            )

    except Exception:
        log.exception(
            "Failed updating paid membership for user %s",
            user.get("id"),
        )

        raise HTTPException(
            status_code=500,
            detail="Payment was verified, but membership activation failed. Please contact support.",
        )

    # -----------------------------------------------------------------------
    # 10. Issue a fresh JWT
    # -----------------------------------------------------------------------

    token = make_token(
        email=email,
        role=role,
        account_type="learner",
    )

    # -----------------------------------------------------------------------
    # 11. Response
    # -----------------------------------------------------------------------

    return {
        "ok": True,
        "access_token": token,
        "token_type": "bearer",
        "email": email,
        "name": user.get("name"),
        "role": role,
        "account_type": "learner",
        "subscription_status": "active",
        "subscription_tier": "paid",
        "is_paid": True,
        "expires_at": expires_at.isoformat(),
        "allowed": allowed_for(role),
    }


# ---------------------------------------------------------------------------
# BACKWARD-COMPATIBILITY ROUTE
# ---------------------------------------------------------------------------

@router.post("/verify-and-register")
def verify_and_register_removed():
    """
    Registration is intentionally no longer handled by billing.

    Accounts must now be created through:

        POST /api/auth/register

    The user then verifies their email and receives the server-side
    7-day trial.

    Payment happens later through:

        POST /api/billing/verify-payment
    """

    raise HTTPException(
        status_code=410,
        detail=(
            "Payment-based registration has been removed. "
            "Please register through /api/auth/register, "
            "verify your email, and then subscribe from your dashboard."
        ),
    )