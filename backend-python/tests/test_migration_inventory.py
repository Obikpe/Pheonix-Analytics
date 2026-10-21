"""Repository-side migration inventory and safety regression checks.

These tests intentionally inspect source SQL only. They do not claim that the
live database is structurally equivalent, and they never execute migrations.
"""
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "supabase" / "migrations"
REMEDIATION_DIR = ROOT / "backend-python" / "migrations"


class MigrationInventoryTests(unittest.TestCase):
    def test_numbered_source_migration_chain_is_contiguous_001_to_022(self):
        files = sorted(SOURCE_DIR.glob("[0-9][0-9][0-9]_*.sql"))
        numbers = [int(path.name[:3]) for path in files]
        self.assertEqual(
            numbers,
            list(range(1, 23)),
            "Source migration chain must contain exactly one numbered file for each version 001–022.",
        )

    def test_each_source_migration_has_nonempty_sql(self):
        files = sorted(SOURCE_DIR.glob("[0-9][0-9][0-9]_*.sql"))
        self.assertEqual(len(files), 22)
        for path in files:
            with self.subTest(migration=path.name):
                sql = path.read_text(encoding="utf-8").strip()
                self.assertTrue(sql, "Migration file must not be empty.")
                self.assertRegex(sql, r"(?is)\b(CREATE|ALTER|INSERT|UPDATE|DELETE|GRANT|REVOKE|DROP)\b")

    def test_remediation_migrations_023_to_027_are_present_and_ordered(self):
        files = sorted(REMEDIATION_DIR.glob("[0-9][0-9][0-9]_*.sql"))
        numbers = [int(path.name[:3]) for path in files]
        self.assertEqual(
            numbers,
            [23, 24, 25, 26, 27],
            "Expected the five reviewed remediation migrations; investigate gaps or extra numbered SQL before release.",
        )

    def test_historical_data_migrations_are_explicitly_treated_as_non_replayable(self):
        # These migrations mutate existing identity/permission/quota data.
        # This guard prevents a future refactor from treating them as harmless DDL.
        for number in (3, 4, 15):
            matches = list(SOURCE_DIR.glob(f"{number:03d}_*.sql"))
            self.assertEqual(len(matches), 1)
            sql = matches[0].read_text(encoding="utf-8")
            with self.subTest(migration=matches[0].name):
                self.assertRegex(sql, r"(?is)\b(INSERT\s+INTO|UPDATE\s+)")

    def test_quota_fix_keeps_null_monthly_limit_contract(self):
        sql = (REMEDIATION_DIR / "025_allow_unlimited_monthly_ai_quota.sql").read_text(
            encoding="utf-8"
        )
        self.assertRegex(sql, r"(?is)p_requests_per_month\s+IS\s+NOT\s+NULL")
        self.assertNotRegex(\n            sql,\n            r"(?is)IF\\s+p_requests_per_month\\s+IS\\s+NULL\\s+THEN",\n            "A NULL monthly limit must remain valid (unlimited).",\n        )

    def test_browser_grant_revocation_is_scoped_to_control_tables(self):
        sql = (REMEDIATION_DIR / "027_revoke_browser_grants_from_org_control_tables.sql").read_text(
            encoding="utf-8"
        )
        self.assertIn("REVOKE", sql.upper())
        self.assertIn("anon", sql)
        self.assertIn("authenticated", sql)
        # The remediation must not blanket-revoke shared learner/course tables.
        for table in ("learnora_courses", "learnora_lessons", "learnora_lesson_progress"):
            with self.subTest(table=table):
                self.assertNotRegex(
                    sql,
                    rf"(?is)REVOKE[^;]*\b{re.escape(table)}\b",
                    f"Unexpected browser grant revocation for shared table {table}.",
                )


if __name__ == "__main__":
    unittest.main()
