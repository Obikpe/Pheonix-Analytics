-- Pin SECURITY DEFINER trigger functions to an empty search_path.
create or replace function public.validate_cohort_member_course_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
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

    select c.id, c.organisation_id, c.status
      into cohort_row
      from public.cohorts c
     where c.id = new.cohort_id;
    if not found then
        raise exception 'Cohort not found';
    end if;

    select lc.id, lc.organisation_id, lc.ownership, lc.status
      into course_row
      from public.learnora_courses lc
     where lc.id = new.course_id;
    if not found then
        raise exception 'Course not found';
    end if;

    if course_row.ownership = 'organisation'
       and course_row.organisation_id <> cohort_row.organisation_id then
        raise exception 'Course belongs to another organisation';
    end if;

    if new.status = 'active' then
        if member_row.member_status <> 'active' then
            raise exception 'Only active cohort learners can receive course assignments';
        end if;
        if cohort_row.status not in ('draft','upcoming','active') then
            raise exception 'Cohort is closed to course assignment';
        end if;
        if course_row.status <> 'published' then
            raise exception 'Only published courses can be assigned';
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
        if new.tutor_user_id is not null and not exists (
            select 1
              from public.organisation_members om
             where om.organisation_id = cohort_row.organisation_id
               and om.user_id = new.tutor_user_id
               and om.status = 'active'
        ) then
            raise exception 'Assigned tutor must be an active member of the same organisation';
        end if;
    end if;

    new.updated_at := pg_catalog.now();
    return new;
end;
$$;

create or replace function public.validate_cohort_member_lesson_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    assignment_row record;
    lesson_course_id uuid;
    lesson_status text;
begin
    select cca.course_id, cca.status
      into assignment_row
      from public.cohort_member_course_assignments cca
     where cca.id = new.course_assignment_id;
    if not found then
        raise exception 'Course assignment not found';
    end if;

    if new.status = 'active' then
        if assignment_row.status <> 'active' then
            raise exception 'Lesson assignment requires an active course assignment';
        end if;
        select cm.course_id, ll.status
          into lesson_course_id, lesson_status
          from public.learnora_lessons ll
          join public.course_modules cm on cm.id = ll.module_id
         where ll.id = new.lesson_id;
        if not found then
            raise exception 'Lesson not found';
        end if;
        if lesson_course_id <> assignment_row.course_id then
            raise exception 'Lesson must belong to the assigned course';
        end if;
        if lesson_status <> 'published' then
            raise exception 'Only published lessons can be assigned';
        end if;
    end if;
    new.updated_at := pg_catalog.now();
    return new;
end;
$$;
