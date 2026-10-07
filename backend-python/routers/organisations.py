"""
Learnora organisation management.

This router belongs to the new multi-tenant Learnora architecture.

Important:
- Do not hard-code Witstart into this router.
- Organisation access is controlled through the new permission system.
- Legacy admin roles remain supported elsewhere while migration is in progress.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .auth import CurrentUser, supabase, log_audit_event
from .permissions import (
    PermissionContext,
    get_permission_context,
    require_permission,
)


router = APIRouter(
    prefix="/api/organisations",
    tags=["Organisations"],
)


# ---------------------------------------------------------------------------
# MODELS
# ---------------------------------------------------------------------------


class CreateOrganisation(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    slug: str = Field(..., min_length=2, max_length=100)
    organisation_type: str = Field(
        default="academy",
        min_length=2,
        max_length=50,
    )
    template: str = Field(
        default="academy",
        min_length=2,
        max_length=50,
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
    )
    logo_url: Optional[str] = Field(
        default=None,
        max_length=1000,
    )
    brand_primary: Optional[str] = Field(
        default=None,
        max_length=50,
    )
    brand_secondary: Optional[str] = Field(
        default=None,
        max_length=50,
    )


class UpdateOrganisation(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )
    slug: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100,
    )
    organisation_type: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    template: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=50,
    )
    description: Optional[str] = Field(
        default=None,
        max_length=2000,
    )
    logo_url: Optional[str] = Field(
        default=None,
        max_length=1000,
    )
    brand_primary: Optional[str] = Field(
        default=None,
        max_length=50,
    )
    brand_secondary: Optional[str] = Field(
        default=None,
        max_length=50,
    )
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------


SAFE_ORGANISATION_COLUMNS = (
    "id, name, slug, organisation_type, description, "
    "logo_url, brand_primary, brand_secondary, template, "
    "is_active, settings, created_at, updated_at"
)


def _normalise_slug(value: str) -> str:
    return (
        value.strip()
        .lower()
        .replace(" ", "-")
    )


def _get_organisation(organisation_id: str):
    response = (
        supabase
        .table("organisations")
        .select(SAFE_ORGANISATION_COLUMNS)
        .eq("id", organisation_id)
        .limit(1)
        .execute()
    )

    rows = response.data or []

    return rows[0] if rows else None


def _ensure_slug_available(
    slug: str,
    exclude_id: Optional[str] = None,
):
    query = (
        supabase
        .table("organisations")
        .select("id")
        .eq("slug", slug)
    )

    if exclude_id:
        query = query.neq("id", exclude_id)

    existing = query.limit(1).execute()

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="An organisation with this slug already exists.",
        )


# ---------------------------------------------------------------------------
# LIST ORGANISATIONS
# ---------------------------------------------------------------------------


@router.get("")
def list_organisations(
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    """
    List organisations.

    Super/platform administrators can see all organisations.

    Organisation-level users only receive their resolved organisation.
    """

    # Platform administrator:
    # return all organisations.
    if context.is_platform_admin:
        response = (
            supabase
            .table("organisations")
            .select(SAFE_ORGANISATION_COLUMNS)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "organisations": response.data or [],
        }

    # Organisation-level user:
    # return only the organisation they are authorised to access.
    if not context.organisation_id:
        raise HTTPException(
            status_code=403,
            detail="No organisation context is available.",
        )

    organisation = _get_organisation(
        str(context.organisation_id)
    )

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    return {
        "success": True,
        "organisations": [organisation],
    }


# ---------------------------------------------------------------------------
# GET ONE ORGANISATION
# ---------------------------------------------------------------------------


@router.get("/{organisation_id}")
def get_organisation(
    organisation_id: str,
    context: PermissionContext = Depends(
        require_permission("organisations.view")
    ),
):
    """
    Return one organisation.

    Platform administrators may inspect any organisation.

    Organisation-level users may inspect only their own organisation.
    """

    if not context.is_platform_admin:
        if (
            not context.organisation_id
            or str(context.organisation_id)
            != str(organisation_id)
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this organisation.",
            )

    organisation = _get_organisation(
        organisation_id
    )

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    return {
        "success": True,
        "organisation": organisation,
    }


# ---------------------------------------------------------------------------
# CREATE ORGANISATION
# ---------------------------------------------------------------------------


@router.post("", status_code=201)
def create_organisation(
    payload: CreateOrganisation,
    request: Request,
    context: PermissionContext = Depends(
        require_permission("organisations.create")
    ),
):
    """
    Create a new Learnora organisation.

    Only users with organisations.create may perform this action.
    """

    name = payload.name.strip()
    slug = _normalise_slug(payload.slug)
    organisation_type = payload.organisation_type.strip().lower()
    template = payload.template.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Organisation name is required.",
        )

    if not slug:
        raise HTTPException(
            status_code=400,
            detail="Organisation slug is required.",
        )

    _ensure_slug_available(slug)

    row = {
        "name": name,
        "slug": slug,
        "organisation_type": organisation_type,
        "template": template,
        "description": (
            payload.description.strip()
            if payload.description
            else None
        ),
        "logo_url": (
            payload.logo_url.strip()
            if payload.logo_url
            else None
        ),
        "brand_primary": (
            payload.brand_primary.strip()
            if payload.brand_primary
            else None
        ),
        "brand_secondary": (
            payload.brand_secondary.strip()
            if payload.brand_secondary
            else None
        ),
        "is_active": True,
    }

    try:
        response = (
            supabase
            .table("organisations")
            .insert(row)
            .execute()
        )
    except Exception as exc:
        print(
            f"Failed to create organisation: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create organisation.",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Organisation creation failed.",
        )

    organisation = response.data[0]

    log_audit_event(
        action="organisation_created",
        email=context.user.email,
        account_type=context.user.account_type,
        role=context.user.role,
        request=request,
        metadata={
            "organisation_id": organisation.get("id"),
            "organisation_name": organisation.get("name"),
            "organisation_slug": organisation.get("slug"),
            "created_by": context.user.email,
        },
    )

    return {
        "success": True,
        "message": "Organisation created successfully.",
        "organisation": organisation,
    }


# ---------------------------------------------------------------------------
# UPDATE ORGANISATION
# ---------------------------------------------------------------------------


@router.patch("/{organisation_id}")
def update_organisation(
    organisation_id: str,
    payload: UpdateOrganisation,
    request: Request,
    context: PermissionContext = Depends(
        require_permission("organisations.update")
    ),
):
    """
    Update an organisation.

    Platform administrators may update any organisation.

    Organisation-level users may update only their own
    organisation, subject to their organisation permissions.
    """

    if not context.is_platform_admin:
        if (
            not context.organisation_id
            or str(context.organisation_id)
            != str(organisation_id)
        ):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this organisation.",
            )

    existing = _get_organisation(
        organisation_id
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    updates = {}

    if payload.name is not None:
        name = payload.name.strip()

        if not name:
            raise HTTPException(
                status_code=400,
                detail="Organisation name cannot be empty.",
            )

        updates["name"] = name

    if payload.slug is not None:
        slug = _normalise_slug(
            payload.slug
        )

        if not slug:
            raise HTTPException(
                status_code=400,
                detail="Organisation slug cannot be empty.",
            )

        _ensure_slug_available(
            slug,
            exclude_id=organisation_id,
        )

        updates["slug"] = slug

    if payload.organisation_type is not None:
        updates["organisation_type"] = (
            payload.organisation_type
            .strip()
            .lower()
        )

    if payload.template is not None:
        updates["template"] = (
            payload.template
            .strip()
            .lower()
        )

    if payload.description is not None:
        updates["description"] = (
            payload.description.strip()
            or None
        )

    if payload.logo_url is not None:
        updates["logo_url"] = (
            payload.logo_url.strip()
            or None
        )

    if payload.brand_primary is not None:
        updates["brand_primary"] = (
            payload.brand_primary.strip()
            or None
        )

    if payload.brand_secondary is not None:
        updates["brand_secondary"] = (
            payload.brand_secondary.strip()
            or None
        )

    if payload.is_active is not None:
        updates["is_active"] = payload.is_active

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No changes supplied.",
        )

    try:
        response = (
            supabase
            .table("organisations")
            .update(updates)
            .eq("id", organisation_id)
            .execute()
        )
    except Exception as exc:
        print(
            f"Failed to update organisation: {exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update organisation.",
        )

    if not response.data:
        raise HTTPException(
            status_code=500,
            detail="Organisation update failed.",
        )

    organisation = response.data[0]

    log_audit_event(
        action="organisation_updated",
        email=context.user.email,
        account_type=context.user.account_type,
        role=context.user.role,
        request=request,
        metadata={
            "organisation_id": organisation_id,
            "changes": updates,
            "updated_by": context.user.email,
        },
    )

    return {
        "success": True,
        "message": "Organisation updated successfully.",
        "organisation": organisation,
    }