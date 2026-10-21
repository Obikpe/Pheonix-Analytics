begin;

create table if not exists public.learnora_programmes (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid not null references public.organisations(id) on delete cascade,
 name text not null,
 slug text not null,
 description text,
 status text not null default 'draft' check(status in ('draft','upcoming','active','completed','archived')),
 start_date date,
 end_date date,
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organisation_id,slug)
);

create table if not exists public.learnora_programme_courses (
 id uuid primary key default gen_random_uuid(),
 programme_id uuid not null references public.learnora_programmes(id) on delete cascade,
 course_id uuid not null references public.learnora_courses(id) on delete restrict,
 order_index integer not null default 0,
 required boolean not null default true,
 unique(programme_id,course_id),
 unique(programme_id,order_index)
);

create table if not exists public.learnora_learning_paths (
 id uuid primary key default gen_random_uuid(),
 owner_user_id uuid references public.users(id) on delete cascade,
 organisation_id uuid references public.organisations(id) on delete cascade,
 name text not null,
 slug text,
 description text,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_learning_path_courses (
 id uuid primary key default gen_random_uuid(),
 path_id uuid not null references public.learnora_learning_paths(id) on delete cascade,
 course_id uuid not null references public.learnora_courses(id) on delete restrict,
 order_index integer not null default 0,
 required boolean not null default true,
 unique(path_id,course_id),
 unique(path_id,order_index)
);

alter table public.cohorts add column if not exists programme_id uuid references public.learnora_programmes(id) on delete set null;
alter table public.cohorts add column if not exists capacity integer;
alter table public.cohorts add column if not exists instructor_capacity integer;
alter table public.cohorts add column if not exists status text;
alter table public.cohorts add column if not exists updated_at timestamptz default now();

create table if not exists public.learnora_cohort_lifecycle (
 id uuid primary key default gen_random_uuid(),
 cohort_id uuid not null unique references public.cohorts(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','upcoming','active','ending','completed','expired','closed')),
 previous_cohort_id uuid references public.cohorts(id) on delete set null,
 next_cohort_id uuid references public.cohorts(id) on delete set null,
 changed_at timestamptz not null default now(),
 changed_by uuid references public.users(id) on delete set null
);

insert into public.learnora_cohort_lifecycle(cohort_id,status)
select id,case when status='active' then 'active' when status='completed' then 'completed' when status='archived' then 'closed' else 'draft' end from public.cohorts
on conflict(cohort_id) do nothing;

alter table public.learnora_enrolments add column if not exists source_type text default 'organisation';
alter table public.learnora_enrolments add column if not exists access_entitlement_id uuid references public.learnora_access_entitlements(id) on delete set null;

create index if not exists idx_programmes_org on public.learnora_programmes(organisation_id);
create index if not exists idx_programme_courses_programme on public.learnora_programme_courses(programme_id);
create index if not exists idx_learning_paths_org on public.learnora_learning_paths(organisation_id);
create index if not exists idx_path_courses_path on public.learnora_learning_path_courses(path_id);

commit;
