-- EMERGENCY ROLLBACK ONLY — DO NOT APPLY AS PART OF NORMAL RELEASE.
-- This intentionally restores the browser grants from migration
-- 20261020230906_restore_shared_learner_grants_and_lock_trigger_routines.sql.
-- Restoring these broad grants reintroduces the direct Supabase Data API risk.
-- Use only with explicit approval after documenting the incident and scope.
-- This file is deliberately outside supabase/migrations/ so it is never replayed.

BEGIN;

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

COMMIT;
