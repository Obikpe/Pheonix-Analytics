"""Learnora commercial, organisation requests, contracts and entitlements API."""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .permissions import PermissionContext, require_permission
from .auth import supabase
from services.capacity import count_org

router = APIRouter(
    prefix="/api/commercial",
    tags=["Commercial"],
)


class OrganisationRequestIn(BaseModel):
    organisation_name: str = Field(..., min_length=2, max_length=200)
    contact_name: str = Field(..., min_length=2, max_length=150)
    email: str
    phone: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    organisation_type: Optional[str] = None
    request_type: str
    organisation_size: Optional[int] = Field(default=None, ge=1)
    expected_learners: Optional[int] = Field(default=None, ge=0)
    expected_instructors: Optional[int] = Field(default=None, ge=0)
    expected_teams: Optional[int] = Field(default=None, ge=0)
    expected_cohorts: Optional[int] = Field(default=None, ge=0)
    duration: Optional[str] = None
    requirements: list[str] = Field(default_factory=list)
    notes: Optional[str] = None


class RequestStatusIn(BaseModel):
    status: str


class ContractIn(BaseModel):
    organisation_id: str
    request_id: Optional[str] = None
    contract_number: str
    currency: str = "NGN"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    commercial_terms: Optional[str] = None
    document_url: Optional[str] = None


class EntitlementIn(BaseModel):
    entitlement_key: str
    limit_value: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = None
    enabled: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)


def _scope(
    context: PermissionContext,
    organisation_id: str,
):
    if context.is_platform_admin:
        return

    if (
        not context.organisation_id
        or str(context.organisation_id) != str(organisation_id)
    ):
        raise HTTPException(
            403,
            "Organisation access denied.",
        )


def _active_contract(organisation_id: str):
    result = (
        supabase
        .table("learnora_contracts")
        .select("*")
        .eq("organisation_id", organisation_id)
        .in_("status", ["signed", "active", "expiring"])
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def _contract(contract_id: str):
    result = (
        supabase
        .table("learnora_contracts")
        .select("*")
        .eq("id", contract_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


@router.post("/organisation-requests", status_code=201)
def create_request(body: OrganisationRequestIn):
    result = (
        supabase
        .table("learnora_organisation_requests")
        .insert({
            **body.model_dump(),
            "status": "submitted",
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(
            500,
            "Unable to create organisation request.",
        )
    return {
        "success": True,
        "request": result.data[0],
    }


@router.get("/organisation-requests")
def list_requests(
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    query = (
        supabase
        .table("learnora_organisation_requests")
        .select("*")
        .order("created_at", desc=True)
    )

    if not context.is_platform_admin:
        if not context.organisation_id:
            raise HTTPException(
                403,
                "No organisation context is available.",
            )
        query = query.eq(
            "organisation_id",
            context.organisation_id,
        )

    result = query.execute()
    return {
        "success": True,
        "requests": result.data or [],
    }


@router.patch("/organisation-requests/{request_id}")
def update_request(
    request_id: str,
    body: RequestStatusIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    allowed = {
        "submitted",
        "under_review",
        "discussion",
        "contract_preparation",
        "contract_sent",
        "signed",
        "pending_approval",
        "active",
        "declined",
        "closed",
    }

    if body.status not in allowed:
        raise HTTPException(
            400,
            "Invalid request status.",
        )

    request_row = (
        supabase
        .table("learnora_organisation_requests")
        .select("id,organisation_id")
        .eq("id", request_id)
        .limit(1)
        .execute()
    )
    if not request_row.data:
        raise HTTPException(
            404,
            "Organisation request not found.",
        )

    oid = request_row.data[0].get("organisation_id")
    if oid:
        _scope(context, str(oid))
    elif not context.is_platform_admin:
        raise HTTPException(
            403,
            "Only platform administrators can manage unlinked requests.",
        )

    if body.status == "active":
        if not oid:
            raise HTTPException(
                409,
                "An organisation must be linked before activation.",
            )
        if not _active_contract(str(oid)):
            raise HTTPException(
                409,
                "An active or signed contract is required before activation.",
            )

    result = (
        supabase
        .table("learnora_organisation_requests")
        .update({"status": body.status})
        .eq("id", request_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            404,
            "Organisation request not found.",
        )

    return {
        "success": True,
        "request": result.data[0],
    }


@router.post("/contracts", status_code=201)
def create_contract(
    body: ContractIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    _scope(context, body.organisation_id)

    organisation = (
        supabase
        .table("organisations")
        .select("id,is_active")
        .eq("id", body.organisation_id)
        .limit(1)
        .execute()
    )
    if not organisation.data:
        raise HTTPException(
            404,
            "Organisation not found.",
        )
    if not organisation.data[0].get("is_active"):
        raise HTTPException(
            409,
            "Cannot create a contract for an inactive organisation.",
        )

    result = (
        supabase
        .table("learnora_contracts")
        .insert({
            **body.model_dump(),
            "created_by": context.user_id,
        })
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to create contract.",
        )

    return {
        "success": True,
        "contract": result.data[0],
    }


@router.get("/organisations/{organisation_id}/contract")
def current_contract(
    organisation_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    _scope(context, organisation_id)
    contract = _active_contract(organisation_id)
    return {
        "success": True,
        "contract": contract,
    }


@router.post(
    "/contracts/{contract_id}/entitlements",
    status_code=201,
)
def add_entitlement(
    contract_id: str,
    body: EntitlementIn,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    contract = _contract(contract_id)
    if not contract:
        raise HTTPException(
            404,
            "Contract not found.",
        )

    _scope(context, str(contract["organisation_id"]))

    result = (
        supabase
        .table("learnora_contract_entitlements")
        .upsert(
            {
                "contract_id": contract_id,
                **body.model_dump(),
            },
            on_conflict="contract_id,entitlement_key",
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            500,
            "Unable to save entitlement.",
        )

    return {
        "success": True,
        "entitlement": result.data[0],
    }


@router.get("/organisations/{organisation_id}/capacity")
def capacity(
    organisation_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    _scope(context, organisation_id)

    contract = _active_contract(organisation_id)
    if not contract:
        return {
            "success": True,
            "contract": None,
            "capacity": [],
        }

    entitlements = (
        supabase
        .table("learnora_contract_entitlements")
        .select("*")
        .eq("contract_id", contract["id"])
        .execute()
    )

    usage = []
    for entitlement in entitlements.data or []:
        key = entitlement["entitlement_key"]
        limit = entitlement.get("limit_value")
        used = count_org(
            organisation_id,
            key,
        )

        usage.append({
            "entitlement": entitlement,
            "used": used,
            "remaining": (
                None
                if limit is None
                else max(0, limit - used)
            ),
        })

    return {
        "success": True,
        "contract": contract,
        "capacity": usage,
    }
