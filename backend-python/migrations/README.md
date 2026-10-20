# Learnora organisation audit remediation and migration reconciliation

## Safety status

- Proposed repository changes are on `fix/learnora-audit-tenant-isolation` in draft PR [#7](https://github.com/Obikpe/Pheonix-Analytics/pull/7).
- The user confirmed that the active Supabase project is `Pheonix` (`gihfupzvdpyrmynqgukz`). The deployed Vercel backend's environment variables have not been independently inspected to verify that it points to this project.
- On 2026-10-20, the user explicitly requested applying the organisation audit migration to the actual Pheonix project. Supabase recorded `learnora_audit_remediation` as version `20261020230826`; a follow-up scope correction was recorded as `restore_shared_learner_grants_and_lock_trigger_routines` version `20261020230906`.
- The SQL was first executed inside a transaction and rolled back as a production-schema dry run, then applied using the Supabase migration tool. Post-apply checks confirmed both new tables, all four routines, 17 triggers, zero current tenant/capacity/quiz-threshold violations, and three carried-forward AI usage reservations.
- The first migration also revoked browser-role grants on shared learner/course/progression tables outside the intended organisation-only scope. The follow-up migration restored those prior grants while leaving RLS enabled and without adding policies, and revoked browser execution on all four SECURITY DEFINER routines. These two production migration records are now part of the live history.
- No merge or Vercel deployment was created by this work. The deployed Vercel backend's environment variables have not been independently inspected to verify that it points at this project.

## Live migration history and repository mapping

The active project's `supabase_migrations.schema_migrations` table contained the original nine records plus the two audit remediation records applied on 2026-10-20:

| Version | Registered migration |
| --- | --- |
| 20261008100924 | add_learnora_ai_profiles |
| 20261009225421 | learnora_organisation_portal |
| 20261009230311 | individual_learner_enrolments |
| 20261009230330 | learner_lesson_notes |
| 20261009230703 | ai_lesson_summariser_profile |
| 20261009231536 | mark_witstart_pilot_mode |
| 20261009231754 | cohort_course_assignments |
| 20261009232328 | community_discussions |
| 20261011051442 | learner_onboarding_profiles |
| 20261020230826 | learnora_audit_remediation |
| 20261020230906 | restore_shared_learner_grants_and_lock_trigger_routines |
| 20261020232148 | allow_unlimited_monthly_ai_quota |

The repository's canonical numbered SQL chain is under `supabase/migrations/`. The registered names for the organisation portal and migrations 017–022 align with files 016–022. The live registry does not contain matching records for 001–015; `add_learnora_ai_profiles` does not match the filenames `014_learnora_ai_foundation.sql` or `015_learnora_ai_permissions.sql`. The `learner_onboarding_profiles` record also has no matching numbered file among 001–022.

The live schema lacks legacy tables `tracks`, `enrollments`, `user_progress`, `user_project_progress` and `community_qna` from `001_initial.sql`, while newer Learnora equivalents such as `learnora_learning_paths`, `learnora_enrolments`, `learnora_lesson_progress` and `learnora_discussions` exist. This may be intentional replacement, but the earlier scripts and data lineage still need an explicit applied/not-applied mapping. Do not manually mark migrations applied or replay older SQL by filename alone.

## Applied remediation migration contents

`023_learnora_audit_remediation.sql` was applied to Pheonix under live migration version `20261020230826`. The follow-up scope correction is recorded in `024_restore_shared_learner_grants_and_lock_trigger_routines.sql` and live version `20261020230906`. It:

- permits the `community` organisation type already accepted by the API;
- backfills quiz-to-module associations, sets a 70% default and validates a non-null passing score between 70 and 100;
- adds a team-course assignment relation and persistent AI quota reservations with a transaction-locked RPC;
- validates team, cohort, course-access and enrolment tenant relationships at the database boundary, including active workspace/resource state and published-course requirements;
- distinguishes organisation-wide course grants (`access_type = assigned`) from scoped individual/team/cohort grants (`access_type = scoped`) so a scoped assignment cannot grant all learners access; course-content reads validate the active membership/assignment source and current course entitlement;
- counts course capacity across organisation-owned courses, organisation grants, team assignments and cohort assignments without double-counting the same course, and serialises these checks under transaction-scoped advisory locks;
- deactivates team/cohort memberships and clears a team-manager assignment when organisation membership is suspended or moved;
- serialises capacity checks under concurrent writes, rejects cohort-capacity reductions below current active membership, and adds capacity/date-range constraints;
- fixes capacity-trigger update fast paths, pins the relevant Learnora timestamp-trigger function search path, and constrains AI quota scope values;
- revokes inherited `PUBLIC` and direct `anon`/`authenticated` table privileges from the listed RLS-protected organisation, course catalogue/creator, contract, AI, enrolment, learning-path/discussion and assessment/progress tables, while explicitly retaining `service_role` access to the two new tables. The follow-up migration restores prior grants on shared learner/course/progression tables outside the organisation-only scope; organisation/contract/AI/access tables remain backend-only for browser roles.

The live schema already has `learnora_capacity_reservations` with resource type, quantity, used quantity, status and expiry, but the inspected capacity service uses current counts and contract entitlements; no live capacity trigger/routine was found. Do not create a second capacity-reservation table or double-count reservation quantities until the existing table's intended contract-allocation role is confirmed.

## RLS and grants

RLS is enabled on the inspected organisation tables but there are no table-specific policies. The grant audit found broad table privileges for `anon` and `authenticated`; those roles are currently denied by the no-policy RLS state, but broad grants create latent risk if policies are added later. Migration 023 removed inherited/direct browser-role table grants on organisation, contract, AI, access and some shared learner/course tables. Migration 024 restored the prior grants on shared learner/catalogue/progress tables outside the organisation-only scope. Neither migration adds RLS policies. Organisation/contract/AI/access tables remain without browser-role grants. Any future direct-client path needs explicit, least-privilege grants and policies.

The Security Advisor reported three functions with mutable `search_path`. Migration 023 pins the Learnora timestamp-trigger function used by organisation/course/cohort records and the new security-definer functions. Migration 024 also revokes browser EXECUTE on the four SECURITY DEFINER routines. The other two findings (`set_updated_at`, also used by internal staff/team tables, and `update_admins_updated_at`, used by internal administrator records) remain outside this organisation-only scope.

## Verification

Run `verify_live_schema.sql` for future reconciliation work. The production migration has now been applied and checked read-only for table/routine/trigger existence, zero current tenant/capacity/quiz-threshold violations, browser grants on organisation tables, and restricted execution privileges on the SECURITY DEFINER routines. Run `verify_post_migration.sql` for the fuller repeatable check. Both verification scripts are read-only. The pre-migration script reports migration records, relevant columns, constraints, RLS/policy state, grants, triggers/functions and integrity/capacity/date preflight counts. The current snapshot returned zero conflicts for the seven tenant-integrity checks and zero violations for the capacity/date checks; these are point-in-time results, not a guarantee for future writes.

The detailed Step 4 inventory, workflow findings, proposed resource-scoped role-assignment table and staged migration plan are in `STEP_4_ORGANISATION_DATA_MODEL_PLAN.md`.

## Automated tests

The production SQL transaction dry run completed without SQL errors and the migration tool reported success. Post-migration verification passed for the checks listed above. The Security Advisor still reports 92 RLS-enabled tables with no policies across the project and two mutable-search-path warnings on out-of-scope functions (`set_updated_at`, `update_admins_updated_at`). No concurrency/load test has been performed. Migration-history drift for older repository files 001–015 remains unresolved; do not replay or mark those files applied without object-level evidence. Confirm the deployed backend target and finish CI checks before merge/deployment.


## Step 5 — backend workflow follow-up

A code review of the AI quota path found a live-path defect: the Python limit resolver deliberately represents an unlimited monthly quota as `NULL`, and the quota RPC already skips the monthly comparison for `NULL`, but migration 023's function rejects `NULL` before that comparison. As a result, requests using the default/no-monthly-cap configuration can fail closed with `quota_unavailable`.

- Added `025_allow_unlimited_monthly_ai_quota.sql` to preserve the intended contract: the daily limit is required, while a null monthly limit means unlimited.
- Added `tests/test_ai_quota_reservation.py` to cover the Python-to-RPC payload for unlimited monthly quotas and malformed RPC responses.
- Migration 025 was dry-run inside a transaction and then applied to the active Pheonix project on 2026-10-20. The live migration registry records it as `20261020232148` (`allow_unlimited_monthly_ai_quota`).
- Read-only post-apply verification confirmed the deployed function permits a `NULL` monthly limit while requiring a daily limit, remains `SECURITY DEFINER`, denies EXECUTE to `anon` and `authenticated`, and grants EXECUTE to `service_role`.
- On PR head `49b67f707d9cdcb84a4e7a13d425684d3b07e88b`, backend regression tests, quality checks, backend verification and frontend CI all completed successfully. These runs are evidence for that commit only; rerun after any further changes.
- No Vercel deployment was created.

## Step 6 — final production verification and release gates

Read-only verification was rerun against the confirmed active Pheonix project `gihfupzvdpyrmynqgukz` on 2026-10-21.

### Confirmed against the live database

- Supabase reports the project as `ACTIVE_HEALTHY` on PostgreSQL 17.
- The live migration registry contains all three remediation versions: `20261020230826` (`learnora_audit_remediation`), `20261020230906` (`restore_shared_learner_grants_and_lock_trigger_routines`) and `20261020232148` (`allow_unlimited_monthly_ai_quota`).
- `team_course_assignments`, `learnora_ai_quota_reservations` and `reserve_learnora_ai_quota` exist.
- Read-only integrity counts returned zero active team memberships without an active organisation membership, zero active cohort memberships without an active organisation membership, and zero over-capacity cohorts.
- The quota reservation RPC remains `SECURITY DEFINER`; `anon` and `authenticated` cannot execute it directly, while `service_role` can.
- The audited organisation, contract, team-course-assignment and AI-quota tables have zero direct `anon`/`authenticated` table-grant rows.

These are point-in-time checks of the database schema and existing rows. They do not substitute for exercising authenticated HTTP requests or race conditions.

### CI on the latest branch head

For commit `6a9b7e60238571d1f14fddd1a842cb3df971fdd9`, all four GitHub Actions workflows completed successfully:

- [Learnora backend regression tests](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39515762112)
- [Learnora Backend Verification](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39515762532)
- [Learnora frontends](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39515762204)
- [Learnora quality checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39515762081)

The backend verification workflow passed compilation, import validation, static undefined-name/syntax checks, application import and API smoke test. Both configured frontend builds also passed.

### Remaining release blockers

1. **Legacy migration reconciliation:** live history still has no matching records for repository migrations 001–015, and several legacy tables are absent while newer equivalents exist. Map each legacy migration to live objects/data lineage before marking it applied, replaying it or claiming full history reconciliation.
2. **Deployed backend target:** Vercel production and preview environment metadata contains `SUPABASE_URL`, but the value was not returned by the available non-decrypting environment inspection. Therefore, the running backend's connection to this Pheonix project is still unverified.
3. **End-to-end security tests:** run authenticated tests for tenant boundary failures, organisation deactivation, membership removal/revocation, course assignment revocation, contract/feature entitlement changes and assessment gating.
4. **Concurrency/failure tests:** test simultaneous capacity claims and AI quota reservations, provider failures/retries, and idempotency against a disposable test tenant or staging environment.
5. **Security Advisor:** 92 RLS-enabled tables without policies and two mutable-search-path warnings remain reported. The organisation tables audited above have no browser grants, but the project-wide findings require a separately scoped review.

**Release decision:** do not merge or deploy on the strength of CI alone. The draft PR remains open; no Vercel deployment was created as part of Step 6.

## Follow-up blocker remediation (2026-10-21)

- Closed the legacy platform-admin escalation in `routers/permissions.py`: a legacy `role="super_admin"` value no longer manufactures a platform role and no longer bypasses an organisation access lookup. Global authority now depends on an active row in `learnora_platform_admins`. Added `tests/test_platform_admin_authority.py` covering the legacy-role denial and active-platform-role allow cases.
- Applied `ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public` to the active Pheonix database through a recorded Supabase migration named `pin_shared_timestamp_trigger_search_path`. The repository copy is `026_pin_shared_timestamp_trigger_search_path.sql`. The separate `update_admins_updated_at` warning concerns internal administrator records and remains outside this organisation-side scope.
- **Vercel target verification remains blocked:** the Vercel environment connector returns the `SUPABASE_URL` entry as sensitive metadata without a readable value, so it has not established whether the currently deployed `learnora-backend` production function points to the active Pheonix project. Do not assume this is fixed based on the project environment variable merely existing. Verify the URL in Vercel's project settings without exposing service keys; if it differs, update it and perform a controlled deployment after approval.
- **Historical migration reconciliation remains intentionally non-destructive:** the live registry lacks matching versions for repository migrations 001–015 and the live schema contains newer replacements for several legacy tables. No historical rows were fabricated and no old migration was replayed. To finish, compare the full numbered SQL contents and object/data lineage with a schema/data snapshot or backup; only then record a migration-by-migration applied/superseded/not-applied decision.
- **HTTP and concurrency release tests remain required:** the new unit regression tests close the identified role-resolution bypass, but authenticated cross-tenant API tests, contract/deactivation/revocation flows, the 70% assessment gate, and simultaneous capacity/quota reservation races still require a disposable staging tenant and valid test credentials. No production learner/tenant records were mutated to simulate these cases.
- The project-wide Security Advisor still reports many RLS-enabled tables without policies. For organisation/contract/AI/access tables, browser-role table grants remain absent and backend service-role access is used. Do not apply a blanket revoke to shared learner/course/progress tables: that would undo the scope correction in migration 024 and may break legitimate application flows. The unrelated internal-admin trigger warning also remains explicitly out of scope.
- No PR merge or Vercel deployment was performed. These follow-up changes require fresh CI on the new branch head before merge readiness can be assessed.
