# Active Pheonix migration reconciliation — 2026-10-21

## Safety and scope

Target: active Pheonix Supabase project `gihfupzvdpyrmynqgukz`.

All live database inspection in this task was read-only. No production rows, schema, migration ledger, or Vercel deployment were changed. Do not merge or deploy until the legacy schema-parity gap, baseline strategy, and browser UI acceptance are reviewed.

## Active migration ledger restored

The active project reports 26 applied timestamped migration versions. The active `supabase/migrations/` directory now contains exactly those 26 timestamped filenames, in the same version order:

- `20261008100924_add_learnora_ai_profiles.sql`
- `20261009225421_learnora_organisation_portal.sql`
- `20261009230311_individual_learner_enrolments.sql`
- `20261009230330_learner_lesson_notes.sql`
- `20261009230703_ai_lesson_summariser_profile.sql`
- `20261009231536_mark_witstart_pilot_mode.sql`
- `20261009231754_cohort_course_assignments.sql`
- `20261009232328_community_discussions.sql`
- `20261011051442_learner_onboarding_profiles.sql`
- `20261020230826_learnora_audit_remediation.sql`
- `20261020230906_restore_shared_learner_grants_and_lock_trigger_routines.sql`
- `20261020232148_allow_unlimited_monthly_ai_quota.sql`
- `20261020234717_pin_shared_timestamp_trigger_search_path.sql`
- `20261020234813_revoke_browser_grants_from_org_control_tables.sql`
- `20261021112845_cohort_account_track_assignment.sql`
- `20261021113145_enforce_cohort_member_track_scope.sql`
- `20261021113310_allow_cohort_only_membership.sql`
- `20261021113447_cohort_step2_fk_indexes.sql`
- `20261021113710_validate_cohort_account_scope.sql`
- `20261021114646_cohort_member_course_lesson_access.sql`
- `20261021114859_harden_cohort_assignment_revocation.sql`
- `20261021115303_pin_cohort_assignment_trigger_search_path.sql`
- `20261021161009_cohort_archive_and_atomic_closure.sql`
- `20261021161056_fix_cohort_archive_enrolment_status.sql`
- `20261021161237_cohort_archive_fk_indexes.sql`
- `20261021182222_cohort_step5_restrict_lifecycle_and_trigger_function_access.sql`

The seven formerly missing timestamped sources have been restored as follows:

| Live migration | Source provenance |
| --- | --- |
| `20261020230826` audit remediation | Recovered verbatim from the previously committed `backend-python/migrations/023_learnora_audit_remediation.sql` |
| `20261020230906` shared learner grants / trigger routines | Recovered verbatim from `024_restore_shared_learner_grants_and_lock_trigger_routines.sql` |
| `20261020232148` unlimited monthly AI quota | Recovered verbatim from `025_allow_unlimited_monthly_ai_quota.sql` |
| `20261020234717` timestamp trigger search path | Recovered verbatim from `026_pin_shared_timestamp_trigger_search_path.sql` |
| `20261020234813` browser grants for organisation controls | Recovered verbatim from `027_revoke_browser_grants_from_org_control_tables.sql` |
| `20261008100924` AI profiles | Original source was not found in repository history. A catalog-derived equivalent was reconstructed from the live table definition; it is explicitly labelled and is not byte-for-byte original SQL. |
| `20261011051442` learner onboarding profiles | Original source was not found in repository history. A catalog-derived equivalent was reconstructed from the live table definition; it is explicitly labelled and is not byte-for-byte original SQL. |

The two catalog-derived files should not be described as exact source recovery. They need a final diff against any trusted backup or author copy if one becomes available. They are not replayed against the active database.

## Legacy baseline decision

Files `001_initial.sql` through `015_learnora_ai_permissions.sql` were moved intact to `supabase/legacy_migrations/`. They are preserved for historical analysis but are no longer in the active Supabase migration directory because their short version numbers do not exist in the live ledger. This prevents a normal migration command from treating them as pending work.

The live schema differs from these legacy scripts. Five tables created by `001_initial.sql` are absent: `tracks`, `enrollments`, `user_progress`, `user_project_progress`, and `community_qna`. Newer Learnora equivalents exist, but this is not enough to prove one-to-one data lineage. The older migrations also contain data-changing seed operations. Prior read-only comparison found a Witstart identity-set mismatch despite matching aggregate membership counts. No automatic repair was made because the correct identity mapping is ambiguous.

**Status:** the legacy-plus-timestamped chain can now be executed in a brand-new disposable CI database after five catalog-derived prerequisites and a Supabase Storage bootstrap. It still does **not** reproduce the active catalog schema or all active grants. Do not run it against active Supabase or any existing database, and do not insert synthetic migration-ledger rows. A reviewed current-state baseline/squash strategy is still needed for reliable new-environment setup. See `supabase/legacy_migrations/README.md`.

