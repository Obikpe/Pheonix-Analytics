-- Step 4: durable cohort archive and atomic closure lifecycle.
-- Archive tables deliberately have no FK back to live cohort/member/account/user rows.
-- Credential fields (username, password hashes, activation tokens, date of birth) are never archived.

create table if not exists public.learnora_cohort_archive (
    id uuid primary key default gen_random_uuid(),
    cohort_id uuid not null unique,
    organisation_id uuid not null,
    cohort_name text not null,
    status_before_archive text not null,
    programme_id uuid,
    start_date date,
    end_date date,
    cohort_snapshot jsonb not null default '{}'::jsonb,
    member_count integer not null default 0 check (member_count >= 0),
    archived_by uuid,
    archive_reason text,
    archived_at timestamptz not null default now()
);

create table if not exists public.learnora_cohort_member_archive (
    id uuid primary key default gen_random_uuid(),
    cohort_archive_id uuid not null references public.learnora_cohort_archive(id) on delete restrict,
    source_cohort_member_id uuid not null,
    source_user_id uuid,
    source_cohort_account_id uuid,
    display_name text,
    email text,
    track_id uuid,
    track_name text,
    membership_status text not null,
    joined_at timestamptz not null,
    course_history jsonb not null default '{}'::jsonb,
    lesson_progress jsonb not null default '[]'::jsonb,
    learner_notes jsonb not null default '[]'::jsonb,
    archived_at timestamptz not null default now(),
    constraint learnora_cohort_member_archive_source_unique
        unique (cohort_archive_id, source_cohort_member_id)
);

create index if not exists idx_learnora_cohort_archive_org_archived
    on public.learnora_cohort_archive(organisation_id, archived_at desc);
create index if not exists idx_learnora_cohort_member_archive_source_user
    on public.learnora_cohort_member_archive(source_user_id);
create index if not exists idx_learnora_cohort_member_archive_track
    on public.learnora_cohort_member_archive(track_id);

-- Progress storage for cohort_accounts, which intentionally do not use public.users.
create table if not exists public.cohort_account_lesson_progress (
    id uuid primary key default gen_random_uuid(),
    cohort_account_id uuid not null references public.cohort_accounts(id) on delete cascade,
    cohort_member_id uuid not null references public.cohort_members(id) on delete cascade,
    cohort_id uuid not null references public.cohorts(id) on delete cascade,
    course_assignment_id uuid not null references public.cohort_member_course_assignments(id) on delete cascade,
    lesson_id uuid not null references public.learnora_lessons(id) on delete restrict,
    progress_percent integer not null default 0 check (progress_percent between 0 and 100),
    completed boolean not null default false,
    last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
    first_started_at timestamptz,
    last_accessed_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cohort_account_lesson_progress_unique unique (cohort_account_id, lesson_id)
);

create index if not exists idx_cohort_account_lesson_progress_member
    on public.cohort_account_lesson_progress(cohort_member_id, last_accessed_at desc);
create index if not exists idx_cohort_account_lesson_progress_cohort
    on public.cohort_account_lesson_progress(cohort_id, completed);

create or replace function public.validate_cohort_account_lesson_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    member_row record;
    account_status text;
    assignment_row record;
begin
    select cm.id, cm.cohort_id, cm.cohort_account_id, cm.status
      into member_row
      from public.cohort_members cm
     where cm.id = new.cohort_member_id;
    if not found then
        raise exception 'Cohort membership not found';
    end if;
    if member_row.cohort_id <> new.cohort_id
       or member_row.cohort_account_id <> new.cohort_account_id then
        raise exception 'Progress identity does not match cohort membership';
    end if;
    if member_row.status <> 'active' then
        raise exception 'Only active cohort members can update progress';
    end if;

    select ca.status into account_status
      from public.cohort_accounts ca
     where ca.id = new.cohort_account_id
       and ca.cohort_id = new.cohort_id;
    if not found or account_status <> 'active' then
        raise exception 'Cohort account is not active';
    end if;

    select cca.id, cca.status, cca.cohort_member_id, cca.cohort_id
      into assignment_row
      from public.cohort_member_course_assignments cca
     where cca.id = new.course_assignment_id;
    if not found
       or assignment_row.status <> 'active'
       or assignment_row.cohort_member_id <> new.cohort_member_id
       or assignment_row.cohort_id <> new.cohort_id then
        raise exception 'Progress requires an active course assigned to this learner';
    end if;

    if not exists (
        select 1
          from public.cohort_member_lesson_assignments cla
         where cla.course_assignment_id = new.course_assignment_id
           and cla.lesson_id = new.lesson_id
           and cla.status = 'active'
    ) then
        raise exception 'Progress lesson is not assigned to this learner';
    end if;

    if new.progress_percent = 100 then
        new.completed := true;
    end if;
    if new.completed and new.completed_at is null then
        new.completed_at := pg_catalog.now();
        new.progress_percent := 100;
    end if;
    if new.first_started_at is null then
        new.first_started_at := pg_catalog.now();
    end if;
    new.last_accessed_at := pg_catalog.now();
    new.updated_at := pg_catalog.now();
    return new;
