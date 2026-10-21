begin;

-- Lifecycle history for organisations and cohorts.
create table if not exists public.learnora_organisation_lifecycle_events (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid not null references public.organisations(id) on delete cascade,
 from_status text,
 to_status text not null,
 reason text,
 actor_user_id uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists idx_org_lifecycle_events_org on public.learnora_organisation_lifecycle_events(organisation_id,created_at desc);

create table if not exists public.learnora_cohort_lifecycle_events (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null references public.cohorts(id) on delete cascade,
 from_status text,
 to_status text not null,
 reason text,
 actor_user_id uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists idx_cohort_lifecycle_events_cohort on public.learnora_cohort_lifecycle_events(cohort_id,created_at desc);

-- Explicit creator application/account linkage and review timestamps.
alter table public.learnora_creator_accounts add column if not exists application_id uuid references public.learnora_creator_applications(id) on delete set null;
alter table public.learnora_creator_applications add column if not exists reviewed_at timestamptz;
create index if not exists idx_creator_apps_status on public.learnora_creator_applications(status);

-- Useful scoped uniqueness for Learnora-owned courses.
create unique index if not exists uq_learnora_course_slug_global
on public.learnora_courses(slug)
where organisation_id is null and ownership='learnora';

-- Keep creator course ownership internally consistent.
update public.learnora_courses
set ownership='creator'
where creator_id is not null and ownership='learnora';

commit;