## Legacy baseline: source-to-live object comparison

A read-only name-level comparison was performed between the `CREATE TABLE` declarations in legacy migrations 001–015 and the current catalog snapshot. It found 81 distinct legacy table declarations: 76 table names are present in the current public schema and five are absent. This is a **table/column-name comparison only**; it does not prove type, default, nullability, constraint, index, trigger, RLS, grant, or data equivalence.

| Legacy table | Current evidence | Difference / decision |
| --- | --- | --- |
| `tracks` | `learnora_tracks` exists | Candidate successor by purpose; key/data lineage not proven. |
| `enrollments` | `learnora_enrolments` exists | Candidate successor; old trial/status fields do not establish one-to-one entitlement lineage. |
| `user_progress` | `learnora_lesson_progress` and `cohort_account_lesson_progress` exist | Two learner models now exist; do not merge their identities without a reviewed mapping. |
| `community_qna` | `learnora_discussions` and `learnora_discussion_replies` exist | Likely evolved discussion model, but question/answer migration is unverified. |
| `user_project_progress` | `projects` and `project_submissions` exist | Candidate project-workflow replacement; submission/completion semantics remain unverified. |

The empty-database replay has exposed five prerequisites absent from the archived historical chain: legacy migration 003 reads `public.users`; migration 004 references `public.admins`; timestamped migration `20261020234717` alters `public.set_updated_at()`; and migration `20261020234813` revokes grants on `public.learnora_contract_templates` and `public.learnora_contract_clauses` without earlier sources creating those tables. Their original source files were not found in repository history. Five clearly labelled, catalog-derived files (`002z_reconstructed_users_registry.sql`, `003z_reconstructed_admins_registry.sql`, `zz_reconstructed_set_updated_at.sql`, `zz_reconstructed_contract_templates.sql`, and `zzz_reconstructed_contract_clauses.sql`) have been added **only to the legacy replay archive** to let the disposable rehearsal continue. They are not active migrations and are not claimed as historical source recovery. Contract templates and clauses were empty in the active database; only their schema was reconstructed.

The name-level column comparison also found drift in existing tables:

- `courses`: legacy `track_id` and `duration` are absent from the current table; current columns include newer identifiers, track labels, publication state, timing and import metadata.
- `lessons`: legacy `order_index`, `is_shared`, `content_type`, `notes` and `video_url` are absent; the current lesson model uses newer ordering, content-markdown, learning-objective, publication and import fields.
- `audit_logs`: legacy `admin_id` and `target` are absent; current audit fields include actor email/type/role, IP, details and metadata.
- Additional columns exist in current `cohorts`, `cohort_members`, `learnora_courses`, `learnora_enrolments`, `quizzes`, `learnora_course_purchases`, `learnora_organisation_requests`, `learnora_contracts`, `learnora_contract_versions`, and `learnora_creator_accounts`.

These are replacement signals, not a complete lineage map. The legacy Witstart seed mismatch remains unresolved: one legacy-role user is absent from the matching organisation/cohort membership sets, while one membership in each set belongs to a user outside that role. No data repair was attempted because the intended identity mapping is not inferable from aggregate counts.

## Disposable staging schema snapshot

`supabase/baselines/active-pheonix-public-schema.sql` is a schema-only catalog snapshot generated from a read-only inspection of the active project on 2026-10-21. It contains no production data, credentials, or auth-user records. It captures 101 public tables, 974 base-table columns, 449 constraints, 150 non-constraint indexes, 16 public functions, 44 triggers, 101 RLS flags, one sequence and one view. It intentionally grants the backend `service_role` access and gives browser roles no table/function grants for the local API test harness.

This snapshot is **only** a disposable staging fixture for testing the current schema and authenticated API journey. It is not an original migration, not a data backup, not the historical pre-2026-10-08 baseline, and not proof that every migration can be replayed from an empty database.

## Full legacy replay rehearsal and schema-drift result

The disposable CI job now replays all 15 archived legacy SQL files, the five catalog-derived prerequisites, and all 26 timestamped migrations in a fresh PostgreSQL database. The migration sequence completes successfully. Deterministic seed checks also pass: the replay produces the same 41 permission keys as the active catalog, one AI-provider seed row, and no contract-template or contract-clause rows (both are empty in the active database).

A schema fingerprint comparison is intentionally **report-only** because the replay is not equivalent to the current catalog. After normalizing function-definition whitespace and ignoring column order, the comparison reports:

