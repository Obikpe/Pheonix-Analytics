"""Creator marketplace settlement and payout workflow."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, get_current_user, supabase
from .permissions import PermissionContext, require_permission

router = APIRouter(
    prefix="/api/creator-finance",
    tags=["Creator Finance"],
)


class SaleIn(BaseModel):
    creator_id: str
    buyer_user_id: str | None = None
    course_id: str
    gross_amount_minor: int = Field(..., ge=0)
    currency: str = Field(..., min_length=3, max_length=10)
    platform_fee_minor: int = Field(..., ge=0)
    creator_earnings_minor: int = Field(..., ge=0)
    provider_reference: str | None = None


class PayoutIn(BaseModel):
    amount_minor: int = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=10)


def creator_for_user(uid):
    result = (
        supabase
        .table("learnora_creator_accounts")
        .select("id,status")
        .eq("user_id", uid)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Creator account not found.")
    if result.data[0]["status"] != "approved":
        raise HTTPException(403, "Creator account is not active.")
    return result.data[0]


def _get_creator(creator_id: str):
    result = (
        supabase
        .table("learnora_creator_accounts")
        .select("id,status")
        .eq("id", creator_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Creator account not found.")
    if result.data[0]["status"] != "approved":
        raise HTTPException(409, "Creator account is not approved.")
    return result.data[0]


@router.post("/sales", status_code=201)
def record_sale(
    body: SaleIn,
    context: PermissionContext = Depends(
        require_permission("courses.assign")
    ),
):
    if (
        body.platform_fee_minor
        + body.creator_earnings_minor
        > body.gross_amount_minor
    ):
        raise HTTPException(
            400,
            "Creator earnings and platform fee exceed gross sale.",
        )

    creator = _get_creator(body.creator_id)

    course = (
        supabase
        .table("learnora_courses")
        .select("id,creator_id,status,ownership")
        .eq("id", body.course_id)
        .limit(1)
        .execute()
    )
    if not course.data:
        raise HTTPException(404, "Course not found.")

    course_row = course.data[0]
    if (
        course_row.get("ownership") != "creator"
        or str(course_row.get("creator_id")) != str(creator["id"])
    ):
        raise HTTPException(
            409,
            "The course does not belong to the supplied creator.",
        )
    if course_row.get("status") == "archived":
        raise HTTPException(409, "Archived courses cannot receive sales.")

    if body.buyer_user_id:
        buyer = (
            supabase
            .table("users")
            .select("id")
            .eq("id", body.buyer_user_id)
            .limit(1)
            .execute()
        )
        if not buyer.data:
            raise HTTPException(404, "Buyer account not found.")

    payload = body.model_dump()
    payload["currency"] = body.currency.upper()
    payload["status"] = "pending"

    result = (
        supabase
        .table("learnora_creator_sales")
        .insert(payload)
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to record creator sale.")

    sale = result.data[0]

    ledger_sale = (
        supabase
        .table("learnora_creator_ledger")
        .insert({
            "creator_id": body.creator_id,
            "sale_id": sale["id"],
            "entry_type": "sale",
            "amount_minor": body.creator_earnings_minor,
            "currency": body.currency.upper(),
            "available_at": None,
        })
        .execute()
    )
    if not ledger_sale.data:
        raise HTTPException(500, "Unable to create creator sale ledger entry.")

    ledger_fee = (
        supabase
        .table("learnora_creator_ledger")
        .insert({
            "creator_id": body.creator_id,
            "sale_id": sale["id"],
            "entry_type": "platform_fee",
            "amount_minor": body.platform_fee_minor,
            "currency": body.currency.upper(),
            "available_at": None,
        })
        .execute()
    )
    if not ledger_fee.data:
        raise HTTPException(500, "Unable to create platform fee ledger entry.")

    return {"success": True, "sale": sale}


@router.post("/sales/{sale_id}/release")
def release_sale(
    sale_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.assign")
    ),
):
    sale = (
        supabase
        .table("learnora_creator_sales")
        .select("*")
        .eq("id", sale_id)
        .limit(1)
        .execute()
    )
    if not sale.data:
        raise HTTPException(404, "Sale not found.")

    row = sale.data[0]
    if row["status"] != "pending":
        raise HTTPException(409, "Sale is not pending.")

    now = datetime.now(timezone.utc).isoformat()

    updated = (
        supabase
        .table("learnora_creator_sales")
        .update({
            "status": "available",
            "available_at": now,
        })
        .eq("id", sale_id)
        .eq("status", "pending")
        .execute()
    )
    if not updated.data:
        raise HTTPException(409, "Sale could not be released.")

    ledger = (
        supabase
        .table("learnora_creator_ledger")
        .update({"available_at": now})
        .eq("sale_id", sale_id)
        .eq("entry_type", "sale")
        .execute()
    )

    return {
        "success": True,
        "sale": updated.data[0],
        "ledger": ledger.data or [],
    }


@router.post("/sales/{sale_id}/refund")
def refund_sale(
    sale_id: str,
    context: PermissionContext = Depends(
        require_permission("courses.assign")
    ),
):
    sale = (
        supabase
        .table("learnora_creator_sales")
        .select("*")
        .eq("id", sale_id)
        .limit(1)
        .execute()
    )
    if not sale.data:
        raise HTTPException(404, "Sale not found.")

    row = sale.data[0]
    if row["status"] == "refunded":
        raise HTTPException(409, "Sale is already refunded.")

    now = datetime.now(timezone.utc).isoformat()

    updated = (
        supabase
        .table("learnora_creator_sales")
        .update({
            "status": "refunded",
        })
        .eq("id", sale_id)
        .neq("status", "refunded")
        .execute()
    )
    if not updated.data:
        raise HTTPException(409, "Sale could not be refunded.")

    refund = (
        supabase
        .table("learnora_creator_ledger")
        .insert({
            "creator_id": row["creator_id"],
            "sale_id": sale_id,
            "entry_type": "refund",
            "amount_minor": row["creator_earnings_minor"],
            "currency": row["currency"],
            "available_at": now,
        })
        .execute()
    )
    if not refund.data:
        raise HTTPException(500, "Unable to create refund ledger entry.")

    return {
        "success": True,
        "sale": updated.data[0],
        "refund_ledger": refund.data[0],
    }


@router.post("/payouts", status_code=201)
def request_payout(
    body: PayoutIn,
    user: CurrentUser = Depends(get_current_user),
):
    currency = body.currency.upper()
    creator = creator_for_user(user.id)

    ledger = (
        supabase
        .table("learnora_creator_ledger")
        .select("entry_type,amount_minor,available_at,currency")
        .eq("creator_id", creator["id"])
        .eq("currency", currency)
        .execute()
    )

    now = datetime.now(timezone.utc)
    earned = 0
    paid_out = 0

    for entry in ledger.data or []:
        amount = int(entry.get("amount_minor") or 0)
        available_at = entry.get("available_at")

        ready = False
        if available_at:
            try:
                ready = (
                    datetime.fromisoformat(
                        str(available_at).replace("Z", "+00:00")
                    ).astimezone(timezone.utc)
                    <= now
                )
            except ValueError:
                ready = False

        if entry["entry_type"] == "sale" and ready:
            earned += amount
        elif entry["entry_type"] == "refund" and ready:
            earned -= amount
        elif entry["entry_type"] == "payout":
            paid_out += amount

    pending = (
        supabase
        .table("learnora_creator_payouts")
        .select("amount_minor")
        .eq("creator_id", creator["id"])
        .eq("currency", currency)
        .in_("status", ["requested", "processing"])
        .execute()
    )
    reserved = sum(
        int(row.get("amount_minor") or 0)
        for row in (pending.data or [])
    )

    available_total = max(
        0,
        earned - paid_out - reserved,
    )

    if body.amount_minor > available_total:
        raise HTTPException(
            409,
            "Requested payout exceeds available creator earnings.",
        )

    result = (
        supabase
        .table("learnora_creator_payouts")
        .insert({
            "creator_id": creator["id"],
            "amount_minor": body.amount_minor,
            "currency": currency,
            "status": "requested",
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(500, "Unable to request payout.")

    return {
        "success": True,
        "payout": result.data[0],
        "available_after_request": available_total - body.amount_minor,
    }


@router.get("/payouts")
def payouts(
    user: CurrentUser = Depends(get_current_user),
):
    creator = creator_for_user(user.id)

    result = (
        supabase
        .table("learnora_creator_payouts")
        .select("*")
        .eq("creator_id", creator["id"])
        .order("requested_at", desc=True)
        .execute()
    )
    return {"success": True, "payouts": result.data or []}


@router.post("/admin/payouts/{payout_id}/process")
def process_payout(
    payout_id: str,
    status: str,
    context: PermissionContext = Depends(
        require_permission("users.update")
    ),
):
    if status not in {
        "processing",
        "paid",
        "failed",
        "cancelled",
    }:
        raise HTTPException(400, "Invalid payout status.")

    current = (
        supabase
        .table("learnora_creator_payouts")
        .select("*")
        .eq("id", payout_id)
        .limit(1)
        .execute()
    )
    if not current.data:
        raise HTTPException(404, "Payout not found.")

    row = current.data[0]
    if row["status"] == "paid":
        raise HTTPException(409, "Payout is already paid.")

    now = datetime.now(timezone.utc).isoformat()

    result = (
        supabase
        .table("learnora_creator_payouts")
        .update({
            "status": status,
            "processed_at": now
            if status in {"paid", "failed", "cancelled"}
            else None,
        })
        .eq("id", payout_id)
        .eq("status", row["status"])
        .execute()
    )
    if not result.data:
        raise HTTPException(409, "Payout state changed; retry with the current state.")

    if status == "paid":
        payout = result.data[0]
        ledger = (
            supabase
            .table("learnora_creator_ledger")
            .insert({
                "creator_id": payout["creator_id"],
                "entry_type": "payout",
                "amount_minor": payout["amount_minor"],
                "currency": payout["currency"],
                "available_at": now,
                "metadata": {"payout_id": payout_id},
            })
            .execute()
        )
        if not ledger.data:
            raise HTTPException(500, "Unable to create payout ledger entry.")

    return {"success": True, "payout": result.data[0]}
