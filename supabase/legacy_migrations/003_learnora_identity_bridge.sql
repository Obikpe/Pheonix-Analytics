-- ============================================================
-- 003_learnora_identity_bridge.sql
-- Connect existing users to the new Learnora organisation model
-- ============================================================

begin;

-- ============================================================
-- 1. Ensure the Witstart organisation exists
-- ============================================================

insert into public.organisations (
    name,
    slug,
    organisation_type,
    template
)
values (
    'Witstart Academy',
    'witstart',
    'academy',
    'academy'
)
on conflict (slug) do nothing;


-- ============================================================
-- 2. Connect existing Witstart users to Witstart Academy
--
-- IMPORTANT:
-- We deliberately DO NOT change users.role yet.
-- Existing authentication code may still rely on role='witstart'.
-- The new organisation membership becomes the source of truth
-- for Learnora's new architecture.
-- ============================================================

insert into public.organisation_members (
    organisation_id,
    user_id,
    role
)
select
    o.id,
    u.id,
    'learner'
from public.users u
cross join public.organisations o
where o.slug = 'witstart'
  and u.role = 'witstart'
on conflict (organisation_id, user_id) do update
set role = excluded.role;


-- ============================================================
-- 3. Add existing Witstart users to a default cohort
--
-- This gives the current cohort a proper Learnora identity.
-- We use a generic cohort name for now rather than inventing
-- a course-specific structure.
-- ============================================================

insert into public.cohorts (
    organisation_id,
    name,
    description
)
select
    o.id,
    'Witstart 2026 Cohort',
    'Initial Witstart Academy cohort migrated into Learnora.'
from public.organisations o
where o.slug = 'witstart'
  and not exists (
      select 1
      from public.cohorts c
      where c.organisation_id = o.id
        and c.name = 'Witstart 2026 Cohort'
  );


-- ============================================================
-- 4. Add all existing Witstart learners to the cohort
-- ============================================================

insert into public.cohort_members (
    cohort_id,
    user_id
)
select
    c.id,
    u.id
from public.cohorts c
cross join public.users u
where c.name = 'Witstart 2026 Cohort'
  and c.organisation_id = (
      select id
      from public.organisations
      where slug = 'witstart'
  )
  and u.role = 'witstart'
on conflict (cohort_id, user_id) do nothing;


commit;