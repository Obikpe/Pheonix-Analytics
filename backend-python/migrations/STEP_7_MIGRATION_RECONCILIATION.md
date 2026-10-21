# Step 7 — Historical migration reconciliation

**Scope:** read-only reconciliation of repository SQL history against the confirmed active Pheonix Supabase project `gihfupzvdpyrmynqgukz`. No migration-history rows were fabricated, no historical SQL was replayed, and no production learner or organisation records were changed for this review.

## Evidence collected

- Repository source migrations `supabase/migrations/001_initial.sql` through `022_community_discussions.sql` are present on this branch.
- The `backend-python/migrations/` folder contains remediation migrations 023–027 plus verification scripts and this audit documentation; it is not the source of the original 001–022 sequence.
- The live Supabase migration registry contains:
  - `20261008100924 add_learnora_ai_profiles`
  - `20261009225421 learnora_organisation_portal`
  - `20261009230311 individual_learner_enrolments`
  - `20261009230330 learner_lesson_notes`
  - `20261009230703 ai_lesson_summariser_profile`
  - `20261009231536 mark_witstart_pilot_mode`
  - `20261009231754 cohort_course_assignments`
  - `20261009232328 community_discussions`
  - `20261011051442 learner_onboarding_profiles`
  - `20261020230826 learnora_audit_remediation`
  - `20261020230906 restore_shared_learner_grants_and_lock_trigger_routines`
  - `20261020232148 allow_unlimited_monthly_ai_quota`
  - `20261020234717 pin_shared_timestamp_trigger_search_path`
  - `20261020234813 revoke_browser_grants_from_org_control_tables`
- The registry records for 016–022 correspond by name to the repository's 016–022 feature migrations. The earlier records use timestamp versions and descriptive names, not the numbered 001–015 filenames.

## Reconciliation matrix

| Source migration(s) | Live evidence | Decision |
|---|---|---|
| 001 — initial schema | `courses`, `lessons`, and `audit_logs` exist; `tracks`, `enrollments`, `user_progress`, `community_qna`, and `user_project_progress` do not appear as live public tables. | **Partially superseded / unresolved.** Do not replay as-is; old tables and current replacements need explicit mapping. |
| 002 — Learnora foundation | Its principal organisation, cohort, course, module, lesson, enrolment, quiz, project, skill, certificate, badge, recommendation, AI usage and feedback tables exist in the live public schema. | **Object coverage observed; migration execution not proven.** Table existence alone does not prove column, constraint, index, policy, trigger or data-backfill equivalence. |
| 003 — identity bridge | Target organisation/membership/cohort tables exist. This migration also inserts the Witstart organisation and migrates users into memberships and a cohort. | **Data lineage unresolved.** Do not replay a data migration with live inserts/updates without comparing its intended rows to current data. |
| 004–012 — permissions, staff, commercial entitlements, learning structure, creator economy, platform operations, backend hardening/completion, and organisation teams | The principal tables declared by these migrations are present in the live public schema. | **Object coverage observed; exact definitions and seed-data equivalence not proven.** Preserve the live schema until a structural diff and row-level reconciliation are available. |
| 013 — lifecycle constraints | `cohorts` and `organisation_members` exist. | **Constraint state requires explicit comparison.** Do not drop/re-add constraints solely to recreate history. |
| 014 — AI foundation | `learnora_ai_providers`, `learnora_ai_conversations`, `learnora_ai_messages`, and `learnora_ai_limits` exist. | **Object coverage observed; definitions and seed data not proven equivalent.** |
| 015 — AI permissions | Permission and AI limit tables exist. This migration seeds role permissions and a global AI limit. | **Seed-data equivalence unresolved.** Compare the expected permission/limit rows before any replay. |
| 016–022 — organisation portal through community discussions | Live registry has descriptive entries matching these feature names; corresponding core tables are present. | **Registry/name match observed.** Still retain schema-diff and data validation before declaring every object identical to source. |
| 023–027 — current audit remediation | Live registry contains the five remediation entries, including AI quota behaviour, search-path hardening, and browser-grant hardening. | **Recorded as applied.** Post-change checks for the latest grant revocation returned zero `anon`/`authenticated` grants across the 18 targeted control tables. |

## Why this is not marked “fully reconciled”

The database registry proves which migration versions were recorded, not that an unrecorded SQL file was never executed manually. Likewise, finding a table proves neither that the original migration created it nor that its columns, constraints, indexes, triggers, RLS policies, grants and seed rows still match the source. The historical 001–015 files include schema changes and data-seeding steps; replaying them or inserting synthetic registry entries could corrupt current state or conceal drift.

## Safe completion procedure

1. Obtain a current schema-only dump (including constraints, indexes, triggers, functions, policies, grants and views) and a database backup/snapshot before changes.
2. Diff that snapshot against the exact definitions in migrations 001–015 and any currently deployed historical source, then separately reconcile data-seeding migrations 003, 004, 006, 009, 014 and 015.
3. For each source migration, record one evidence-backed state: **applied-equivalent**, **partially superseded**, **not applied**, or **unknown**. Record object-level evidence and any replacement migration.
4. Only add missing migration history through an approved reconciliation plan after the schema/data proof is reviewed. Never insert old history rows simply to make the registry look complete.
5. Run authenticated API and concurrency tests against a disposable staging tenant before release.

## Other Step 7 verification

- All four GitHub Actions workflows passed for commit `4155a4e68b8408bf0ec64a728bfb70a166e14dcb`: backend regression tests, backend verification, frontend builds, and quality checks.
- Current production deployment metadata points to `main` commit `48d0595e7e8157414177f37ab621ea8b79821b07`; it is not evidence that the audit branch has been deployed.
- Vercel reports `SUPABASE_URL` as a sensitive production/preview environment variable but does not expose its value to this inspection. The running backend's database target therefore remains unverified.
- The current Supabase Security Advisor reports 92 RLS-enabled tables without policies (INFO) and one mutable-search-path warning on `public.update_admins_updated_at` (WARN). The latter concerns internal administrator records and remains outside this organisation-side scope. A lack of policies is not automatically proof of exposure; grants and the actual access path must be evaluated table by table. No blanket policy or grant change was made.
- The performance advisor also reports a duplicate index on `learnora_platform_admins`, an internal platform-administration table excluded from this scope; it was not modified.

**Release status:** not cleared for merge/deployment until production target verification, the approved historical schema/data reconciliation, and staging end-to-end/concurrency tests are complete.
