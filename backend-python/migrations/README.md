# Learnora organisation audit remediation and migration reconciliation

## Safety status

- Proposed repository changes are on `fix/learnora-audit-tenant-isolation` in draft PR [#7](https://github.com/Obikpe/Pheonix-Analytics/pull/7).
- The user confirmed that the active Supabase project is `Pheonix` (`gihfupzvdpyrmynqgukz`). The deployed Vercel backend's environment variables have not been independently inspected to verify that it points to this project.
- All live database queries during this work were read-only. No migration was applied, no production data was changed, no merge occurred and no Vercel deployment was created.
- The proposed migration remains in this folder as a review artifact. Do not run it or the Supabase CLI against the canonical migration directory until the history drift described below is reconciled.

## Live migration history and repository mapping

The active project's `supabase_migrations.schema_migrations` table contained these nine records:

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

The repository's canonical numbered SQL chain is under `supabase/migrations/`. The registered names for the organisation portal and migrations 017–022 align with files 016–022. The live registry does not contain matching records for 001–015; `add_learnora_ai_profiles` does not match the filenames `014_learnora_ai_foundation.sql` or `015_learnora_ai_permissions.sql`. The `learner_onboarding_profiles` record also has no matching numbered file among 001–022.

The live schema lacks legacy tables `tracks`, `enrollments`, `user_progress`, `user_project_progress` and `community_qna` from `001_initial.sql`, while newer Learnora equivalents such as `learnora_learning_paths`, `learnora_enrolments`, `learnora_lesson_progress` and `learnora_discussions` exist. This may be intentional replacement, but the earlier scripts and data lineage still need an explicit applied/not-applied mapping. Do not manually mark migrations applied or replay older SQL by filename alone.

## Proposed remediation migration contents

The proposed `023_learnora_audit_remediation.sql` is **not applied**. It:

- permits the `community` organisation type already accepted by the API;
- backfills quiz-to-module associations, sets a 70% default and validates a non-null passing score between 70 and 100;
- adds a team-course assignment relation and persistent AI quota reservations with a transaction-locked RPC;
- validates team, cohort, course-access and enrolment tenant relationships at the database boundary, including active workspace/resource state and published-course requirements;
- distinguishes organisation-wide course grants (`access_type = assigned`) from scoped individual/team/cohort grants (`access_type = scoped`) so a scoped assignment cannot grant all learners access; course-content reads validate the active membership/assignment source and current course entitlement;
- counts course capacity across organisation-owned courses, organisation grants, team assignments and cohort assignments without double-counting the same course, and serialises these checks under transaction-scoped advisory locks;
- deactivates team/cohort memberships and clears a team-manager assignment when organisation membership is suspended or moved;
- serialises capacity checks under concurrent writes, rejects cohort-capacity reductions below current active membership, and adds capacity/date-range constraints;
- fixes capacity-trigger update fast paths, pins the relevant Learnora timestamp-trigger function search path, and constrains AI quota scope values;
- revokes inherited `PUBLIC` and direct `anon`/`authenticated` table privileges from the listed RLS-protected organisation, course catalogue/creator, contract, AI, enrolment, learning-path/discussion and assessment/progress tables, while explicitly retaining `service_role` access to the two new tables.

The live schema already has `learnora_capacity_reservations` with resource type, quantity, used quantity, status and expiry, but the inspected capacity service uses current counts and contract entitlements; no live capacity trigger/routine was found. Do not create a second capacity-reservation table or double-count reservation quantities until the existing table's intended contract-allocation role is confirmed.

## RLS and grants

RLS is enabled on the inspected organisation tables but there are no table-specific policies. The grant audit found broad table privileges for `anon` and `authenticated`; those roles are currently denied by the no-policy RLS state, but broad grants create latent risk if policies are added later. The proposed migration removes inherited/direct browser-role table grants on the listed RLS-protected tables after reviewing the repository's learner/course entry points, which use the backend API rather than direct Supabase table access. It does not add blanket RLS policies. Any future direct-client path needs explicit, least-privilege grants and policies.

The Security Advisor reported three functions with mutable `search_path`. The proposed migration pins the Learnora timestamp-trigger function used by organisation/course/cohort records and the new security-definer functions. The other two findings (`set_updated_at`, also used by internal staff/team tables, and `update_admins_updated_at`, used by internal administrator records) remain outside this organisation-only scope.

## Verification

Run `verify_live_schema.sql` before a reviewed migration. After applying to a disposable or approved target, run `verify_post_migration.sql` for team/cohort course assignment integrity, AI usage-log carry-forward, new-table RLS, browser grants and security-definer function settings. Both scripts are read-only. The pre-migration script reports migration records, relevant columns, constraints, RLS/policy state, grants, triggers/functions and integrity/capacity/date preflight counts. The current snapshot returned zero conflicts for the seven tenant-integrity checks and zero violations for the capacity/date checks; these are point-in-time results, not a guarantee for future writes.

The detailed Step 4 inventory, workflow findings, proposed resource-scoped role-assignment table and staged migration plan are in `STEP_4_ORGANISATION_DATA_MODEL_PLAN.md`.

## Automated tests

Backend regression tests passed on earlier commits. After the later scoped-access, entitlement and SQL-capacity changes, backend regression tests, backend verification, quality checks and frontend builds are running again on the newest branch head; final status must be checked before considering the branch verified. SQL has not been executed or linted against a non-production database, and no concurrency/load test has been performed. Do not merge or deploy until the migration history is reconciled, the proposed SQL is reviewed/tested on a non-production database, the deployed backend target is confirmed, and the schema migration is safely applied.
