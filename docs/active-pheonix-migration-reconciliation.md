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
| `20261020230826` audit remediation | Timestamped SQL source is present and replay-tested; the referenced prior path is not present in the current tree and its exact historical provenance is not independently verified. |
| `20261020230906` shared learner grants / trigger routines | Timestamped SQL source is present and replay-tested; exact historical byte-for-byte provenance is not independently verified. |
| `20261020232148` unlimited monthly AI quota | Timestamped SQL source is present and replay-tested; exact historical byte-for-byte provenance is not independently verified. |
| `20261020234717` timestamp trigger search path | Timestamped SQL source is present and replay-tested; exact historical byte-for-byte provenance is not independently verified. |
| `20261020234813` browser grants for organisation controls | Timestamped SQL source is present and replay-tested; exact historical byte-for-byte provenance is not independently verified. |
| `20261008100924` AI profiles | Original source was not found in repository history. A catalog-derived equivalent was reconstructed from the live table definition; it is explicitly labelled and is not byte-for-byte original SQL. |
| `20261011051442` learner onboarding profiles | Original source was not found in repository history. A catalog-derived equivalent was reconstructed from the live table definition; it is explicitly labelled and is not byte-for-byte original SQL. |

The two catalog-derived files should not be described as exact source recovery. They need a final diff against any trusted backup or author copy if one becomes available. They are not replayed against the active database. The five 2026-10-20 SQL files are present and successfully replay, but their original historical source paths could not be independently verified in the current Git history; do not call them byte-for-byte recovery until the original blobs or trusted backups are found.

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

`supabase/baselines/active-pheonix-public-schema.sql` is a schema-only catalog snapshot generated from a read-only inspection of the active project on 2026-10-21. It contains no production data, credentials, or auth-user records. It captures 101 public tables, 974 base-table columns, 449 constraints, 150 non-constraint indexes, 52 public routines, 44 triggers, 101 RLS flags, one sequence and one view. It intentionally grants the backend `service_role` access and gives browser roles no table/function grants for the local API test harness.

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

The authenticated cohort lifecycle test passes against both the catalog snapshot and the replayed chain **after** that grant adjustment. On the replayed-chain run, the legacy `audit_logs` table shape also triggers a swallowed `account_type` schema-cache error in the authentication audit writer; the test remains green because that writer intentionally catches exceptions. The catalog-snapshot run does not show this warning. This is another observable consequence of the known legacy schema drift, not a successful audit-write assertion. This validates the cohort routes, but it does not make the full legacy schema equivalent. No legacy tables or columns were automatically dropped or remapped: their data lineage is unresolved, and forcing the fingerprint to match without a reviewed mapping could destroy or misclassify data.

## Authenticated API journey added to CI

`backend-python/tests/test_cohort_api_lifecycle.py` exercises the real FastAPI routes against the snapshot restored into a separate disposable PostgreSQL database exposed through local PostgREST. The test signs in an organisation owner through `/api/auth/login`, creates a cohort and track, enables the track, provisions a cohort learner, activates the account, signs in the learner, enables a course, assigns a tutor and lesson, reads the lesson, writes and reads progress, completes and archives the cohort, then verifies the account credentials are retired, the live membership is removed, the history snapshot excludes credentials, and the old learner token is rejected.

Only the outbound activation-email transport is replaced with a test token capture. Authentication, permission resolution, database reads/writes, cohort APIs, learner APIs, progress, closure and archive all use the actual application routes and isolated PostgreSQL data.

The existing migration-integration job remains separate: it applies the 12 cohort migrations to a minimal synthetic legacy schema and runs SQL invariant assertions. The authenticated journey now runs once against the catalog-derived full current schema snapshot and once against the replayed historical-plus-timestamped chain, with the staging-only service-role grants noted above.

## Previous verification before the revised staging policy

The following runs are historical evidence from commit `56aa678a7d5d5a02c2c9e61642581d2b60d9c500`, before the revised workflow restricted authenticated API acceptance to the catalog-derived snapshot:

