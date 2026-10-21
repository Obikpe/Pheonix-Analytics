# Step 7 — Final gap register and release decision

**Repository:** `Obikpe/Pheonix-Analytics`  
**Branch:** `fix/learnora-audit-tenant-isolation`  
**Live audit target:** active Pheonix Supabase project `gihfupzvdpyrmynqgukz`  
**Latest verified source commit before this report:** `3c5cd9b5d282f59141e11ed89d76f475bae31a57`  
**Safety:** all live SQL checks recorded here were read-only. No production rows, schema, migration history, deployment, or PR state were changed.

## 1. Automated verification

All four GitHub Actions workflows completed successfully on `3c5cd9b5d282f59141e11ed89d76f475bae31a57`:

- [Backend verification](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39519160361) — passed
- [Backend regression tests](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39519160419) — passed
- [Quality checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39519160359) — passed
- [Frontend checks](https://github.com/Obikpe/Pheonix-Analytics/actions/runs/39519160499) — passed

The migration inventory regression tests are included in this run. The pull request remains draft and unmerged; production Vercel remains unchanged.

## 2. Live schema inventory — catalog cross-check

A second read-only catalog query independently confirmed:

| Object | Live result |
|---|---:|
| Public base tables with RLS enabled | 92 |
| Public columns | 887 |
| Indexes | 272 |
| Triggers | 54 |
| Public views | 1 |
| Public sequences | 1 |
| Public functions | 7 |
| Policies in public schema | 0 |
| Constraints in `pg_constraint` | 387 |
| Rows reported by `information_schema.table_constraints` | 940 |

The two constraint figures come from different PostgreSQL metadata views and must not be treated as the same metric. The `pg_constraint` count is 92 primary keys, 147 foreign keys, 56 unique constraints, and 92 check constraints. The information-schema count is retained as a separate observation pending explanation of its extra rows; it is not being used as a substitute for the catalog breakdown.

The single public view is `course_content_health`; the public sequence is `admins_id_seq`.

## 3. Routine security configuration

Six of seven public functions have an explicit `search_path=pg_catalog, public`. The remaining function, `update_admins_updated_at`, has no function-level search-path setting. This routine concerns the internal administrator table, which is outside the customer-organisation feature scope. It remains a security-hardening follow-up, not a reason to change internal administrator workflows in this PR. All live function definitions and trigger bodies still need a full definition-level diff against their source SQL before structural equivalence can be claimed.

The live catalog confirms 92 RLS-enabled public tables and zero public policies. Table-level grants exist for both `anon` and `authenticated`; those grant rows alone do not prove exposure because RLS is enabled, but the broad grant surface must be reviewed table-by-table. Migration 027's 18 targeted backend-only control tables still have zero browser-role grants. Do not disable RLS or blanket-revoke grants across learner/course/progress tables as a shortcut.

## 4. AI permission and limit seed reconciliation

Read-only live results:

- Permission catalogue rows: 41.
- Organisation-role permission rows: 68.
- Global wildcard AI-limit rows: exactly 1.
- Expected mappings introduced by migration 015 are all present:
  - learner → `ai.view`
  - instructor → `ai.view`
  - owner → `ai.manage`
- The global AI limit matches migration 015's explicit values: enabled, 20 requests/day, 12,000 input characters, 1,200 output tokens, and `requests_per_month = NULL` (unlimited monthly quota).
- Additional `ai.view` mappings for owner and admin are present. They are not deleted: migration 015 is additive and does not establish that those mappings are erroneous. Their intended role-policy provenance should be checked against the full migration-004 seed and current application authorization logic before any permission is changed.

This closes the earlier presence-only check for the three migration-015 mappings and global quota values. It does not claim the entire 41-key permission catalogue or all 68 role mappings have been exhaustively compared against every historical seed statement.

## 5. Remaining blockers and safe disposition

### A. Witstart identity-set mismatch — requires verified identity mapping

The live audit still finds one legacy `role='witstart'` user without the expected organisation/cohort memberships, and one membership in each set belonging to a user outside that legacy role. Aggregate counts match, but the identity sets do not.

**No automatic repair was applied.** Moving or deleting a membership without establishing the intended person could remove legitimate access or grant access to the wrong learner. This requires an authoritative identity mapping from the organisation owner or a verified source roster. Do not use guessed IDs, aggregate counts, or the historical migration's broad `role='witstart'` predicate as proof of identity.

### B. Full structural source-to-live diff — not yet proven

The live catalog inventory is stronger now, but a complete object-by-object comparison of all 001–022 source migrations and live definitions has not been completed. It must cover column types/defaults/nullability, primary/foreign/unique/check constraints, indexes, sequences, view definitions, trigger definitions, function bodies/security configuration, RLS flags/policies, ownership/grants, and migration-specific backfills. A list of objects or matching migration names is not enough.

The live registry uses timestamped versions for historical feature migrations and does not record the numbered 001–015 chain verbatim. Do not fabricate migration registry rows or replay historical SQL to make the registry look contiguous. The five absent legacy tables (`tracks`, `enrollments`, `user_progress`, `community_qna`, `user_project_progress`) remain candidates for documented supersession, not automatic recreation.

### C. Authenticated staging and concurrency tests — blocked by lack of isolated staging

The four repository CI workflows pass, but they do not replace authenticated end-to-end and concurrency tests against an isolated database. The active Supabase project has no development branch available in the current audit, and the user has stated that paid Supabase branching is not affordable. Therefore no staging branch was created and no destructive or test-identity writes were made against production.

Required once a free/approved isolated environment is available: cross-tenant read/write denial; revoked/deactivated membership and course access; contract entitlement changes; the 70% quiz gate; cohort-capacity concurrency; AI-quota concurrency; provider retry/idempotency; and post-test cleanup verification.

### D. Production backend database target — not verified

Vercel production remains on `main` at `48d0595e7e8157414177f37ab621ea8b79821b07`. The production `SUPABASE_URL` is masked in the available project inspection, so the production runtime's database target cannot be proven to be the same project as the audited Pheonix reference. Do not infer this from the configured project name.

## 6. Release status

**Release remains blocked, with CI green.** The repository-side migration inventory and tests are in place; targeted live integrity, permission seed and quota checks are now stronger. Remaining release gates are the verified Witstart identity mapping, full definition-level source-to-live schema diff, isolated authenticated/concurrency tests, and verification of the production backend's actual database target.

No production data or schema changes, Vercel deployment, PR merge, or Supabase branch creation were performed in this step.