end;
$$;

drop trigger if exists trg_validate_cohort_account_lesson_progress
    on public.cohort_account_lesson_progress;
create trigger trg_validate_cohort_account_lesson_progress
before insert or update of cohort_account_id, cohort_member_id, cohort_id, course_assignment_id,
    lesson_id, progress_percent, completed, last_position_seconds
on public.cohort_account_lesson_progress
for each row execute function public.validate_cohort_account_lesson_progress();

alter table public.learnora_cohort_archive enable row level security;
alter table public.learnora_cohort_member_archive enable row level security;
alter table public.cohort_account_lesson_progress enable row level security;
revoke all on public.learnora_cohort_archive from anon, authenticated;
revoke all on public.learnora_cohort_member_archive from anon, authenticated;
revoke all on public.cohort_account_lesson_progress from anon, authenticated;
grant all on public.learnora_cohort_archive to service_role;
grant all on public.learnora_cohort_member_archive to service_role;
grant all on public.cohort_account_lesson_progress to service_role;

create or replace function public.archive_and_close_cohort(
    p_cohort_id uuid,
    p_actor_user_id uuid default null,
    p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    cohort_row record;
    archive_row public.learnora_cohort_archive%rowtype;
    archived_members integer := 0;
    prior_archive_id uuid;
begin
    select c.id, c.organisation_id, c.name, c.status, c.programme_id,
           c.start_date, c.end_date, c.description, c.capacity,
           c.instructor_capacity, c.created_at, c.updated_at
      into cohort_row
      from public.cohorts c
     where c.id = p_cohort_id
     for update;
    if not found then
        raise exception 'Cohort not found';
    end if;

    select a.id into prior_archive_id
      from public.learnora_cohort_archive a
     where a.cohort_id = p_cohort_id;
    if found then
        return jsonb_build_object(
            'success', true,
            'already_archived', true,
            'archive_id', prior_archive_id,
            'cohort_id', p_cohort_id
        );
    end if;

    if cohort_row.status not in ('completed','expired','closed','archived') then
        raise exception 'Set the cohort to completed, expired, or closed before archiving';
    end if;

    insert into public.learnora_cohort_archive (
        cohort_id, organisation_id, cohort_name, status_before_archive,
        programme_id, start_date, end_date, cohort_snapshot,
        member_count, archived_by, archive_reason
    )
    select
        cohort_row.id, cohort_row.organisation_id, cohort_row.name, cohort_row.status,
        cohort_row.programme_id, cohort_row.start_date, cohort_row.end_date,
        jsonb_build_object(
            'description', cohort_row.description,
            'capacity', cohort_row.capacity,
            'instructor_capacity', cohort_row.instructor_capacity,
            'created_at', cohort_row.created_at,
            'updated_at', cohort_row.updated_at
        ),
        count(cm.id)::integer, p_actor_user_id, nullif(pg_catalog.btrim(p_reason), '')
      from public.cohort_members cm
     where cm.cohort_id = cohort_row.id
    returning * into archive_row;

    insert into public.learnora_cohort_member_archive (
        cohort_archive_id, source_cohort_member_id, source_user_id,
        source_cohort_account_id, display_name, email, track_id, track_name,
        membership_status, joined_at, course_history, lesson_progress, learner_notes
    )
    select
        archive_row.id,
        cm.id,
        cm.user_id,
        cm.cohort_account_id,
        coalesce(nullif(pg_catalog.btrim(concat_ws(' ', ca.first_name, ca.last_name)), ''),
                 nullif(pg_catalog.btrim(u.name), '')),
        coalesce(ca.email, u.email),
        cm.track_id,
        lt.name,
        cm.status,
        cm.joined_at,
        jsonb_build_object(
            'track_enabled_courses', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'course_slug', lc.slug,
                    'assignment_status', ctc.status,
                    'assigned_at', ctc.created_at
                ) order by lc.title)
                from public.cohort_track_courses ctc
                join public.learnora_courses lc on lc.id = ctc.course_id
                where ctc.cohort_id = cohort_row.id
                  and ctc.track_id = cm.track_id
            ), '[]'::jsonb),
            'cohort_course_assignments', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'status', cca.status,
                    'assigned_at', cca.assigned_at
                ) order by lc.title)
                from public.cohort_course_assignments cca
                join public.learnora_courses lc on lc.id = cca.course_id
                where cca.cohort_id = cohort_row.id
            ), '[]'::jsonb),
            'individual_course_assignments', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'assignment_id', cca.id,
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'track_id', cca.track_id,
                    'status', cca.status,
                    'tutor_user_id', cca.tutor_user_id,
                    'assigned_at', cca.assigned_at,
                    'lessons', coalesce((
                        select jsonb_agg(jsonb_build_object(
                            'lesson_id', ll.id,
                            'lesson_title', ll.title,
                            'status', cla.status,
                            'assigned_at', cla.assigned_at
                        ) order by ll.order_index)
                        from public.cohort_member_lesson_assignments cla
                        join public.learnora_lessons ll on ll.id = cla.lesson_id
                        where cla.course_assignment_id = cca.id
                    ), '[]'::jsonb)
                ) order by lc.title)
                from public.cohort_member_course_assignments cca
                join public.learnora_courses lc on lc.id = cca.course_id
                where cca.cohort_member_id = cm.id
            ), '[]'::jsonb),
            'legacy_enrolments', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'enrolment_id', e.id,
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'status', e.status,
                    'enrolled_at', e.enrolled_at,
                    'completed_at', e.completed_at,
                    'source_type', e.source_type
                ) order by lc.title)
                from public.learnora_enrolments e
                join public.learnora_courses lc on lc.id = e.course_id
                where e.cohort_id = cohort_row.id
                  and e.user_id = cm.user_id
            ), '[]'::jsonb)
        ),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'lesson_id', lp.lesson_id,
                'lesson_title', ll.title,
                'course_id', cmodule.course_id,
                'course_title', lc.title,
                'progress_percent', lp.progress_percent,
                'completed', lp.completed,
                'last_position_seconds', lp.last_position_seconds,
                'first_started_at', lp.first_started_at,
                'last_accessed_at', lp.last_accessed_at,
                'completed_at', lp.completed_at
            ) order by lp.last_accessed_at nulls last)
            from public.learnora_lesson_progress lp
            join public.learnora_lessons ll on ll.id = lp.lesson_id
            join public.course_modules cmodule on cmodule.id = ll.module_id
            left join public.learnora_courses lc on lc.id = cmodule.course_id
            where cm.user_id is not null
              and lp.user_id = cm.user_id
              and (
                  exists (select 1 from public.cohort_course_assignments cca
                           where cca.cohort_id = cohort_row.id and cca.course_id = cmodule.course_id)
                  or exists (select 1 from public.learnora_enrolments e
                              where e.cohort_id = cohort_row.id and e.user_id = cm.user_id
                                and e.course_id = cmodule.course_id)
                  or exists (select 1 from public.cohort_member_course_assignments cca
                              where cca.cohort_member_id = cm.id and cca.course_id = cmodule.course_id)
              )
        ), '[]'::jsonb)
        ||
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'lesson_id', cap.lesson_id,
                'progress_percent', cap.progress_percent,
                'completed', cap.completed,
                'last_position_seconds', cap.last_position_seconds,
                'first_started_at', cap.first_started_at,
                'last_accessed_at', cap.last_accessed_at,
                'completed_at', cap.completed_at
            ) order by cap.last_accessed_at nulls last)
            from public.cohort_account_lesson_progress cap
            where cap.cohort_member_id = cm.id
        ), '[]'::jsonb),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'course_id', n.course_id,
                'lesson_id', n.lesson_id,
                'content', n.content,
                'created_at', n.created_at,
                'updated_at', n.updated_at
            ) order by n.updated_at desc)
            from public.learner_lesson_notes n
            where cm.user_id is not null
              and n.user_id = cm.user_id
              and (
                  exists (select 1 from public.cohort_course_assignments cca
                           where cca.cohort_id = cohort_row.id and cca.course_id = n.course_id)
                  or exists (select 1 from public.learnora_enrolments e
                              where e.cohort_id = cohort_row.id and e.user_id = cm.user_id
                                and e.course_id = n.course_id)
                  or exists (select 1 from public.cohort_member_course_assignments cca
                              where cca.cohort_member_id = cm.id and cca.course_id = n.course_id)
              )
        ), '[]'::jsonb)
    from public.cohort_members cm
    left join public.cohort_accounts ca on ca.id = cm.cohort_account_id
    left join public.users u on u.id = cm.user_id
    left join public.learnora_tracks lt on lt.id = cm.track_id
    where cm.cohort_id = cohort_row.id
    on conflict (cohort_archive_id, source_cohort_member_id) do nothing;

    get diagnostics archived_members = row_count;

    -- Retire legacy course enrolments for this cohort without deleting history.
    update public.learnora_enrolments e
       set status = 'inactive'
     where e.cohort_id = cohort_row.id
       and e.status = 'active';

    -- Disable cohort accounts and remove credentials so usernames can be reused.
    update public.cohort_accounts ca
       set status = 'inactive',
           username = 'archived-' || replace(ca.id::text, '-', ''),
           password_hash = null,
           activation_token_hash = null,
           activation_expires_at = null,
           updated_at = pg_catalog.now()
     where ca.cohort_id = cohort_row.id;

    -- Legacy users are shared identities. Deactivate only if no other active cohort
    -- still depends on that identity; do not disable the whole organisation.
    update public.users u
       set sub_status = 'inactive'
     where exists (
         select 1 from public.learnora_cohort_member_archive ma
          where ma.cohort_archive_id = archive_row.id
            and ma.source_user_id = u.id
     )
       and not exists (
         select 1 from public.cohort_members cm2
         join public.cohorts c2 on c2.id = cm2.cohort_id
          where cm2.user_id = u.id
            and cm2.status = 'active'
            and cm2.cohort_id <> cohort_row.id
            and c2.status in ('draft','upcoming','active','ending')
       );

    -- Remove live cohort membership after the durable archive has been written.
    -- Cascading course/lesson assignments and cohort-account progress are now safe.
    delete from public.cohort_members cm
     where cm.cohort_id = cohort_row.id;

    update public.cohorts c
       set status = 'archived',
           updated_at = pg_catalog.now()
     where c.id = cohort_row.id;

    insert into public.learnora_cohort_lifecycle (
        cohort_id, status, previous_cohort_id, next_cohort_id, changed_at, changed_by
    )
    values (
        cohort_row.id, 'closed', null, null, pg_catalog.now(), p_actor_user_id
    )
    on conflict (cohort_id) do update
       set status = 'closed',
           changed_at = excluded.changed_at,
           changed_by = excluded.changed_by;

    insert into public.learnora_cohort_lifecycle_events (
        cohort_id, from_status, to_status, reason, actor_user_id, created_at
    )
    values (
        cohort_row.id, cohort_row.status, 'closed',
        nullif(pg_catalog.btrim(p_reason), ''), p_actor_user_id, pg_catalog.now()
    );

    return jsonb_build_object(
        'success', true,
        'already_archived', false,
        'archive_id', archive_row.id,
        'cohort_id', cohort_row.id,
        'archived_members', archived_members,
        'cohort_status', 'archived',
        'organisation_unchanged', true
    );
end;
$$;

revoke all on function public.archive_and_close_cohort(uuid, uuid, text) from public;
revoke all on function public.archive_and_close_cohort(uuid, uuid, text) from anon, authenticated;
grant execute on function public.archive_and_close_cohort(uuid, uuid, text) to service_role;
revoke all on function public.validate_cohort_account_lesson_progress() from public;
revoke all on function public.validate_cohort_account_lesson_progress() from anon, authenticated;
