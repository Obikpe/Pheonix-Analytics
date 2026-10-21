create index if not exists idx_learnora_cohort_member_archive_archive_id
    on public.learnora_cohort_member_archive(cohort_archive_id);
create index if not exists idx_cohort_account_lesson_progress_account
    on public.cohort_account_lesson_progress(cohort_account_id);
create index if not exists idx_cohort_account_lesson_progress_assignment
    on public.cohort_account_lesson_progress(course_assignment_id);
create index if not exists idx_cohort_account_lesson_progress_lesson
    on public.cohort_account_lesson_progress(lesson_id);
