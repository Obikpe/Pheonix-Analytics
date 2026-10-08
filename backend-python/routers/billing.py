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
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .auth import (
    allowed_for,
    make_token,
    norm_email,
    supabase,
)

router = APIRouter()
log = logging.getLogger("billing")

PAYSTACK_BASE = "https://api.paystack.co"


# ---------------------------------------------------------------------------
# PAYSTACK CONFIGURATION
# ---------------------------------------------------------------------------

# Paystack amounts are expressed in the smallest currency unit:
#
# NGN -> kobo
# USD -> cents
#
# These values must match the prices configured in Paystack
# and the prices presented by the Learnora frontend.

ALLOWED_CHARGES = {
    # NGN
    ("NGN", 1_200_000),      # ₦12,000
    ("NGN", 12_000_000),     # ₦120,000

    # USD
    ("USD", 1_000),          # $10
    ("USD", 10_000),         # $100
    ("USD", 1_500),          # $15
    ("USD", 15_000),         # $150
}


# ---------------------------------------------------------------------------
# PAYSTACK CONFIGURATION
# ---------------------------------------------------------------------------

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
    Used when an already registered Learnora learner completes payment.

    The learner must already exist in public.users and must have
    completed email verification.
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

    Payment success information supplied by the frontend is never trusted.
    Paystack is the authoritative payment source.
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

    except httpx.RequestError:
        log.exception(
            "Network error while contacting Paystack"
        )

        raise HTTPException(
            status_code=502,
            detail="Unable to contact Paystack",
        )

    except Exception:
        log.exception(
            "Unexpected error while verifying Paystack payment"
        )

        raise HTTPException(
            status_code=502,
            detail="Paystack verification failed",
        )

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=502,
            detail="Invalid response from Paystack",
        )

    if not result.get("status"):
        raise HTTPException(
            status_code=502,
            detail="Paystack verification failed",
        )

    data = result.get("data") or {}

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

    currency = str(
        data.get("currency") or ""
    ).strip().upper()

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


def calculate_subscription_expiry(
    billing_interval: str,
    now: datetime,
) -> datetime:
    """
    Calculate the expiry date for a successfully activated subscription.
    """

    if billing_interval in ("yearly", "annual"):
        return now + timedelta(days=365)

    return now + timedelta(days=30)


# ---------------------------------------------------------------------------
# PAYMENT VERIFICATION / UPGRADE
# ---------------------------------------------------------------------------

