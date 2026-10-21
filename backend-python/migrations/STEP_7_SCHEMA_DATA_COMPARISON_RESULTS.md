# Step 7 — Schema/data comparison results and staging gate

**Target:** active Supabase project `gihfupzvdpyrmynqgukz` (Pheonix)  
**Source:** `fix/learnora-audit-tenant-isolation` at the Step 7 audit commit plus repository migrations `supabase/migrations/001_initial.sql`–`022_community_discussions.sql`.  
**Mode:** read-only production inspection. No production data or schema was changed. No production deployment was created or modified.

## 1. Live schema inventory

The live public schema currently reports:

| Object | Count |
|---|---:|
| Base tables | 92 |
| Columns | 887 |
| Table constraints | 940 |
| Indexes | 272 |
| Triggers | 54 |
| Public functions | 7 |
| Public RLS policies | 0 |

The database advisor reports 92 RLS-enabled tables without policies. Information-schema grant inspection found table-level grants for `anon` and `authenticated` on 55 tables per role; the 18 organisation-control tables targeted by migration 027 have zero remaining browser-role grants. With RLS enabled and no policies, direct PostgREST table access is denied by RLS even where table privileges exist; service-role backend access is a different path and must be tested separately. The grant counts alone do not prove public data exposure, but this broad grant surface should be reconciled with the intended backend-only access design.

## 2. Migration object coverage

A comparison of the tables declared or altered by migrations 001–015 with live `public` tables found the following expected legacy tables absent:

- `tracks`
- `enrollments`
- `user_progress`
- `community_qna`
- `user_project_progress`

Other inventoried tables in those migrations were present. This supports the existing conclusion that the initial schema has been partially superseded by newer Learnora tables; it does not prove column-, constraint-, index-, trigger-, function-, grant-, or seed-equivalence. The absent tables must not be recreated just to make historical SQL appear applied.

The exact historical source files were identified and their seed/data operations inspected. Migrations 003, 004, and 015 contain live data changes, so they must not be replayed blindly.

## 3. Seed-data reconciliation findings

The source migration 003 expects existing users with legacy role `witstart` to have corresponding organisation and default-cohort memberships. Read-only live checks returned:

| Check | Result |
|---|---:|
| Witstart organisation rows by slug | 1 |
| Users with legacy role `witstart` | 25 |
| Organisation memberships for Witstart | 25 |
| Legacy-role users missing a matching organisation membership | **1** |
| Organisation membership rows not belonging to a legacy-role Witstart user | **1** |
| Witstart 2026 cohort rows | 1 |
| Legacy-role users missing a matching cohort membership | **1** |
| Cohort membership rows not belonging to a legacy-role Witstart user | **1** |
| Non-active Witstart organisation memberships | 0 |
| Non-active Witstart 2026 cohort memberships | 0 |

This is a real identity-set mismatch despite the totals matching. One user expected by the source migration is absent from both the organisation and default cohort memberships, while one membership in each set belongs to a user outside the legacy `witstart` role. This report intentionally omits individual IDs and personal information. No automatic repair was performed because the correct mapping must be established before moving a user or deleting a membership.

Seed presence checks also found one each of the expected `ai.view` and `ai.manage` permission keys and one global wildcard AI-limit row. Those presence checks do not prove every permission mapping or limit value matches its original seed definition; a complete key/value reconciliation is still required.

## 4. Organisation integrity checks

These live checks remain clean:

- Active team memberships without an active organisation membership: 0.
- Active cohort memberships without an active organisation membership: 0.
- Cohorts over configured capacity: 0.
- Browser-role table-grant rows across the 18 migration-027 control tables: 0.

The Witstart identity-set mismatch above is a different, role-based seed-lineage check and is not contradicted by the active membership-orphan checks.

## 5. Staging availability and test execution

The Supabase API currently lists no development branches for Pheonix. A separate project named `Pheonix AI` is inactive and was not treated as staging. The available integration does not provide a schema-only dump/restore artifact or staging credentials in this run.

Therefore authenticated end-to-end and concurrency tests have **not** been executed. Running them against production would risk creating test identities, changing entitlements, reserving quota, or corrupting real organisation state. Creating a Supabase staging branch may incur cost and requires a quoted-cost review/approval. Once an isolated staging branch and test credentials are available, run:

1. Cross-organisation read/write isolation for two disposable organisations and users.
2. Deactivated organisation, revoked membership, and revoked course assignment access denial.
3. Contract entitlement changes and the minimum 70% assessment gate.
4. Concurrent cohort-capacity reservations at the boundary.
5. Concurrent AI-quota reservations at daily/monthly limits.
6. Provider failure, retry, and idempotency behaviour.
7. Cleanup verification showing no cross-tenant rows and no leaked test records.

## 6. Release decision

**Release remains blocked.** Inventory and targeted data-lineage checks are complete, but a full structural dump diff, complete permission/AI seed key-value comparison, identity-set reconciliation, and authenticated staging tests remain outstanding.

Safe next steps:

1. Resolve the single Witstart membership mismatch after verifying the intended user mapping; do not infer it from totals alone.
2. Obtain an approved schema-only snapshot and compare all table columns, defaults, constraints, indexes, triggers, functions, views, RLS flags, policies, grants, and sequences against the migration chain.
3. Compare all seeded permission and AI-limit rows by key and value.
4. Obtain approval for any quoted staging cost, create an isolated branch, and run the test matrix above.
5. Only then decide whether any migration-history repair is warranted. Do not replay 001–015 or fabricate registry rows.

**Safety note:** This file records read-only evidence and blockers; it does not claim the full structural comparison or staging test suite is complete.
