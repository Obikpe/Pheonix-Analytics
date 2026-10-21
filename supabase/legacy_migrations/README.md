# Legacy Learnora migration candidates (quarantined)

Files `001_initial.sql` through `015_learnora_ai_permissions.sql` are preserved here as historical source candidates. They are **not** part of the active Supabase migration chain.

## Why they were moved

The active Pheonix project `gihfupzvdpyrmynqgukz` records timestamped migration versions. It has no matching ledger entries for the short versions `001`–`015`. The live schema also differs from the legacy scripts: five tables from `001_initial.sql` are absent (`tracks`, `enrollments`, `user_progress`, `user_project_progress`, `community_qna`) while newer Learnora equivalents exist. Migrations 003, 004 and 015 contain data-seeding operations, and prior read-only checks found a Witstart identity-set mismatch even though aggregate membership counts match.

Leaving these short-version files under `supabase/migrations/` risks Supabase CLI treating them as pending migrations and attempting to apply historical DDL or seed operations to a database whose current state is already different.

## Reconstructed prerequisite discovered during replay

The empty-database rehearsal exposed two pre-existing registry prerequisites absent from the archived chain:

- `public.users` is referenced by migration 003 but is not created by 001 or 002. `002z_reconstructed_users_registry.sql` restores its current catalog column and key shape for the disposable replay.
- `public.admins` is referenced by migration 004 but is not created by 001–003. `003z_reconstructed_admins_registry.sql` restores its current catalog table, sequence, key/check constraints, indexes, timestamp trigger and RLS state for the disposable replay.

- The timestamped migration `20261020234717_pin_shared_timestamp_trigger_search_path.sql` alters `public.set_updated_at()`, but none of the archived bootstrap files defines it. `zz_reconstructed_set_updated_at.sql` restores the live catalog function definition for the disposable replay.

The original sources for these three prerequisites were not found in repository history. All three supplemental files are explicitly catalog-derived, not original historical sources, and are kept outside the active migration directory.

The replay also bootstraps a minimal `storage.buckets` table in the disposable CI database because hosted Supabase supplies the Storage schema as a managed service; this CI-only table is not a project migration.

## Required before promoting any legacy file

For every candidate, document the exact object/data lineage and classify it as applied-equivalent, partially superseded, not applied, or unknown. Compare columns, defaults, constraints, indexes, triggers, functions, RLS, grants, views and seeded rows. Do not replay these scripts or fabricate migration-ledger rows to force a clean history.

These scripts may be rehearsed only in a brand-new, disposable CI database to test whether the legacy bootstrap plus timestamped migrations can be replayed. Never replay them against the active Supabase project or another existing database. The current-schema snapshot at `supabase/baselines/active-pheonix-public-schema.sql` is for disposable API staging only. It is not a replacement for the missing historical pre-migration baseline and must not be inserted into the active migration directory.
