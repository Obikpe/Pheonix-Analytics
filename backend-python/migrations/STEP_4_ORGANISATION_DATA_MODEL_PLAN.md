# Step 4 — Organisation data model and migration plan

## Scope and safety

Target database confirmed by the user: active Supabase project **Pheonix**, project reference `gihfupzvdpyrmynqgukz`.

This is a proposed plan and verification record. It does not apply SQL, change data, merge a pull request, or deploy a service. The app's deployed Supabase URL/key has not been independently inspected from Vercel, so project selection is based on the user's confirmation. Before a production migration, verify the Vercel environment points at this project and take a restorable backup.

Only customer-organisation workflows are in scope: organisation owner/manager, team, cohort, programme, tutor, learner, course access, contracts/entitlements, AI use and progression. Learnora's internal platform administrator and internal team-member workflows are out of scope.

## 1. Live schema inventory

The active project already contains the following structures; reuse them rather than creating parallel equivalents.

| Concern | Existing structures |
|---|---|
| Organisation and tenant membership | `organisations`, `organisation_members` |
| Team membership | `organisation_teams`, `organisation_team_members` |
| Cohorts and membership | `cohorts`, `cohort_members`, `learnora_cohort_lifecycle`, `learnora_cohort_lifecycle_events` |
| Programmes and course ordering | `learnora_programmes`, `learnora_programme_courses` |
| Cohort course assignment | `cohort_course_assignments` |
| Organisation course access | `course_access`, `learnora_access_entitlements`, `learnora_enrolments` |
| Contract and entitlements | `learnora_contracts`, `learnora_contract_entitlements`, `learnora_contract_versions`, `learnora_contract_clauses` |
| Capacity reservation records | `learnora_capacity_reservations` (resource type, quantity, used quantity, status, expiry) |
| AI limits and usage | `learnora_ai_limits`, `ai_usage_logs` |
| Assessment and progress | `quizzes`, `quiz_attempts`, `course_modules`, `learnora_lessons` |

At inspection time, the live database had nine registered migration records (through `20261011051442`, `learner_onboarding_profiles`). The numbered repository SQL scripts are not a one-to-one representation of that timestamped history. Therefore, do not infer that a numbered script is already applied solely because it exists in GitHub.

## 2. Confirmed gaps and risks

### A. Tenant integrity is mostly enforced in application code

The current foreign keys prove that a team, cohort, course, or user exists, but by themselves they do not prove the linked records belong to the same organisation. The backend should validate active organisation membership before team/cohort enrolment and should scope every read/update/delete by the tenant ID.

**Proposed database protection:** add database-side integrity checks for:
- active team membership → active membership in the same organisation as the team;
- active cohort membership → active learner membership in the cohort's organisation;
- cohort programme → programme from the same organisation;
- cohort/team course assignment → a course the organisation is permitted to use; organisation-owned courses must belong to that same organisation;
- team manager → an active member of that organisation.

Prefer composite foreign keys only where the schema can represent the tenant key without duplicating inconsistent data. For cross-table status rules and relationships that cannot be expressed by a foreign key, use a carefully scoped trigger or transactional RPC. Preflight existing rows before adding constraints; do not delete or silently rewrite conflicting rows.

### B. Team membership endpoint accepted users without verifying tenant membership

The team endpoint previously upserted a user into `organisation_team_members` after checking the team's organisation, but did not check that the target user was an active member of that same organisation, nor validate the team-specific role. Fix this in the backend now and add regression tests. Database-side protection remains necessary for writes outside this endpoint.

### C. Team course assignments are missing

The live schema has cohort course assignments, but no `team_course_assignments` table. A team-first corporate workflow needs an explicit relation rather than pretending team assignments are cohort assignments. Proposed migration 023 introduces this table; review it for tenant/course ownership checks and verify it against the live schema before applying.

### D. Capacity checks are race-prone in Python alone

The current `services/capacity.py` reads current counts and then the route writes a new row. Concurrent requests can both pass that check. The live schema also contains `learnora_capacity_reservations` with resource type, quantity, used quantity, status and expiry, but the inspected capacity service reads live table counts and contract entitlements rather than using that table; no live capacity trigger/routine was found. Before deciding whether that table represents reserved contract allocation or should participate in enforcement, inspect its writers and contract workflow. Do not double-count its quantities alongside live member/course counts.

The proposed SQL capacity trigger in migration 023 serialises capacity checks with transaction-scoped advisory locks. Its update fast paths have been hardened so moving an active record between organisations or changing a course cannot bypass the destination capacity check. The Python check remains for friendly errors; the database is the concurrency authority once the migration is reviewed and applied.

Cohort member capacity is enforced in the same transaction as insertion/reactivation. Lowering a cohort capacity below current active membership is rejected; it must not silently remove learners.

### E. AI quota reservations are missing

The live schema has `learnora_ai_limits` and `ai_usage_logs`, but no `learnora_ai_quota_reservations` or `reserve_learnora_ai_quota` routine at inspection time. The proposed migration backfills usage logs and adds atomic reservations. Before applying, test quota identity/lock-key consistency, daily/monthly boundaries, per-user versus organisation aggregation, failed AI requests, and duplicate retries. Reservation must be recorded before calling the provider, and failures must follow an explicit policy so retries cannot evade limits.

### F. RLS enabled with no table-specific policies

