-- Post-apply scope correction for Pheonix migration 20261020230826.
-- Restores the prior browser-role table grants on shared learner/course/
-- progression tables that are outside the organisation grant-hardening scope.
-- RLS remains enabled; this migration intentionally creates no RLS policies.
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

-- Trigger functions are internal database hooks, not browser-callable APIs.
REVOKE ALL ON FUNCTION public.learnora_enforce_org_capacity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.learnora_validate_org_relationships() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.learnora_sync_org_membership_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reserve_learnora_ai_quota(uuid,uuid,text,text,text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_learnora_ai_quota(uuid,uuid,text,text,text,text,integer,integer) TO service_role;
