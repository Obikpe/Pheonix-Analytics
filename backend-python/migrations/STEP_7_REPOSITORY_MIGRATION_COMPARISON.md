# Step 7 — Repository-side schema and migration comparison

**Branch:** `fix/learnora-audit-tenant-isolation`  
**Comparison scope:** source SQL committed in `supabase/migrations/001–022`, remediation SQL `backend-python/migrations/023–027`, and the live schema inventory/data checks documented in `STEP_7_SCHEMA_DATA_COMPARISON_RESULTS.md`.  
**Safety:** This is a source-review artifact. It executes no SQL, does not rewrite migration history, and does not imply a complete live structural diff.

## 1. Repository migration inventory

The source chain is contiguous: all 22 numbered source migrations exist. The remediation chain is also contiguous: migrations 023–027 exist in `backend-python/migrations`. The two directories represent different phases and should not be concatenated into a command that blindly replays all files.

| Version | Source file | Repository-side intent / comparison note | Live evidence / decision |
|---|---|---|---|
| 001 | `001_initial.sql` | Legacy initial schema | Five legacy tables are absent in live public schema; partially superseded or unresolved, not safe to replay. |
| 002 | `002_learnora_v1_foundation.sql` | Core Learnora tables and learning entities | Main entity coverage exists; exact columns, constraints, indexes, policies and data equivalence remain unproven. |
| 003 | `003_learnora_identity_bridge.sql` | Inserts Witstart organisation/cohort and bridges role-based users into memberships | Live row-set mismatch exists; never replay without resolving identity mapping. |
| 004 | `004_learnora_permissions.sql` | Permission/admin schema and permission catalogue foundations | Core permission objects exist; full seed and object-definition equivalence remain unproven. |
| 005 | `005_learnora_internal_staff.sql` | Internal staff/administration structures | Internal platform workflows are outside this organisation-side change scope; preserve existing live objects. |
| 006 | `006_learnora_commercial_entitlements.sql` | Commercial entitlement and subscription structures | Object coverage is not proof of exact constraints, defaults or data equivalence. |
| 007 | `007_learnora_learning_structure.sql` | Learning paths and structured learning content | Compare exact table/column definitions against live replacements before any repair. |
| 008 | `008_learnora_creator_economy.sql` | Creator and course ownership structures | Object coverage observed at inventory level only. |
| 009 | `009_learnora_platform_ops.sql` | Platform operations and configuration | Data/seed lineage requires separate key/value comparison; internal administration stays out of scope. |
| 010 | `010_learnora_backend_hardening.sql` | Backend constraints and hardening | Do not infer exact equivalence from table existence. |
| 011 | `011_learnora_backend_completion.sql` | Backend completion objects | Compare object definitions and any backfills before declaring equivalent. |
| 012 | `012_learnora_organisation_teams.sql` | Organisation team model | Live team tables and integrity checks exist; exact definition diff remains pending. |
| 013 | `013_learnora_lifecycle_constraints.sql` | Lifecycle constraints | Constraint definitions require exact comparison; no blind drop/re-add. |
| 014 | `014_learnora_ai_foundation.sql` | AI providers, conversations, messages and limits | Objects exist; quota/permission seed equivalence must be checked separately. |
| 015 | `015_learnora_ai_permissions.sql` | AI role-permission inserts and global AI-limit seed | Key presence was checked, but full key/value/role mapping is not yet reconciled. |
| 016 | `016_learnora_organisation_portal.sql` | Organisation portal feature | Live registry contains matching descriptive migration name; not proof every object matches. |
| 017 | `017_individual_learner_enrolments.sql` | Individual learner enrolment support | Live registry name match observed; exact schema equivalence pending. |
| 018 | `018_learner_lesson_notes.sql` | Learner lesson notes | Live registry name match observed; exact schema equivalence pending. |
| 019 | `019_ai_lesson_summariser_profile.sql` | AI lesson summariser profile | Live registry name match observed; exact schema equivalence pending. |
| 020 | `020_mark_witstart_pilot_mode.sql` | Witstart pilot-mode data/configuration | Registry name match observed; do not replay data/configuration changes blindly. |
| 021 | `021_cohort_course_assignments.sql` | Cohort-to-course assignments | Live registry name match observed; exact schema equivalence pending. |
| 022 | `022_community_discussions.sql` | Community discussion structures | Live registry name match observed; exact schema equivalence pending. |
| 023 | `023_learnora_audit_remediation.sql` | Constraints, quiz/module relationship, quota reservation table/function and team course assignments | Recorded as applied in live registry. |
| 024 | `024_restore_shared_learner_grants_and_lock_trigger_routines.sql` | Restores intended shared learner/course grants and hardens routines | Recorded as applied; must remain paired with scoped grant review. |
| 025 | `025_allow_unlimited_monthly_ai_quota.sql` | Allows a NULL monthly quota to mean unlimited while daily limit remains required | Recorded as applied; unit test now asserts the source contract. |
| 026 | `026_pin_shared_timestamp_trigger_search_path.sql` | Pins shared timestamp trigger function search path | Recorded as applied and function configuration was verified. |
| 027 | `027_revoke_browser_grants_from_org_control_tables.sql` | Removes browser-role grants from 18 backend-only control tables | Recorded as applied; live check returned zero browser-role grants for targeted tables. |

