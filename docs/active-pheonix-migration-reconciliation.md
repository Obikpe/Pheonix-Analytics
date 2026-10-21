# Active Pheonix migration reconciliation — 2026-10-21

## Scope and safety

This review compares the repository migration filenames with the migration ledger and the live schema in Supabase project `gihfupzvdpyrmynqgukz`. Database inspection was read-only. No live rows, schema objects, or migration history were changed. Do not merge or deploy this branch based only on the cohort CI run.

## Reconciliations completed on this branch

The repository migration files that clearly correspond to applied versions in the active migration ledger were renamed to the exact recorded versions:

| Recorded version | Repository migration |
| --- | --- |
| `20261009225421` | `learnora_organisation_portal` |
| `20261009230311` | `individual_learner_enrolments` |
| `20261009230330` | `learner_lesson_notes` |
| `20261009230703` | `ai_lesson_summariser_profile` |
| `20261009231536` | `mark_witstart_pilot_mode` |
| `20261009231754` | `cohort_course_assignments` |
| `20261009232328` | `community_discussions` |
| `20261021161056` | `fix_cohort_archive_enrolment_status` |
| `20261021161237` | `cohort_archive_fk_indexes` |

The last two changes were checked against live database effects: the installed `archive_and_close_cohort(uuid, uuid, text)` function body matches the source migration body after whitespace normalization, and the indexes declared in `cohort_archive_fk_indexes` exist in the active schema. The CI migration sequence now uses the recorded cohort versions.

## Read-only live-schema observations

- The cohort learner, track/course assignment, lesson assignment, progress, lifecycle, and archive tables exist in `public`.
- RLS is enabled on the inspected cohort tables.
- The archive RPC and the three assignment/progress validation trigger functions are `SECURITY DEFINER`, pin an empty `search_path`, and have execution grants limited to the database owner and `service_role` in the inspected ACLs.
- The expected cohort-account, track/member/course assignment, archive and progress indexes are present.
- These observations validate selected objects only; they are not a full schema dump or proof that every repository migration matches production.

## Blocking reconciliation still open

1. Repository migrations `001_initial.sql` through `015_learnora_ai_permissions.sql` use short numeric versions that do not appear in the active Supabase migration ledger. The ledger instead contains timestamped history. Some of these old files contain non-idempotent `CREATE TABLE` statements, so blindly running `supabase db push` could fail or conflict with the existing schema.
2. The active ledger includes applied migrations for which matching source files are not present in the repository: `20261011051442_learner_onboarding_profiles`, `20261020230826_learnora_audit_remediation`, `20261020230906_restore_shared_learner_grants_and_lock_trigger_routines`, `20261020232148_allow_unlimited_monthly_ai_quota`, `20261020234717_pin_shared_timestamp_trigger_search_path`, and `20261020234813_revoke_browser_grants_from_org_control_tables`.
3. The initial schema's authoritative baseline and exact mapping from the old `001`–`015` files to the live migration ledger have not been established. Do not fabricate historical migration entries or mark unverified SQL as applied.

## Required before release

- Recover the exact SQL for missing applied migrations from a trusted source or produce a reviewed schema baseline/squash migration using a controlled, separately approved process.
- Reconcile the initial baseline and all migration versions against the active ledger without replaying old DDL or editing the live migration history ad hoc.
- Run a disposable, full-schema staging journey (provision learner, activate/login, assign track/course/lessons, read/write progress, close and archive cohort) before merge/deployment.
- Keep the draft PR open until these checks pass.

## CI scope limitation

The PostgreSQL GitHub Actions test uses a synthetic baseline and isolated fixture data. It proves the selected cohort migrations and assertions execute against that fixture; it is not production schema parity and does not connect to Supabase.