@router.post("/verify-payment")
def verify_payment(body: VerifyPaymentRequest):
    """
    Verify a successful Paystack payment and upgrade an existing learner.

    This endpoint DOES NOT create accounts.

    Required flow:

        Register
            -> Verify email
            -> Start trial
            -> Pay
            -> Verify payment
            -> Activate paid membership
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
            detail=(
                "Account not found. "
                "Please register before subscribing."
            ),
        )

    user = users[0]

    # -----------------------------------------------------------------------
    # 2. Confirm this is a learner account
    # -----------------------------------------------------------------------

    role = user.get("role") or "normal"

    if role not in ("normal", "witstart"):
        raise HTTPException(
            status_code=403,
            detail=(
                "This account cannot be upgraded "
                "through learner billing"
            ),
        )

    # -----------------------------------------------------------------------
    # 3. Email verification must happen before payment activation
    # -----------------------------------------------------------------------

    if not user.get("email_verified_at"):
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before subscribing.",
        )

    # -----------------------------------------------------------------------
    # 4. Verify payment directly with Paystack
    # -----------------------------------------------------------------------

    payment = verify_paystack_transaction(
        reference=reference,
        secret=secret,
    )

    # -----------------------------------------------------------------------
    # 5. Confirm Paystack customer email matches Learnora account
    # -----------------------------------------------------------------------

    customer = payment.get("customer") or {}

    payment_email = norm_email(
        customer.get("email", "")
    )

    if payment_email != email:
        log.warning(
            "Paystack payment email mismatch: account=%s payment=%s",
            email,
            payment_email,
        )

        raise HTTPException(
            status_code=400,
            detail="Payment email does not match the Learnora account",
        )

    # -----------------------------------------------------------------------
    # 6. Confirm amount and currency
    # -----------------------------------------------------------------------

    validate_payment_amount(payment)

    # -----------------------------------------------------------------------
    # 7. Get authoritative Paystack reference
    # -----------------------------------------------------------------------

    verified_reference = (
        payment.get("reference")
        or reference
    ).strip()

    if not verified_reference:
        raise HTTPException(
            status_code=502,
            detail="Paystack returned an invalid payment reference",
        )

    # -----------------------------------------------------------------------
    # 8. Prevent reuse of a payment reference
    # -----------------------------------------------------------------------

    try:
        already_used = (
            supabase
            .table("learnora_subscriptions")
            .select(
                "id,user_id,status,provider_subscription_id"
            )
            .eq(
                "provider_subscription_id",
                verified_reference,
            )
            .limit(1)
            .execute()
            .data
            or []
        )
    except Exception:
        log.exception(
            "Failed checking subscription reference reuse"
        )
        raise HTTPException(
            status_code=500,
            detail="Unable to verify payment",
        )

    if already_used:
        existing = already_used[0]
        if str(existing.get("user_id")) != str(user.get("id")):
            raise HTTPException(
                status_code=400,
                detail="This payment has already been used",
            )

        if existing.get("status") == "active":
            raise HTTPException(
                status_code=400,
                detail="This payment has already been processed",
            )

        raise HTTPException(
            status_code=400,
            detail="This payment reference already exists",
        )

    # -----------------------------------------------------------------------
    # 9. Validate billing interval
    # -----------------------------------------------------------------------

    # -----------------------------------------------------------------------

    billing_interval = (
        body.billing_interval or "monthly"
    ).strip().lower()

    if billing_interval not in (
        "monthly",
        "yearly",
        "annual",
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid billing interval",
        )

    # Normalize annual -> yearly for database consistency.
    if billing_interval == "annual":
        billing_interval = "yearly"

    # -----------------------------------------------------------------------
    # 10. Determine subscription expiry
    # -----------------------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_at = calculate_subscription_expiry(
        billing_interval=billing_interval,
        now=now,
    )

    # -----------------------------------------------------------------------
    # 11. Prepare membership update
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
        plan_code = body.plan_code.strip()

        if plan_code:
            update_fields["paystack_plan_code"] = plan_code

    # -----------------------------------------------------------------------
    # 12. Persist the new subscription as the authoritative billing record
    # -----------------------------------------------------------------------

    try:
        supabase.table("learnora_subscriptions").update({
            "status": "cancelled",
            "cancelled_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }).eq("user_id", user["id"]).in_(
            "status", ["trialing", "active", "past_due", "paused"]
        ).execute()

        subscription = (
            supabase
            .table("learnora_subscriptions")
            .insert({
                "user_id": user["id"],
                "status": "active",
                "plan_code": body.plan_code or "paid",
                "billing_interval": billing_interval,
                "currency": str(payment.get("currency") or "").upper(),
                "amount_minor": int(payment.get("amount") or 0),
                "provider": "paystack",
                "provider_customer_id": customer.get("customer_code"),
                "provider_subscription_id": verified_reference,
                "starts_at": now.isoformat(),
                "current_period_start": now.isoformat(),
                "current_period_end": expires_at.isoformat(),
            })
            .execute()
        )

        if not subscription.data:
            raise RuntimeError("Subscription record was not created")

    except Exception:
        log.exception(
            "Failed creating authoritative Learnora subscription"
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "Payment was verified, but the subscription record "
                "could not be created."
            ),
        )

    # -----------------------------------------------------------------------
    # 13. Update the legacy learner billing fields
    # -----------------------------------------------------------------------

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
            detail=(
                "Payment was verified, but membership activation "
                "failed. Please contact support."
            ),
        )

    # -----------------------------------------------------------------------
    # 14. Issue a fresh learner JWT
    # -----------------------------------------------------------------------

    token = make_token(
        email=email,
        role=role,
        account_type="learner",
    )

    # -----------------------------------------------------------------------
    # 15. Return updated account state
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

        "billing_interval": billing_interval,
        "region": (
            body.region or "NG"
        ).strip().upper(),

        "expires_at": expires_at.isoformat(),

        "allowed": allowed_for(
            role,
            "learner",
        ),
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

    The learner then verifies their email and receives the server-side
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