## 2. Legacy object replacement signals

The following legacy public tables from the 001–015 era are absent from the live inventory:

- `tracks`
- `enrollments`
- `user_progress`
- `community_qna`
- `user_project_progress`

This is consistent with partial schema evolution toward newer Learnora tables, but the repository cannot establish a one-to-one replacement mapping by names alone. Do not recreate these tables or replay migration 001 as a way to silence drift. A reviewed mapping must connect each absent legacy object to its intended successor, including any data transformation.

## 3. Data-changing migration guard

Source review confirms migration 003 contains inserts/upsert behaviour for Witstart organisation memberships and cohort membership; migration 004 includes permission/admin setup operations; migration 015 seeds AI role permissions and a global AI-limit row. These files are not safe to replay solely because their version labels are missing from the live migration registry.

The live Witstart check found one legacy-role user missing a matching organisation and cohort membership, and one membership in each set belonging to a user outside that legacy role. Aggregate counts alone conceal the identity-set mismatch. The correct mapping is not inferable from this report, so no repair was made.

## 4. Automated guardrails added

`backend-python/tests/test_migration_inventory.py` now checks in CI that:

1. The source migration chain contains exactly versions 001–022 without gaps.
2. Each source migration is non-empty and contains SQL statements.
3. Remediation migrations 023–027 are present in order.
4. Data-changing migrations 003, 004 and 015 retain data-operation signatures.
5. Migration 025 preserves the nullable monthly quota contract.
6. Migration 027 remains scoped and does not blanket-revoke browser grants from shared learner/course/progression tables.

These are repository consistency and regression checks, not a substitute for running PostgreSQL schema-diff tooling against a snapshot.

## 5. Exact structural comparison — remaining limitation

A complete structural comparison requires a current schema-only dump from the active database, including table/column types and defaults, primary/foreign/unique/check constraints, indexes, sequences, views, trigger definitions, function signatures/bodies/configuration, RLS enabled/forced flags, policies, ownership and grants. The available connection exposed catalog-query results but did not provide a schema-only dump/restore artifact in this run. Therefore, this repository-side pass **does not claim** exact structural equality.

To complete the live comparison without paid staging, the next safe option is to obtain a schema-only dump using existing authorised database credentials or a free local PostgreSQL container, then compare the dump with the repository migrations. Do not place service keys in GitHub or commit dump contents containing secrets or production data. Data rows should be compared using aggregates and redacted key/value summaries only.

## 6. Release status

- Repository inventory: **covered by new automated checks**.
- Migration name/history mapping: **partially reconciled**, with 001–015 unresolved and 016–027 matched by evidence described above.
- Live structural schema diff: **not complete**.
- Seed key/value and Witstart identity reconciliation: **not complete**.
- Authenticated HTTP and concurrency staging tests: **not run**; paid staging is not an option.
- Production database, production deployment and draft PR merge state: **unchanged by this source-review pass**.

Do not mark the release cleared on the basis of the new source-level checks alone.