- [Cohort Learning Access Tests](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419293) — **passed**. The 12 cohort migrations and SQL invariants passed; the authenticated lifecycle journey passed against both disposable database variants; deterministic permission and AI-provider seed checks passed. The schema fingerprint step reports the known global drift and is non-blocking.
- [Learnora Backend Verification](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419719) — **passed**.
- [Learnora frontends](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419462) — both `frontend-team` and `frontend-v02` builds **passed**.
- [Learnora quality checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419552) — frontend subjobs were cancelled by overlapping runs; backend syntax passed. This quality workflow still needs a clean rerun.

The organisation UI now supports creating tracks, enabling tracks per cohort, provisioning cohort-only learner accounts, assigning courses and selected lessons to each learner, selecting a tutor, and marking cohorts completed or archiving them. The frontend build is verified; a separate browser-driven UI acceptance run has not yet been performed.

## Remaining release gates

1. Keep the two catalog-derived migration sources explicitly marked until a trusted original/backup is available or their equivalence is formally reviewed.
2. Complete the remaining object- and data-level mapping for legacy migrations 001–015, including the Witstart identity-set mismatch and permission/AI seed values. No production repair is authorised by this report.
3. Resolve the global schema fingerprint differences with a reviewed current-state baseline/squash strategy. Do not automatically drop legacy tables/columns or invent identity mappings; the catalog snapshot is for disposable staging only and must not be promoted into the active migration directory.
4. Before merge, perform a browser-driven acceptance pass on the organisation UI using a disposable organisation: create a track, enable it on a cohort, provision a learner, assign course/lessons/tutor, then complete and archive the cohort. Confirm the page displays API errors clearly and refreshes state after each action.

The draft PR remains open. No merge, live migration, or deployment was performed.


## Latest authenticated staging run (2026-10-21)

The latest [Cohort Learning Access Tests run](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419293) passed on commit `56aa678a7d5d5a02c2c9e61642581d2b60d9c500`. Its completed steps include the 12 cohort migrations and SQL assertions, restoration of the catalog-derived schema snapshot into a separate disposable database, replay of the legacy-plus-timestamped chain in another disposable database, deterministic permission/AI-provider seed checks, schema fingerprint comparison, and the authenticated FastAPI/PostgREST cohort lifecycle journey against both databases. Backend verification, frontend builds, and quality checks also passed in runs [39671419719](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419719), [39671419462](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419462), and [39671419552](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39671419552).

Important: the schema fingerprint step is report-only and the logs show real global differences between the historical replay and the current catalog snapshot. The replayed-chain API journey emits a swallowed audit-log schema-cache warning for `audit_logs.account_type`; the catalog-snapshot journey does not. Therefore the API route journey passed, but full schema/security parity and audit-write parity have not been established. Both databases were ephemeral GitHub Actions PostgreSQL instances; no live Supabase migration or production data mutation occurred.


## Staging policy decision — adopted

The CI workflow now follows the explicit staging policy:

1. **Current-schema acceptance staging:** restore `supabase/baselines/active-pheonix-public-schema.sql` into a fresh ephemeral PostgreSQL database and run the full authenticated FastAPI/PostgREST cohort lifecycle journey only against this catalog-derived snapshot.
2. **Historical migration analysis:** replay `supabase/legacy_migrations/*.sql` followed by the timestamped migration files in a separate ephemeral database. Run deterministic seed checks and a report-only schema fingerprint comparison. Do not use this replay database as current-schema API acceptance evidence.
3. **No legacy-data cleanup or remapping:** the workflow does not connect to the live Supabase project, drop or remap any production/legacy data, or apply migrations to the active database. The replay starts from an empty disposable database; any DDL in the historical chain is exercised only in that throwaway environment.
4. **No automatic parity claim:** schema fingerprint differences remain visible and non-blocking for the historical-analysis job. They must be reviewed explicitly before any release migration plan is approved.

The workflow change was committed on the draft PR branch at `0ac16ef271b8a9cc2011114a1d6fa55e377ff782`. A fresh CI run is required to verify this final workflow edit.


## Verification of revised staging policy — commit `0ac16ef271b8a9cc2011114a1d6fa55e377ff782`

The latest workflow runs for the revised staging policy are:

