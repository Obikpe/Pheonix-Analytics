"""One-time encryption/backfill for existing cohort account dates of birth.

Run only after setting COHORT_DOB_ENCRYPTION_KEY and pointing the service-role
credentials at the intended environment. The script never prints personal data.
"""
import os
import sys

from cryptography.fernet import Fernet
from supabase import create_client


def main() -> int:
    url = os.getenv("SUPABASE_URL", "").strip()
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    encryption_key = os.getenv("COHORT_DOB_ENCRYPTION_KEY", "").strip()
    if not url or not service_key or not encryption_key:
        print("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and COHORT_DOB_ENCRYPTION_KEY are required.", file=sys.stderr)
        return 2

    try:
        fernet = Fernet(encryption_key.encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        print("COHORT_DOB_ENCRYPTION_KEY must be a valid Fernet key.", file=sys.stderr)
        return 2

    db = create_client(url, service_key)
    page_size = 500
    offset = 0
    migrated = 0
    while True:
        response = (
            db.table("cohort_accounts")
            .select("id,date_of_birth,date_of_birth_encrypted")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = response.data or []
        if not rows:
            break

        for row in rows:
            dob = row.get("date_of_birth")
            if not dob or row.get("date_of_birth_encrypted"):
                continue
            ciphertext = fernet.encrypt(str(dob).encode("ascii")).decode("ascii")
            saved = (
                db.table("cohort_accounts")
                .update({
                    "date_of_birth_encrypted": ciphertext,
                    "date_of_birth": None,
                })
                .eq("id", row["id"])
                .is_("date_of_birth_encrypted", "null")
                .execute()
            )
            if saved.data:
                migrated += 1
        offset += len(rows)

    print(f"Encrypted {migrated} cohort DOB records; no personal values were logged.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
