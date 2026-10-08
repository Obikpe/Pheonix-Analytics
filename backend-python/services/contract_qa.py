import re

MONEY_PATTERN = re.compile(r"\b(?:NGN|USD|GBP|CAD|EUR)\s?[\d,]+(?:\.\d+)?\b", re.I)


def check_contract_draft(draft: str, terms: dict, required_sections: list[str]):
    warnings = []
    required_missing = []

    lowered = draft.lower()
    for section in required_sections:
        label = section.replace("_", " ").lower()
        if label not in lowered:
            required_missing.append(section)

    if required_missing:
        warnings.append({
            "code": "missing_sections",
            "message": "Required sections were not detected.",
            "items": required_missing,
        })

    dates = [terms.get("start_date"), terms.get("end_date")]
    for value in dates:
        if value and str(value) not in draft:
            warnings.append({
                "code": "date_not_found",
                "message": f"Commercial date {value} was not found verbatim in the draft.",
            })

    currency = str(terms.get("currency") or "").upper()
    if currency and currency not in draft.upper():
        warnings.append({
            "code": "currency_not_found",
            "message": f"Currency {currency} was not found in the draft.",
        })

    capacity = terms.get("learner_capacity")
    if capacity is not None and str(capacity) not in draft:
        warnings.append({
            "code": "learner_capacity_not_found",
            "message": "The agreed learner capacity was not detected in the draft.",
        })

    if MONEY_PATTERN.search(draft) and not terms.get("pricing_summary"):
        warnings.append({
            "code": "unverified_amount",
            "message": "The draft contains monetary values but no pricing summary was supplied.",
        })

    return {
        "status": "pass" if not warnings else "review_required",
        "warnings": warnings,
        "required_section_count": len(required_sections),
        "missing_section_count": len(required_missing),
    }