- [Cohort Learning Access Tests](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39676949757) — **passed**. The authenticated FastAPI/PostgREST lifecycle runs against the catalog-derived disposable snapshot only. The legacy chain is replayed separately for seed checks and report-only schema comparison; it is not used for API acceptance.
- [Learnora Backend Verification](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39676949661) — **passed**, including compilation, imports, static checks and runtime API smoke test.
- [Learnora frontends](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39676949219) — **passed** for both frontend builds.
- [Learnora quality checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39676949150) — **cancelled** overall. Its individual frontend build and backend syntax steps completed successfully, but this workflow must be rerun cleanly before it can be marked passed.

No active Supabase schema, migration ledger, production rows, or Vercel deployment was changed. No merge or deployment was performed.


## Follow-up remediation — CI cancellation fixed (2026-10-21)

The quality workflow used `cancel-in-progress: true`, which could cancel a run while another check was starting. This was changed to `cancel-in-progress: false` so checks queue rather than canceling required evidence. The change is in commit `be306d17c44d01965e0756cb5679da87db040ae1`.

All four workflows completed successfully on that exact commit:

- [Learnora quality checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39677648997) — **passed**, including backend syntax and both frontend build jobs.
- [Learnora frontends](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39677648948) — **passed**, both frontend builds.
- [Learnora Backend Verification](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39677648952) — **passed**.
- [Cohort Learning Access Tests](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39677648786) — **passed** under the revised staging policy.

## Remaining issues that cannot be safely auto-fixed from repository evidence alone

The following are intentionally release-blocking rather than silently "fixed" by schema coercion:

1. **Historical migration source provenance:** GitHub commit searches for the two catalog-reconstructed migrations and a representative 20 October timestamped migration found no original source commit. The original SQL cannot be reconstructed with certainty from the current catalog because catalog state does not preserve all historical DDL, seed data, or migration side effects. Obtain trusted backup/author copies or formally approve the clearly labelled reconstructed sources after semantic review.
2. **Legacy/current data lineage:** the Witstart identity-set mismatch and likely successor-table mappings require record-level business confirmation. No rows have been moved, deleted, or remapped.
3. **Schema parity:** the report-only fingerprint still exposes missing/extra columns, constraints, indexes, triggers, RLS states, one policy, and one view. The replay is historical-analysis evidence, not a valid current-state bootstrap. Do not "fix" this by copying current object names into the legacy chain or dropping old objects.
4. **Fresh-environment bootstrap:** the catalog SQL snapshot remains a CI-only fixture. Before release, create and validate a dedicated reviewed baseline/squash artifact for new environments, including the correct grants, managed Supabase dependencies, functions, triggers, RLS, constraints, and any required reference/seed data. Do not place the staging snapshot into the active migration directory or apply it to the live project.
5. **Browser acceptance:** CI confirms builds and API-level cohort lifecycle behavior, not a real browser interaction with a deployed preview. Run the organisation workflow in an isolated preview with disposable test identities before merge; validate visible errors and refresh behaviour.

No live Supabase schema, migration ledger, production data, or Vercel deployment was changed. No merge or deployment was performed.


## Security remediation follow-up — branch-only, not applied to live Supabase

The following changes are now staged on the cohort PR branch:

- Cohort login uses exact username equality, rejects wildcard/special characters with the same generic 401, performs a dummy password hash verification for malformed or unknown usernames, and records failures in both username+IP and IP-only buckets.
- The cohort API returns no date of birth. New cohort accounts encrypt DOB using `COHORT_DOB_ENCRYPTION_KEY` and write no plaintext DOB. The schema migration adds `date_of_birth_encrypted` and allows the legacy plaintext column to be cleared.
- `backend-python/scripts/encrypt_cohort_dates_of_birth.py` is an explicit backfill tool. It must be run only after the key is securely configured for the intended environment; it never logs personal data. Existing production rows remain plaintext until this controlled backfill has been run and verified.
- Activation links put the one-time token in the URL fragment, and the activation page removes it from browser history immediately after reading it.
- Track listing no longer interpolates an organisation ID into a PostgREST `.or_()` expression.
- Payout processing now calls a pinned `SECURITY DEFINER` RPC that locks the payout row and inserts its ledger entry in the same database transaction. A dedicated `creator_payouts.process` permission replaces the broad `users.update` gate.
- Production FastAPI docs/OpenAPI endpoints are disabled, the permissive Vercel-preview CORS regex was removed, and security headers are configured for the API and both frontends.
- A new migration revokes browser/public privileges from all existing public tables/views and removes unsafe defaults for `postgres` (including global default function execution). The connected role is not a member of `supabase_admin`, so PostgreSQL rejects attempts to change that managed role's default ACL; this remains an explicit external-admin follow-up. CI now checks effective browser privileges and default ACLs against the replayed migration chain before the replay is normalised for API smoke checks.
- The cohort API integration fixture restores the catalog snapshot and applies the three new release-candidate migrations before exercising the API. The separate historical replay remains isolated.

