"""Public, deliberately minimal discovery endpoints for Learnora.

Only approved creator accounts are listed. Organisations must explicitly opt
in through settings.public_directory=true; active status alone is not consent
to be discoverable.
"""
from fastapi import APIRouter

from .auth import supabase

router = APIRouter(prefix="/api/public", tags=["Public discovery"])


@router.get("/tutors")
def public_tutors():
    result = (
        supabase
        .table("learnora_creator_accounts")
        .select("id,display_name,bio,created_at")
        .eq("status", "approved")
        .order("display_name")
        .limit(100)
        .execute()
    )
    return {"success": True, "tutors": result.data or []}


@router.get("/organisations")
def public_organisations():
    result = (
        supabase
        .table("organisations")
        .select(
            "id,name,slug,organisation_type,description,logo_url,"
            "brand_primary,brand_secondary,template"
        )
        .eq("is_active", True)
        .contains("settings", {"public_directory": True})
        .order("name")
        .limit(100)
        .execute()
    )
    return {"success": True, "organisations": result.data or []}
