import json
from routers.auth import supabase
from services.ai_gateway import generate as generate_llm


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

    clause_pack = "\n\n".join(
        "CLAUSE " + str(c["clause_key"]) + "\n" + str(c["approved_text"])
        for c in selected
    )

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

    result = await generate_llm(
        "contract_drafting",
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        max_output_tokens=8000,
        temperature=0.1,
        title="Learnora ME Contract Drafting",
        timeout=60,
    )

    if result["status"] != "success":
        return {
            "status": "not_ready",
            "reason": result.get("error") or result["status"],
            "provider": result.get("provider"),
            "model": result.get("model"),
        }

    return {
        "status": "success",
        "content": result["content"],
        "provider": result["provider"],
        "model": result["model"],
    }