### Required before any live rollout

1. Pre-rollout inventory found 53 public tables with explicit privileges for each of `anon` and `authenticated`. After migration `20261021220303`, the same verification query returns zero table-grant rows for both browser roles. The `supabase_admin` default ACL remains a managed-role limitation and must be resolved by an administrator with membership in that role.
2. Apply and verify the new migrations in staging first. Do not run them against production from this branch.
3. Configure a unique Fernet key in the backend environment as `COHORT_DOB_ENCRYPTION_KEY`, back up the relevant records, run the DOB backfill, and verify every non-null plaintext DOB has a ciphertext before clearing the plaintext column values. The CI key is a disposable fixture and must never be reused.
4. Confirm the new payout permission is assigned only to the intended finance operators through the permission administration workflow. Until assigned, payout processing intentionally fails closed for non-super-admin actors.
5. Reconcile PR #7 (audit tenant-isolation fixes) with PR #8 (cohort workflow) before either is released. The branches have diverged substantially; do not merge the entire audit branch blindly. Port/review its course-content guards, module-unlock checks, AI quota reservation, team-membership guards, and associated regression tests onto a combined branch, then rerun all CI.
6. Verify instructor grading is scoped to the assigned course and add immutable grading audit events before enabling any instructor submission-grading route. This remains unverified on the cohort branch.
7. Decide the session migration from localStorage to HttpOnly secure cookies. Current bearer-token storage remains a residual XSS exposure; the new CSP is a baseline policy, not a substitute for the cookie migration.
8. Recover the original migration source artifacts where possible. The two catalog-reconstructed migrations and five historical source files with unverified provenance remain qualified as such; do not describe them as original recoveries.
9. Run the quality workflow to a clean completed result. A cancelled result is not a pass.

No migration has been applied to the live Supabase project, no existing production DOB has been backfilled, and no merge or deployment has been performed by this remediation.


### Provenance verification added during remediation

The following timestamped migrations are now verified against byte-identical source files on `fix/learnora-audit-tenant-isolation`:

- `20261020230826_learnora_audit_remediation.sql` ↔ `backend-python/migrations/023_learnora_audit_remediation.sql`
- `20261020230906_restore_shared_learner_grants_and_lock_trigger_routines.sql` ↔ `backend-python/migrations/024_restore_shared_learner_grants_and_lock_trigger_routines.sql`
- `20261020232148_allow_unlimited_monthly_ai_quota.sql` ↔ `backend-python/migrations/025_allow_unlimited_monthly_ai_quota.sql`
- `20261020234717_pin_shared_timestamp_trigger_search_path.sql` ↔ `backend-python/migrations/026_pin_shared_timestamp_trigger_search_path.sql`
- `20261020234813_revoke_browser_grants_from_org_control_tables.sql` ↔ `backend-python/migrations/027_revoke_browser_grants_from_org_control_tables.sql`

All five source/target pairs had identical blob SHAs in the repository API. This resolves the content-provenance uncertainty for those five files, but not the separate branch-integration dependency.


## Follow-up security work — latest branch commits

- Tightened the cohort username allowlist to `[a-z0-9.-]{2,160}`; the regex no longer admits a backslash. Regression tests already cover `%`, `a%`, and `_`, generic 401 responses, dummy password verification, IP+username buckets, and the sixth-attempt lockout.
- Added `supabase/rollback/20261021220303_revoke_browser_table_grants.rollback.sql` outside the active migration directory. It restores the exact 12-table grants from migration `20261020230906`; it is emergency-only because applying it restores browser-role exposure.
- Applied live migration `20261021220303_revoke_browser_table_grants`; verified `information_schema.role_table_grants` returns zero rows for `anon` and `authenticated` in `public`. The migration also hardens defaults owned by `postgres`.
- Applied live migration `20261021220321_process_creator_payout_atomically`, `20261021220327_encrypt_cohort_date_of_birth`, and `20261021220333_cohort_login_rate_limits`. The DOB schema migration is applied. A read-only count found zero cohort accounts, zero plaintext DOB rows, and zero encrypted DOB rows, so no existing DOB backfill is currently needed. A stable `COHORT_DOB_ENCRYPTION_KEY` has been provisioned in the `learnora-backend` Vercel production and preview environments for future account creation.
- The `supabase_admin` default ACL still grants browser privileges for future objects created by that managed role. The active connection is `postgres` and is not a member of `supabase_admin`, so the database rejected changing that role's defaults. This is an unresolved managed-role privilege issue requiring Supabase-admin-level access; do not claim future-object ACL parity until it is resolved.

