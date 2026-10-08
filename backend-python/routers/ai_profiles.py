from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .internal_auth import InternalStaffContext, require_internal_permission
from .auth import supabase
from services.ai_gateway import provider_configuration, generate as generate_llm, _api_key

router = APIRouter(prefix="/api/internal/ai", tags=["Internal AI"])

def _staff(permission: str):
    return Depends(require_internal_permission(permission))

PROFILE_KEYS = {
    "tutor", "coach", "practice", "project", "instructor",
    "organisation", "contract_drafting", "content_generation",
    "advanced_reasoning",
}

SUPPORTED_PROVIDERS = {"openrouter"}

class ProfileUpdateIn(BaseModel):
    provider_key: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=200)
    fallback_provider_key: str | None = Field(default=None, max_length=100)
    fallback_model: str | None = Field(default=None, max_length=200)
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_output_tokens: int | None = Field(default=None, ge=100, le=16000)
    enabled: bool | None = None

def _validate_profile(profile: dict) -> list[str]:
    errors = []
    provider = (profile.get("provider_key") or "").strip()
    model = (profile.get("model") or "").strip()
    fallback_provider = (profile.get("fallback_provider_key") or "").strip()
    fallback_model = (profile.get("fallback_model") or "").strip()

    if provider not in SUPPORTED_PROVIDERS:
        errors.append(f"Unsupported provider: {provider or 'missing'}.")
    if not model:
        errors.append("Primary model is required.")
    if fallback_model and not fallback_provider:
        errors.append("Fallback provider is required when a fallback model is set.")
    if fallback_provider and fallback_provider not in SUPPORTED_PROVIDERS:
        errors.append(f"Unsupported fallback provider: {fallback_provider}.")
    if fallback_provider and not fallback_model:
        errors.append("Fallback model is required when a fallback provider is set.")

    temperature = profile.get("temperature")
    if temperature is not None and not 0 <= float(temperature) <= 2:
        errors.append("Temperature must be between 0 and 2.")

    max_tokens = profile.get("max_output_tokens")
    if max_tokens is not None and not 100 <= int(max_tokens) <= 16000:
        errors.append("Max output tokens must be between 100 and 16000.")

    return errors

@router.get("/profiles")
def profiles(staff: InternalStaffContext = _staff("ai.manage")):
    result = supabase.table("learnora_ai_profiles").select(
        "id,profile_key,display_name,description,provider_key,model,"
        "fallback_provider_key,fallback_model,temperature,max_output_tokens,"
        "enabled,config,created_at,updated_at"
    ).order("profile_key").execute()

    rows = result.data or []
    output = []
    for row in rows:
        config = provider_configuration(row["profile_key"])
        provider_key = config["provider_key"]
        output.append({
            **row,
            "validation_errors": _validate_profile(row),
            "provider_supported": provider_key in SUPPORTED_PROVIDERS,
            "provider_configured": bool(_api_key(provider_key)),
        })

    return {"success": True, "profiles": output}

@router.patch("/profiles/{profile_key}")
def update_profile(
    profile_key: str,
    payload: ProfileUpdateIn,
    staff: InternalStaffContext = _staff("ai.manage"),
):
    if profile_key not in PROFILE_KEYS:
        raise HTTPException(404, "Unknown AI profile.")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No profile changes supplied.")

    if "provider_key" in updates and updates["provider_key"] not in SUPPORTED_PROVIDERS:
        raise HTTPException(400, "Unsupported AI provider.")

    if "fallback_provider_key" in updates and updates["fallback_provider_key"] not in (None, "", *SUPPORTED_PROVIDERS):
        raise HTTPException(400, "Unsupported fallback AI provider.")

    result = (
        supabase.table("learnora_ai_profiles")
        .update(updates)
        .eq("profile_key", profile_key)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "AI profile not found.")

    profile = result.data[0]
    errors = _validate_profile(profile)
    if errors:
        raise HTTPException(400, "; ".join(errors))

    return {"success": True, "profile": profile}

@router.post("/profiles/{profile_key}/test")
async def test_profile(
    profile_key: str,
    staff: InternalStaffContext = _staff("ai.manage"),
):
    if profile_key not in PROFILE_KEYS:
        raise HTTPException(404, "Unknown AI profile.")

    row_result = (
        supabase.table("learnora_ai_profiles")
        .select(
            "profile_key,display_name,provider_key,model,fallback_provider_key,"
            "fallback_model,temperature,max_output_tokens,enabled"
        )
        .eq("profile_key", profile_key)
        .limit(1)
        .execute()
    )
    if not row_result.data:
        raise HTTPException(404, "AI profile not found.")

    profile = row_result.data[0]
    errors = _validate_profile(profile)
    if errors:
        return {
            "success": False,
            "status": "invalid_configuration",
            "profile_key": profile_key,
            "errors": errors,
        }

    result = await generate_llm(
        profile_key,
        [
            {
                "role": "system",
                "content": (
                    "You are performing a Learnora AI infrastructure health check. "
                    "Reply with exactly: LEARNORA_AI_OK"
                ),
            },
            {"role": "user", "content": "Health check."},
        ],
        max_output_tokens=20,
        temperature=0,
        title="Learnora AI Operations Health Check",
        timeout=30,
    )

    return {
        "success": result.get("status") == "success",
        "status": result.get("status"),
        "profile_key": profile_key,
        "provider": result.get("provider"),
        "model": result.get("model"),
        "latency_ms": result.get("latency_ms"),
        "fallback_used": bool(result.get("fallback_used")),
        "fallback_reason": result.get("fallback_reason"),
        "error": result.get("error"),
        "configured": bool(_api_key(profile.get("provider_key") or "")),
    }
