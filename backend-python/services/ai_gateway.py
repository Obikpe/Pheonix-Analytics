"""Central Learnora AI gateway.

AI features select a named profile; profiles select provider/model configuration.
Feature code must not hard-code an LLM model.
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
    "tutor": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1200},
    "coach": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1200},
    "practice": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1200},
    "project": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1400},
    "instructor": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1400},
    "organisation": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 1400},
    "contract_drafting": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.1, "max_output_tokens": 8000},
    "content_generation": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.3, "max_output_tokens": 2000},
    "advanced_reasoning": {"provider_key": "openrouter", "model": "openrouter/free", "temperature": 0.2, "max_output_tokens": 2000},
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


def resolve_profile(profile_key: str) -> dict[str, Any]:
    return _profile(profile_key)


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


def provider_configuration(profile_key: str) -> dict[str, Any]:
    profile = resolve_profile(profile_key)
    provider_key = profile.get("provider_key") or DEFAULT_PROVIDER
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


async def _attempt(
    provider_key: str,
    model: str,
    messages: list[dict[str, str]],
    *,
    max_tokens: int,
    temperature: float,
    referer: str,
    title: str,
    timeout: float,
) -> dict[str, Any]:
    started = time.perf_counter()
    provider = _provider(provider_key)
    if not provider.get("enabled", True):
        return {"status": "provider_disabled", "provider": provider_key, "model": model}

    api_key = _api_key(provider_key)
    if not api_key:
        return {"status": "not_configured", "provider": provider_key, "model": model}

    if provider_key != "openrouter":
        return {"status": "unsupported_provider", "provider": provider_key, "model": model}

    base_url = (
        provider.get("base_url")
        or os.getenv("OPENROUTER_BASE_URL", DEFAULT_BASE_URL)
    ).rstrip("/")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("LEARNORA_AI_REFERER", referer),
        "X-Title": title,
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                base_url + "/chat/completions",
                headers=headers,
                json=payload,
            )
        if response.status_code >= 400:
            return {
                "status": "error",
                "provider": provider_key,
                "model": model,
                "http_status": response.status_code,
                "error": f"{provider_key} returned HTTP {response.status_code}",
                "latency_ms": int((time.perf_counter() - started) * 1000),
            }

        data = response.json()
        content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content")
        if not content:
            return {
                "status": "error",
                "provider": provider_key,
                "model": model,
                "error": "AI provider returned no content.",
                "latency_ms": int((time.perf_counter() - started) * 1000),
            }

        return {
            "status": "success",
            "content": content,
            "provider": provider_key,
            "model": model,
            "latency_ms": int((time.perf_counter() - started) * 1000),
            "usage": data.get("usage") or {},
        }
    except Exception as exc:
        return {
            "status": "error",
            "provider": provider_key,
            "model": model,
            "error": str(exc)[:500],
            "latency_ms": int((time.perf_counter() - started) * 1000),
        }


async def generate(
    profile_key: str,
    messages: list[dict[str, str]],
    *,
    max_output_tokens: int | None = None,
    temperature: float | None = None,
    referer: str = "https://learnora-me.vercel.app",
    title: str = "Learnora ME",
    timeout: float = 60,
) -> dict[str, Any]:
    config = provider_configuration(profile_key)

    if not config["enabled"]:
        return {
            "status": "disabled",
            "provider": config["provider_key"],
            "model": config["model"],
        }

    max_tokens = max_output_tokens or config["max_output_tokens"]
    temp = temperature if temperature is not None else config["temperature"]

    attempts = [{
        "provider_key": config["provider_key"],
        "model": config["model"],
        "type": "primary",
    }]

    if config.get("fallback_model"):
        attempts.append({
            "provider_key": config.get("fallback_provider_key") or config["provider_key"],
            "model": config["fallback_model"],
            "type": "fallback",
        })

    failures = []
    for attempt in attempts:
        result = await _attempt(
            attempt["provider_key"],
            attempt["model"],
            messages,
            max_tokens=max_tokens,
            temperature=temp,
            referer=referer,
            title=title,
            timeout=timeout,
        )
        result["attempt_type"] = attempt["type"]

        if result["status"] == "success":
            result["attempts"] = failures + [result["attempt_type"]]
            if failures:
                result["fallback_used"] = True
                result["fallback_reason"] = failures[-1].get("error") or failures[-1].get("status")
            return result

        failures.append(result)

    primary = attempts[0]
    last = failures[-1] if failures else {}
    return {
        "status": last.get("status", "error"),
        "provider": last.get("provider", primary["provider_key"]),
        "model": last.get("model", primary["model"]),
        "error": last.get("error", "All configured AI attempts failed.")[:500],
        "latency_ms": sum(int(item.get("latency_ms") or 0) for item in failures),
        "attempts": failures,
        "fallback_used": len(failures) > 1,
    }
