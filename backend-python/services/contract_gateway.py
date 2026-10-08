import json
from routers.auth import supabase
from services.ai_gateway import generate as generate_llm

async def generate_contract_draft(contract_id: str, required_sections: list[str], terms: dict):
    clauses = supabase.table("learnora_contract_clauses").select("clause_key,approved_text,required").eq("status","approved").execute().data or []
    selected = [c for c in clauses if c.get("clause_key") in set(required_sections) or c.get("required")]
    if not selected:
        return {"status":"not_ready","reason":"No approved clauses match the contract rules."}
    pack = "\n\n".join("CLAUSE "+str(c["clause_key"])+"\n"+str(c["approved_text"]) for c in selected)
    result = await generate_llm("contract_drafting",[
        {"role":"system","content":"Draft only from supplied structured terms and approved clauses. Never invent commercial or legal facts. This is for human review."},
        {"role":"user","content":"CONTRACT ID: "+contract_id+"\nTERMS:\n"+json.dumps(terms)+"\nSECTIONS:\n"+json.dumps(required_sections)+"\nCLAUSES:\n"+pack}
    ],max_output_tokens=8000,temperature=0.1,title="Learnora ME Contract Drafting",timeout=60)
    if result["status"] != "success":
        return {"status":"not_ready","reason":result.get("error") or result["status"],"provider":result.get("provider"),"model":result.get("model")}
    return {"status":"success","content":result["content"],"provider":result["provider"],"model":result["model"]}
