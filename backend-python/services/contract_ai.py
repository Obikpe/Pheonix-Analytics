import os
import json
import httpx

from routers.auth import supabase

OPENROUTER_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")


async def generate_contract_draft(contract_id: str, required_sections: list[str], terms: dict):
    clauses = (
        supabase.table("learnora_contract_clauses")
        .select("clause_key,category,title,approved_text,jurisdiction,version,required")
        .eq("status", "approved")
        .execute()
    ).data or []

    if not clauses:
        return {"status": "not_ready", "reason": "No approved contract clauses are available."}

    allowed = set(required_sections)
    selected = [c for c in clauses if c.get("clause_key") in allowed or c.get("required")]
    if not selected:
        return {"status": "not_ready", "reason": "No approved clauses match the contract rules."}

    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return {"status": "not_ready", "reason": "AI provider is not configured."}

    provider = (
        supabase.table("learnora_ai_providers")
        .select("default_model,enabled")
        .eq("provider_key", "openrouter")
        .limit(1)
        .execute()
    ).data
    provider = provider[0] if provider else {}
    if not provider.get("enabled", True):
        return {"status": "not_ready", "reason": "AI provider is disabled."}

    model = provider.get("default_model") or os.getenv("OPENROUTER_MODEL", "openrouter/auto")
    clause_pack = "\n\n".join(f"CLAUSE {c['clause_key']}\n{c['approved_text']}" for c in selected)

    system = (
        "You are Learnora's controlled contract drafting engine. "
        "Draft only from the supplied commercial terms and approved clauses. "
        "Never invent prices, dates, addresses, registration numbers, bank details, "
        "legal entities, obligations or rights. Preserve placeholders when a fact is missing. "
        "Do not add legal provisions outside the supplied approved clauses. "
        "Return a professional contract draft with clear numbered sections. "
        "This is a draft for human legal and commercial review, not legal advice."
    )
    user = (
        "CONTRACT ID: " + contract_id +
        "\nSTRUCTURED TERMS:\n" + json.dumps(terms, ensure_ascii=False) +
        "\nREQUIRED SECTIONS:\n" + json.dumps(required_sections) +
        "\nAPPROVED CLAUSES:\n" + clause_pack
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("LEARNORA_AI_REFERER", "https://learnora-me.vercel.app"),
        "X-Title": "Learnora ME Contract Drafting",
    }
    payload = {
        "model": model,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "max_tokens": 8000,
        "temperature": 0.1,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(OPENROUTER_URL + "/chat/completions", headers=headers, json=payload)
    if response.status_code >= 400:
        raise RuntimeError(f"OpenRouter returned HTTP {response.status_code}")
    data = response.json()
    content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content")
    if not content:
        raise RuntimeError("AI provider returned no contract draft.")
    return {"status": "success", "content": content, "provider": "openrouter", "model": model}