| Object category | Active catalog | Replayed chain | Difference |
| --- | ---: | ---: | --- |
| Column definitions | 986 | 926 | 95 missing from replay; 35 replay-only |
| Constraint definitions | 449 | 441 | 20 missing; 12 replay-only |
| Indexes | 315 | 287 | 35 missing; 7 replay-only |
| Functions | 52 | 52 | Match after whitespace normalization |
| Triggers | 44 | 37 | 7 missing from replay |
| RLS table states | 101 | 102 | 30 active states not reproduced; 31 replay-only states |
| Policies | 0 | 1 | Extra `lessons.enrolled can read` policy in replay |
| Views | 1 | 0 | `course_content_health` missing from replay |
| Sequences | 1 | 1 | Match |

Four active-schema tables are absent from the replay: `media`, `security_logs`, `password_reset_tokens`, and `email_verification_tokens`. Five legacy-only tables remain in the replay: `tracks`, `enrollments`, `user_progress`, `user_project_progress`, and `community_qna`. There is also column drift in `courses`, `lessons`, `audit_logs`, and `learnora_contract_versions`, among other objects. RLS differences include the cohort lifecycle tables, so the replay does not reproduce the active database's full security posture.

The historical chain also fails to reproduce the active `service_role` grants by itself. For the second API test only, CI applies the same service-role-only grant harness used by the catalog snapshot. This is a disposable-test adjustment, not a recovered historical migration.

The authenticated cohort lifecycle test passes against both the catalog snapshot and the replayed chain **after** that grant adjustment. This validates the cohort routes, but it does not make the full legacy schema equivalent. No legacy tables or columns were automatically dropped or remapped: their data lineage is unresolved, and forcing the fingerprint to match without a reviewed mapping could destroy or misclassify data.

## Authenticated API journey added to CI

`backend-python/tests/test_cohort_api_lifecycle.py` exercises the real FastAPI routes against the snapshot restored into a separate disposable PostgreSQL database exposed through local PostgREST. The test signs in an organisation owner through `/api/auth/login`, creates a cohort and track, enables the track, provisions a cohort learner, activates the account, signs in the learner, enables a course, assigns a tutor and lesson, reads the lesson, writes and reads progress, completes and archives the cohort, then verifies the account credentials are retired, the live membership is removed, the history snapshot excludes credentials, and the old learner token is rejected.

Only the outbound activation-email transport is replaced with a test token capture. Authentication, permission resolution, database reads/writes, cohort APIs, learner APIs, progress, closure and archive all use the actual application routes and isolated PostgreSQL data.

The existing migration-integration job remains separate: it applies the 12 cohort migrations to a minimal synthetic legacy schema and runs SQL invariant assertions. The authenticated journey now runs once against the catalog-derived full current schema snapshot and once against the replayed historical-plus-timestamped chain, with the staging-only service-role grants noted above.

## Verification completed on the current branch

The latest full code verification on commit `cc40e7d51d91937142d218e468c5921b290235ad` reported:

- [Cohort Learning Access Tests](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39670620490) — **passed**. The 12 cohort migrations and SQL invariants passed; the authenticated lifecycle journey passed against both disposable database variants; deterministic permission and AI-provider seed checks passed. The schema fingerprint step reports the known global drift and is non-blocking.
- [Learnora Backend Verification](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39670620444) — **passed**.
- [Learnora frontends](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39670620572) — both `frontend-team` and `frontend-v02` builds **passed**.
- [Learnora quality checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39670620437) — frontend subjobs were cancelled by overlapping runs; backend syntax passed. This quality workflow still needs a clean rerun.

The organisation UI now supports creating tracks, enabling tracks per cohort, provisioning cohort-only learner accounts, assigning courses and selected lessons to each learner, selecting a tutor, and marking cohorts completed or archiving them. The frontend build is verified; a separate browser-driven UI acceptance run has not yet been performed.

## Remaining release gates

1. Keep the two catalog-derived migration sources explicitly marked until a trusted original/backup is available or their equivalence is formally reviewed.
2. Complete the remaining object- and data-level mapping for legacy migrations 001–015, including the Witstart identity-set mismatch and permission/AI seed values. No production repair is authorised by this report.
3. Resolve the global schema fingerprint differences with a reviewed current-state baseline/squash strategy. Do not automatically drop legacy tables/columns or invent identity mappings; the catalog snapshot is for disposable staging only and must not be promoted into the active migration directory.
4. Before merge, perform a browser-driven acceptance pass on the organisation UI using a disposable organisation: create a track, enable it on a cohort, provision a learner, assign course/lessons/tutor, then complete and archive the cohort. Confirm the page displays API errors clearly and refreshes state after each action.

The draft PR remains open. No merge, live migration, or deployment was performed.
