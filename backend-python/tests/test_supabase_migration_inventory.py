"""Guard the active Supabase migration directory against legacy replay drift."""
import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
ACTIVE_MIGRATIONS = REPO_ROOT / "supabase" / "migrations"
LEGACY_MIGRATIONS = REPO_ROOT / "supabase" / "legacy_migrations"

EXPECTED_VERSIONS = [
    "20261008100924",
    "20261009225421",
    "20261009230311",
    "20261009230330",
    "20261009230703",
    "20261009231536",
    "20261009231754",
    "20261009232328",
    "20261011051442",
    "20261020230826",
    "20261020230906",
    "20261020232148",
    "20261020234717",
    "20261020234813",
    "20261021112845",
    "20261021113145",
    "20261021113310",
    "20261021113447",
    "20261021113710",
    "20261021114646",
    "20261021114859",
    "20261021115303",
    "20261021161009",
    "20261021161056",
    "20261021161237",
    "20261021182222",
]


class SupabaseMigrationInventoryTests(unittest.TestCase):
    def test_active_migration_directory_matches_timestamped_ledger_inventory(self):
        files = sorted(ACTIVE_MIGRATIONS.glob("*.sql"))
        versions = [path.name.split("_", 1)[0] for path in files]
        self.assertEqual(versions, EXPECTED_VERSIONS)
        self.assertTrue(all(re.fullmatch(r"\d{14}", version) for version in versions))
        self.assertTrue(all(path.stat().st_size > 0 for path in files))

    def test_unreconciled_legacy_candidates_are_not_active_migrations(self):
        self.assertFalse(any(ACTIVE_MIGRATIONS.glob("00[1-9]_*.sql")))
        self.assertFalse(any(ACTIVE_MIGRATIONS.glob("01[0-5]_*.sql")))
        legacy_names = {path.name for path in LEGACY_MIGRATIONS.glob("*.sql")}
        self.assertEqual(len(legacy_names), 18)
        original_legacy_names = {name for name in legacy_names if re.match(r"^\d{3}_", name)}
        self.assertEqual(len(original_legacy_names), 15)
        self.assertTrue((LEGACY_MIGRATIONS / "001_initial.sql").is_file())
        self.assertTrue((LEGACY_MIGRATIONS / "015_learnora_ai_permissions.sql").is_file())
        users_bootstrap = (LEGACY_MIGRATIONS / "002z_reconstructed_users_registry.sql").read_text(encoding="utf-8")
        admins_bootstrap = (LEGACY_MIGRATIONS / "003z_reconstructed_admins_registry.sql").read_text(encoding="utf-8")
        timestamp_bootstrap = (LEGACY_MIGRATIONS / "zz_reconstructed_set_updated_at.sql").read_text(encoding="utf-8")
        self.assertIn("CATALOG-RECONSTRUCTED prerequisite", users_bootstrap)
        self.assertIn("CATALOG-RECONSTRUCTED prerequisite", admins_bootstrap)
        self.assertIn("CATALOG-RECONSTRUCTED prerequisite", timestamp_bootstrap)

    def test_catalog_reconstructed_sources_are_not_misrepresented_as_original(self):
        for name in (
            "20261008100924_add_learnora_ai_profiles.sql",
            "20261011051442_learner_onboarding_profiles.sql",
        ):
            source = (ACTIVE_MIGRATIONS / name).read_text(encoding="utf-8")
            self.assertIn("CATALOG-RECONSTRUCTED SOURCE", source)
            self.assertIn("not a byte-for-byte recovery", source.lower())


if __name__ == "__main__":
    unittest.main()
