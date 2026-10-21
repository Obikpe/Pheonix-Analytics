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
