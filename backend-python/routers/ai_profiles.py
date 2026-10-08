from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from .internal_auth import InternalStaffContext, require_internal_permission
from .auth import supabase

router = APIRouter(prefix="/api/internal/ai", tags=["Internal AI"])

def _staff(permission: str):
    return Depends(require_internal_permission(permission))

class ProfileUpdateIn(BaseModel):
    model: str | None = Field(default=None, min_length=1, max_length=200)
    fallback_provider_key: str | None = Field(default=None, max_length=100)
    fallback_model: str | None = Field(default=None, max_length=200)
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_output_tokens: int | None = Field(default=None, ge=100, le=16000)
    enabled: bool | None = None

@router.get("/profiles")
def profiles(staff: InternalStaffContext = _staff("ai.manage")):
    result = supabase.table("learnora_ai_profiles").select(
        "id,profile_key,display_name,description,provider_key,model,"
        "fallback_provider_key,fallback_model,temperature,max_output_tokens,"
        "enabled,config,created_at,updated_at"
    ).order("profile_key").execute()
    return {"success": True, "profiles": result.data or []}

@router.patch("/profiles/{profile_key}")
def update_profile(
    profile_key: str,
    payload: ProfileUpdateIn,
    staff: InternalStaffContext = _staff("ai.manage"),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No profile changes supplied.")

    result = (
        supabase.table("learnora_ai_profiles")
        .update(updates)
        .eq("profile_key", profile_key)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "AI profile not found.")
    return {"success": True, "profile": result.data[0]}