The Security Advisor reported numerous tables with RLS enabled but no policies, including organisation tables. A read-only grant audit confirmed that `anon` and `authenticated` currently have broad table privileges (including SELECT/INSERT/UPDATE/DELETE) on the inspected organisation, cohort, course-access, contract, enrolment and AI-limit tables. With RLS enabled and no policies, these roles are currently default-denied at the row-policy layer; this is not proof of current row exposure. However, broad grants create a latent risk if a policy is added later. The backend uses a privileged Supabase client, so RLS does not replace application tenant checks for backend requests. Do not add broad `USING (true)` policies. Before migration, audit all frontend paths for direct table access. If those tables are API-only, revoke table privileges from `anon` and `authenticated` and retain least-privilege server access; if a direct-client path is intentional, write narrow policies and grant only the exact operations it requires.

Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

### G. Mutable search path warnings

The Security Advisor reported three functions with mutable `search_path`. The proposed migration pins the two shared timestamp-trigger functions used by organisation/course records to `pg_catalog, public` and pins the new security-definer functions as well. The remaining `update_admins_updated_at` function is specific to internal administrator records and remains outside this organisation-workspace scope. Re-run the Security Advisor after migration to confirm the remaining finding is understood and tracked.

### H. Resource-scoped roles need a representation

The organisation membership role check currently represents `owner`, `admin`, `instructor`, and `learner`. Team manager, cohort manager and programme manager should not become tenant-wide admin roles just to grant local responsibility. Use resource-scoped assignments/permissions keyed to organisation + resource type + resource ID + user + role/permission, or reuse an existing equivalent if confirmed. Keep contract entitlements separate from permissions.

### I. Migration history and deployment target need reconciliation

Only nine timestamped migration records were registered in the live project, while the repository contains numbered scripts. Build an explicit mapping from each repository migration to the live schema and registration history. Do not manually mark a migration applied or replay an old SQL file blindly. Verify the Vercel backend project reference before production rollout.

## 3. Proposed migration sequence

This sequence is intentionally additive and staged; exact migration filenames/versions must be aligned with the repository's deployment convention after reconciliation. The RLS/grant hardening must not be applied until the direct-client audit confirms that the organisation tables are API-only; if they are, include explicit revokes for `anon` and `authenticated` in the reviewed migration.

1. **Preflight/report only:** export live migration history, current definitions, constraints, triggers, grants, policies, row counts and integrity-check results. Back up the database and test restore.
2. **Repair existing proposed migration 023 before any execution:** fix trigger update fast paths; verify SQL references against the live schema; verify module/quiz association and score backfill; test quota reservation semantics; validate team assignment ownership; avoid broad RLS policies.
3. **Tenant integrity migration:** add missing unique/composite keys where required, safe tenant consistency checks/triggers, and indexes supporting tenant-scoped joins. Run read-only orphan/conflict queries first. If conflicts exist, stop and report them for an explicit resolution plan.
4. **Resource-scoped assignments:** add the smallest reusable table/constraints for team, cohort and programme responsibilities only if no equivalent is found in the repository or live schema.
5. **Security hardening:** confirm table privileges and service-role use; maintain default-deny for direct clients unless specific least-privilege policies are designed. Fix mutable search paths for relevant functions.
6. **Verification:** run SQL preflight/postflight checks, backend tests, tenant-boundary tests, capacity concurrency tests, quota concurrency tests and a smoke test against a non-production branch/database.
7. **Rollout:** apply one reviewed migration at a time to the confirmed target, verify after each, then deploy backend code only after schema compatibility is confirmed. Rollback steps must be documented for each migration.

## 4. Backend workflow audit checklist

| Workflow | Required invariants |
|---|---|
| Create/update organisation | Validate organisation type; enforce unique slug at DB level; reject inactive workspace mutations; require contract/pilot state for contracted features |
| Team creation and membership | Scope by tenant; validate active org membership for manager/member; validate team role/status; prevent cross-tenant membership |
| Cohort creation and membership | Programme belongs to same organisation; only active org learners can join; prevent duplicate active membership; enforce cohort and contract capacity atomically |
| Programme/course mapping | Programme, cohort and assigned course must be tenant-consistent; preserve ordering and assignment history |
| Individual/team/cohort assignment | No implied access; active grant/enrolment must match organisation; organisation-private courses cannot cross tenants |
| Contract entitlements | Resolve the current valid contract by date and status; disabled/missing entitlement means denied; a null limit means unlimited only when the entitlement is explicitly enabled |
| AI | Enforce role + feature entitlement + active contract + atomic quota; do not trust caller-supplied organisation IDs |
| Assessment/progression | Minimum passing score 70%; apply the same gate at lesson/module/media/assignment/progress APIs; do not leak locked content in responses |
| RLS and backend access | Tenant and permission checks in every privileged route; no blanket policies; service-role secrets remain server-only |
| Lifecycle/history | Deactivate access without deleting historical progress, attempts, memberships or audit records |

## 5. Verification status

- Live schema and registered migration history inspected read-only.
- Security Advisor inspected.
- The current live-data preflight returned **zero rows with issues** for these six checks: active team members without active organisation membership; active cohort members without active learner membership; cohort/programme organisation mismatch; cohort assignments to another organisation's private course; course access to another organisation's private course; and active team managers without active organisation membership. These counts describe only current data and do not prevent future invalid writes without the proposed guards.
- `learnora_capacity_reservations` exists and must be reconciled with the actual contract-capacity workflow before any migration or runtime refactor.
- No SQL migration has been applied and no production data has been changed.
- Remaining gate before any migration: reconcile the complete numbered repository migration set with the live timestamped migration records and verify the deployed backend's Supabase project reference.
