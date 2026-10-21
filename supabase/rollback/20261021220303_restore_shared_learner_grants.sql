-- Manual, partial rollback for migration 20261021220303_revoke_browser_table_grants.sql.
-- Re-grants exactly the 12 shared learner/course/progression tables restored by
-- migration 20261020230906. This does NOT restore grants on other public tables,
-- PUBLIC-wide privileges, or future-object default privileges. Review before use.
GRANT ALL PRIVILEGES ON TABLE
    public.users,
    public.learnora_courses,
    public.learnora_creator_accounts,
    public.learnora_discussions,
    public.learnora_learning_paths,
    public.course_modules,
    public.learnora_lessons,
    public.learnora_lesson_progress,
    public.learner_lesson_notes,
    public.quizzes,
    public.quiz_questions,
    public.quiz_attempts
TO anon, authenticated;
