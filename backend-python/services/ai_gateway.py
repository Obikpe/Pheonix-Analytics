"""Central Learnora AI gateway.

AI features select a named profile; profiles select provider/model configuration.
Feature code must not hard-code an LLM model. This keeps model changes
configuration-only and allows different Learnora AI capabilities to use
different models later.
"""

import os
import time
from typing import Any

import httpx

from routers.auth import supabase

DEFAULT_PROVIDER = "openrouter"
DEFAULT_MODEL = "openrouter/free"
DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"


PROFILE_DEFAULTS = {
    "tutor": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1200},
    "coach": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1200},
    "practice": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1200},
    "project": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1400},
    "instructor": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1400},
    "organisation": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1400},
    "contract_drafting": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.1, "max_output_tokens": 8000},
    "content_generation": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 2000},
    "advanced_reasoning": {"provider": "openrouter", "model": "openrouter/free", "temperature": 0.2, "max_output_tokens": 2000},
}


def _profile(profile_key: str) -> dict[str, Any]:
    defaults = PROFILE_DEFAULTS.get(profile_key, PROFILE_DEFAULTS["tutor"]).copy()
    try:
        result = (
            supabase.table("learnora_ai_profiles")
            .select(
                "profile_key,provider_key,model,fallback_provider_key,"
                "fallback_model,temperature,max_output_tokens,enabled,config"
            )
            .eq("profile_key", profile_key)
            .limit(1)
            .execute()
        )
        if result.data:
            row = result.data[0]
            defaults.update({k: v for k, v in row.items() if v is not None})
    except Exception:
        pass
    return defaults


def resolve_profile(profile_key: str, model_override: str | None = None) -> dict[str, Any]:
    profile = _profile(profile_key)
    if model_override:
        profile["model"] = model_override
    return profile


def _provider(provider_key: str) -> dict[str, Any]:
    try:
        result = (
            supabase.table("learnora_ai_providers")
            .select(
                "provider_key,display_name,base_url,default_model,enabled,"
                "priority,config"
            )
            .eq("provider_key", provider_key)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]
    except Exception:
        pass

    return {
        "provider_key": provider_key,
        "base_url": DEFAULT_BASE_URL,
        "default_model": DEFAULT_MODEL,
        "enabled": True,
        "config": {},
    }


def provider_configuration(profile_key: str, model_override: str | None = None) -> dict[str, Any]:
    profile = resolve_profile(profile_key, model_override)
    provider_key = profile.get("provider") or DEFAULT_PROVIDER
    provider = _provider(provider_key)

    model = profile.get("model") or provider.get("default_model") or DEFAULT_MODEL
    base_url = (
        provider.get("base_url")
        or os.getenv("OPENROUTER_BASE_URL", DEFAULT_BASE_URL)
    ).rstrip("/")

    return {
        "profile_key": profile_key,
        "provider_key": provider_key,
        "model": model,
        "fallback_provider_key": profile.get("fallback_provider_key"),
        "fallback_model": profile.get("fallback_model"),
        "temperature": float(profile.get("temperature") or 0.3),
        "max_output_tokens": int(profile.get("max_output_tokens") or 1200),
        "enabled": bool(profile.get("enabled", True)) and bool(provider.get("enabled", True)),
        "base_url": base_url,
        "config": profile.get("config") or {},
    }


def _api_key(provider_key: str) -> str:
    if provider_key == "openrouter":
        return os.getenv("OPENROUTER_API_KEY", "").strip()
    return os.getenv(f"{provider_key.upper()}_API_KEY", "").strip()


async def generate(
    profile_key: str,
    messages: list[dict[str, str]],
    *,
    model_override: str | None = None,
    max_output_tokens: int | None = None,
    temperature: float | None = None,
    referer: str = "https://learnora-me.vercel.app",
    title: str = "Learnora ME",
    timeout: float = 60,
) -> dict[str, Any]:
    started = time.perf_counter()
    config = provider_configuration(profile_key, model_override)

    if not config["enabled"]:
        return {
            "status": "disabled",
            "provider": config["provider_key"],
            "model": config["model"],
        }

    provider_key = config["provider_key"]
    api_key = _api_key(provider_key)
    if not api_key:
        return {
            "status": "not_configured",
            "provider": provider_key,
            "model": config["model"],
        }

    if provider_key != "openrouter":
        return {
            "status": "unsupported_provider",
            "provider": provider_key,
            "model": config["model"],
        }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("LEARNORA_AI_REFERER", referer),
        "X-Title": title,
    }
    payload = {
        "model": config["model"],
        "messages": messages,
        "max_tokens": max_output_tokens or config["max_output_tokens"],
        "temperature": temperature if temperature is not None else config["temperature"],
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                config["base_url"] + "/chat/completions",
                headers=headers,
                json=payload,
            )

        if response.status_code >= 400:
            raise RuntimeError(f"{provider_key} returned HTTP {response.status_code}")

        data = response.json()
        content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content")
        if not content:
            raise RuntimeError("AI provider returned no content.")

        return {
            "status": "success",
            "content": content,
            "provider": provider_key,
            "model": config["model"],
            "latency_ms": int((time.perf_counter() - started) * 1000),
            "usage": data.get("usage") or {},
        }
    except Exception as exc:
        return {
            "status": "error",
            "provider": provider_key,
            "model": config["model"],
            "latency_ms": int((time.perf_counter() - started) * 1000),
            "error": str(exc)[:500],
        }