### Branch integration status — verified after merge

PR #7 (`fix/learnora-audit-tenant-isolation`) and PR #8 (`cohort-org-backend-reconciliation`) are both merged into `main` at merge commit `4b609776c9f477ff42ada20f8fe5cbd6d80c28ef`. The earlier warning that both PRs remained open is stale and has been superseded.

The merged `main` tree contains the tenant-scoped course-content guards, module-unlock checks, organisation team membership guards, AI quota reservation service, cohort login validation/throttling, payout RPC, DOB encryption, browser table-grant revocation and trigger-function execute restrictions. CI must continue to test the actual current-schema snapshot and the historical replay independently.

### Remaining release blockers

- **Managed-role default ACL:** live verification shows zero explicit public-table grants to `anon` and `authenticated`, but `supabase_admin` still has default ACL entries granting browser roles privileges on future tables, sequences and functions. The connected `postgres` role cannot alter another role's defaults without membership. This is not resolved by the existing migration and must be handled by a Supabase project administrator/support or another explicitly authorised administrative mechanism. Do not claim complete future-object grant hardening until a read-only verification query returns no such ACL entries.
- **Local-storage bearer tokens:** frontends still store `phx_token` in `localStorage`. CSP and security headers reduce some exposure but do not remove token theft risk. A full HttpOnly-cookie migration requires coordinated backend, frontend, CSRF and cross-site-cookie testing; it is not equivalent to merely setting a cookie alongside the existing localStorage token.
- **Grading audit and scope:** the learner-facing assignment endpoints enforce enrolment and module unlocks, but a project-wide search of the current router files did not identify an instructor grading endpoint corresponding to the original finding. Before declaring this closed, locate the actual grading/write path and verify instructor-to-course assignment scope, one-way/controlled grade transitions, and audit logging. Do not add a speculative endpoint without confirming the product contract.
- **Migration provenance:** the five 20 October migration files were compared byte-for-byte with the archived source candidates during reconciliation, but repository history for the timestamped paths alone shows restoration commits. The two catalog-reconstructed files remain reconstructions, not recovered originals. Keep them explicitly labelled and do not represent their historical provenance as fully recovered.

The latest live check confirms that `information_schema.role_table_grants` returns zero rows for `anon` and `authenticated` in `public`. The remaining managed-role default ACL is a separate, unresolved future-object risk.


## Live remediation applied — 2026-10-21

The following five release migrations were applied to the active Pheonix Supabase project in order and recorded in the migration ledger using the versions below:

- `20261021220303_revoke_browser_table_grants`
- `20261021220321_process_creator_payout_atomically`
- `20261021220327_encrypt_cohort_date_of_birth`
- `20261021220333_cohort_login_rate_limits`
- `20261021220849_revoke_trigger_function_browser_execute`

Post-migration verification confirmed zero explicit public-table grant rows for `anon` and `authenticated`. The managed `supabase_admin` default ACL remains unresolved because the connected role cannot alter that role's defaults. The DOB schema change is live and `COHORT_DOB_ENCRYPTION_KEY` is provisioned in Vercel production and preview. The active `cohort_accounts` table currently has zero rows, so there are no existing plaintext DOB records to backfill. Application deployment remains separate from this database migration.


The trigger-function hardening migration also removed direct `EXECUTE` rights from browser roles for trigger-only functions, including `update_admins_updated_at`, `set_updated_at`, and the cohort validation triggers. Live verification confirms browser roles cannot execute the protected trigger functions; PostgreSQL triggers continue to execute them normally.
