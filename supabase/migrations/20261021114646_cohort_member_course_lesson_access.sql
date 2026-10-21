-- Step 3: per-learner course and lesson access, scoped to the learner's fixed cohort track.
create table if not exists public.cohort_member_course_assignments (
    id uuid primary key default gen_random_uuid(),
    cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
    cohort_id uuid not null references public.cohorts(id) on delete cascade,
    track_id uuid not null references public.learnora_tracks(id),
    course_id uuid not null references public.learnora_courses(id),
    tutor_user_id uuid null references public.users(id) on delete set null,
    status text not null default 'active' check (status in ('active','inactive','completed')),
    assigned_by uuid null references public.users(id) on delete set null,
    assigned_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cohort_member_course_assignment_unique unique (cohort_member_id, course_id)
);

create table if not exists public.cohort_member_lesson_assignments (
    id uuid primary key default gen_random_uuid(),
    course_assignment_id uuid not null references public.cohort_member_course_assignments(id) on delete cascade,
    lesson_id uuid not null references public.learnora_lessons(id) on delete cascade,
    status text not null default 'active' check (status in ('active','inactive')),
    assigned_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cohort_member_lesson_assignment_unique unique (course_assignment_id, lesson_id)
);

create index if not exists idx_cohort_member_course_assignments_member_status
    on public.cohort_member_course_assignments(cohort_member_id, status);
create index if not exists idx_cohort_member_course_assignments_cohort_track
    on public.cohort_member_course_assignments(cohort_id, track_id, status);
create index if not exists idx_cohort_member_course_assignments_course
    on public.cohort_member_course_assignments(course_id, status);
create index if not exists idx_cohort_member_lesson_assignments_lesson
    on public.cohort_member_lesson_assignments(lesson_id, status);

create or replace function public.validate_cohort_member_course_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    member_row record;
    course_row record;
    cohort_row record;
begin
    select cm.id, cm.cohort_id, cm.track_id, cm.status as member_status
      into member_row
      from public.cohort_members cm
     where cm.id = new.cohort_member_id;

    if not found then
        raise exception 'Cohort membership not found';
    end if;
    if member_row.cohort_id <> new.cohort_id then
        raise exception 'Course assignment cohort does not match learner membership';
    end if;
    if member_row.track_id is null or member_row.track_id <> new.track_id then
        raise exception 'Course assignment must use the learner fixed track';
    end if;
    if member_row.member_status <> 'active' then
        raise exception 'Only active cohort learners can receive course assignments';
    end if;

    select id, organisation_id, status
      into cohort_row
      from public.cohorts
     where id = new.cohort_id;
    if not found or cohort_row.status not in ('draft','upcoming','active') then
        raise exception 'Cohort is closed to course assignment';
    end if;

    if not exists (
        select 1 from public.cohort_track_options cto
         where cto.cohort_id = new.cohort_id
           and cto.track_id = new.track_id
           and cto.status = 'active'
    ) then
        raise exception 'Track is not enabled for this cohort';
    end if;

    if not exists (
        select 1 from public.cohort_track_courses ctc
         where ctc.cohort_id = new.cohort_id
           and ctc.track_id = new.track_id
           and ctc.course_id = new.course_id
           and ctc.status = 'active'
    ) then
        raise exception 'Course is not enabled for this track and cohort';
    end if;

    select id, organisation_id, ownership, status
      into course_row
      from public.learnora_courses
     where id = new.course_id;
    if not found or course_row.status <> 'published' then
        raise exception 'Only published courses can be assigned';
    end if;
    if course_row.ownership = 'organisation'
       and course_row.organisation_id <> cohort_row.organisation_id then
        raise exception 'Course belongs to another organisation';
    end if;

    if new.tutor_user_id is not null and not exists (
        select 1
          from public.organisation_members om
         where om.organisation_id = cohort_row.organisation_id
           and om.user_id = new.tutor_user_id
           and om.status = 'active'
    ) then
        raise exception 'Assigned tutor must be an active member of the same organisation';
    end if;

    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists trg_validate_cohort_member_course_assignment
    on public.cohort_member_course_assignments;
create trigger trg_validate_cohort_member_course_assignment
before insert or update of cohort_member_id, cohort_id, track_id, course_id, tutor_user_id, status
on public.cohort_member_course_assignments
for each row execute function public.validate_cohort_member_course_assignment();

create or replace function public.validate_cohort_member_lesson_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    assignment_row record;
    lesson_course_id uuid;
    lesson_status text;
begin
    select course_id, status
      into assignment_row
      from public.cohort_member_course_assignments
     where id = new.course_assignment_id;
    if not found or assignment_row.status <> 'active' then
        raise exception 'Lesson assignment requires an active course assignment';
    end if;

    select cm.course_id, l.status
      into lesson_course_id, lesson_status
      from public.learnora_lessons l
      join public.course_modules cm on cm.id = l.module_id
     where l.id = new.lesson_id;
    if not found or lesson_course_id <> assignment_row.course_id then
        raise exception 'Lesson must belong to the assigned course';
    end if;
    if lesson_status <> 'published' then
        raise exception 'Only published lessons can be assigned';
    end if;
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists trg_validate_cohort_member_lesson_assignment
    on public.cohort_member_lesson_assignments;
create trigger trg_validate_cohort_member_lesson_assignment
before insert or update of course_assignment_id, lesson_id, status
on public.cohort_member_lesson_assignments
for each row execute function public.validate_cohort_member_lesson_assignment();

alter table public.cohort_member_course_assignments enable row level security;
alter table public.cohort_member_lesson_assignments enable row level security;
revoke all on public.cohort_member_course_assignments from anon, authenticated;
revoke all on public.cohort_member_lesson_assignments from anon, authenticated;
grant all on public.cohort_member_course_assignments to service_role;
grant all on public.cohort_member_lesson_assignments to service_role;
