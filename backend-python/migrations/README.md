# Learnora audit remediation and migration reconciliation

## Safety status

- These are proposed repository changes on `fix/learnora-audit-tenant-isolation`.
- The connected Supabase project was queried read-only during the audit. Its project reference has **not** been independently matched to the Supabase URL/key used by the deployed Vercel backend.
- No migration was applied to any database, no production data was changed, and no Vercel deployment was created.
- Do not merge/deploy the backend changes until migration `023_learnora_audit_remediation.sql` has been reviewed and applied to the confirmed target project.

## Existing migration history observed in the connected Supabase project

The `supabase_migrations.schema_migrations` table contained these nine records:

| Version | Migration name | Schema area to reconcile |
| --- | --- | --- |
| 20261008100924 | add_learnora_ai_profiles | AI profile/provider tables and configuration |
| 20261009225421 | learnora_organisation_portal | organisation portal, organisation/team/cohort structures |
| 20261009230311 | individual_learner_enrolments | individual course enrolments |
| 20261009230330 | learner_lesson_notes | learner lesson notes |
| 20261009230703 | ai_lesson_summariser_profile | summariser AI profile |
| 20261009231536 | mark_witstart_pilot_mode | pilot-mode organisation settings |
| 20261009231754 | cohort_course_assignments | cohort/course assignment relationships |
| 20261009232328 | community_discussions | community discussion features |
| 20261011051442 | learner_onboarding_profiles | learner onboarding profiles |

The repository also contains numbered SQL scripts, but those filenames do not correspond one-to-one with these timestamped migration records. The migration history above proves which migration records were registered in the connected project; it does **not** prove that every numbered repository SQL file was applied there, nor that this is the deployment's project.

## Remediation migration contents

The proposed additive migration is kept under `backend-python/migrations/` as a review artifact, not in the canonical `supabase/migrations/` chain, until this drift is reconciled. Do not move or apply it through the migration runner before that review.

The proposed additive migration:

- permits the `community` organisation type already offered by the API consumer;
- associates quizzes with modules, backfills the association from each quiz's lesson, and sets the minimum passing score to 70%;
- adds persistent, atomic AI quota reservations and a transaction-locked quota RPC;
- adds a team-course assignment table for corporate/team-based training;
- adds database triggers that serialise capacity checks and enforce contract limits inside the same transaction as writes, including cohort member capacity.

It is deliberately **not** executed by this change. Confirm the target project, review the generated SQL and take a database backup before applying it.

## Verification queries

Run `verify_live_schema.sql` against the confirmed target project to record the registered migration history, expected tables/columns, organisation type constraint, quiz threshold default, installed trigger/function definitions, RLS/policy status and tenant-integrity preflight counts. The script is safe before or after the proposed migration (missing optional tables return no rows). Save its output with the deployment change record.

The detailed Step 4 inventory, gap analysis and staged additive migration plan is in `STEP_4_ORGANISATION_DATA_MODEL_PLAN.md`.

## Automated tests

Regression tests live under `backend-python/tests/`. The workflow in `.github/workflows/learnora-backend-tests.yml` runs them on pull requests. They have not been executed in this editing session; the first CI run must be treated as the runtime verification gate.
