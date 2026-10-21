-- Cover foreign keys introduced for cohort-specific learner provisioning.
create index if not exists cohort_accounts_organisation_id_idx
    on public.cohort_accounts (organisation_id);
create index if not exists cohort_members_cohort_account_id_idx
    on public.cohort_members (cohort_account_id)
    where cohort_account_id is not null;
create index if not exists cohort_track_options_track_id_idx
    on public.cohort_track_options (track_id);
create index if not exists cohort_track_options_created_by_idx
    on public.cohort_track_options (created_by)
    where created_by is not null;
create index if not exists cohort_track_courses_track_id_idx
    on public.cohort_track_courses (track_id);
create index if not exists cohort_track_courses_course_id_idx
    on public.cohort_track_courses (course_id);
create index if not exists cohort_track_courses_assigned_by_idx
    on public.cohort_track_courses (assigned_by)
    where assigned_by is not null;
