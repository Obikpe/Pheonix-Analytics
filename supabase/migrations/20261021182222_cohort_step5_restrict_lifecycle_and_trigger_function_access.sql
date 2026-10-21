-- Restrict cohort lifecycle history and SECURITY DEFINER trigger functions to trusted backend execution.
-- Trigger functions are called by PostgreSQL triggers and do not need direct browser RPC grants.

REVOKE ALL PRIVILEGES ON TABLE public.learnora_cohort_lifecycle FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.learnora_cohort_lifecycle_events FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.learnora_cohort_lifecycle TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.learnora_cohort_lifecycle_events TO service_role;

REVOKE EXECUTE ON FUNCTION public.validate_cohort_member_course_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cohort_member_lesson_assignment() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_cohort_member_course_assignment() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_cohort_member_lesson_assignment() TO service_role;
