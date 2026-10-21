create table if not exists public.cohort_course_assignments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  course_id uuid not null references public.learnora_courses(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  status text not null default 'active',
  assigned_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohort_course_assignments_unique unique (cohort_id, course_id),
  constraint cohort_course_assignments_status_check check (status in ('active','inactive'))
);

create index if not exists cohort_course_assignments_cohort_status_idx
  on public.cohort_course_assignments(cohort_id, status);

alter table public.cohort_course_assignments enable row level security;
