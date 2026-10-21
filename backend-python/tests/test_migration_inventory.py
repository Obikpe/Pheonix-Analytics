"""Migration inventory checks aligned with the active Supabase migration strategy.

The timestamped supabase/migrations directory is the active release chain.
The old numbered chain is archived under supabase/legacy_migrations for
historical analysis only and must not be replayed as the current schema.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
ACTIVE_DIR = ROOT / "supabase" / "migrations"
LEGACY_DIR = ROOT / "supabase" / "legacy_migrations"


class MigrationInventoryTests(unittest.TestCase):
    def test_legacy_numbered_chain_is_archived_and_contiguous_001_to_015(self):
        files = sorted(LEGACY_DIR.glob("[0-9][0-9][0-9]_*.sql"))
        numbers = [int(path.name[:3]) for path in files]
        self.assertEqual(numbers, list(range(1, 16)))
        for path in files:
            self.assertTrue(path.read_text(encoding="utf-8").strip(), path.name)

    def test_current_security_remediation_migrations_are_present(self):
        expected = (
            "20261020230826_learnora_audit_remediation.sql",
            "20261020230906_restore_shared_learner_grants_and_lock_trigger_routines.sql",
            "20261020232148_allow_unlimited_monthly_ai_quota.sql",
            "20261020234717_pin_shared_timestamp_trigger_search_path.sql",
            "20261020234813_revoke_browser_grants_from_org_control_tables.sql",
            "20261021220303_revoke_browser_table_grants.sql",
            "20261021220321_process_creator_payout_atomically.sql",
            "20261021220327_encrypt_cohort_date_of_birth.sql",
            "20261021220333_cohort_login_rate_limits.sql",
            "20261021220849_revoke_trigger_function_browser_execute.sql",
        )
        for name in expected:
            with self.subTest(migration=name):
                sql_path = ACTIVE_DIR / name
                self.assertTrue(sql_path.is_file(), f"Missing active migration: {name}")
                self.assertTrue(sql_path.read_text(encoding="utf-8").strip())

    def test_historical_reconstructed_sources_are_not_misrepresented_as_originals(self):
        readme = (LEGACY_DIR / "README.md").read_text(encoding="utf-8").lower()
        self.assertIn("reconstruct", readme)
        for name in (
            "20261008100924_add_learnora_ai_profiles.sql",
            "20261011051442_learner_onboarding_profiles.sql",
        ):
            self.assertTrue((ACTIVE_DIR / name).is_file(), name)

    def test_quota_fix_preserves_unlimited_monthly_limit_contract(self):
        sql = (ACTIVE_DIR / "20261020232148_allow_unlimited_monthly_ai_quota.sql").read_text(
            encoding="utf-8"
        )
        self.assertNotRegex(
            sql,
            r"(?is)IF\s+p_requests_per_month\s+IS\s+NULL\s+THEN",
            "A NULL monthly limit must remain valid (unlimited).",
        )

    def test_browser_grant_revocation_covers_shared_and_control_tables(self):
        sql = (ACTIVE_DIR / "20261021220303_revoke_browser_table_grants.sql").read_text(
            encoding="utf-8"
        )
        self.assertRegex(sql, r"(?is)REVOKE\s+ALL\s+PRIVILEGES\s+ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public")
        for role in ("anon", "authenticated"):
            self.assertIn(role, sql)
        self.assertIn("ALTER DEFAULT PRIVILEGES", sql)


if __name__ == "__main__":
    unittest.main()
