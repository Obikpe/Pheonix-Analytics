-- Read-only checks for the proposed organisation remediation migration 023.
-- Run only after the migration has been reviewed and applied to a disposable
-- or approved target database. This script performs no writes.

SELECT 'active_team_assignments_to_foreign_org_owned_courses' AS check_name, count(*)::bigint AS issue_count
FROM public.team_course_assignments a
JOIN public.organisation_teams t ON t.id = a.team_id
JOIN public.learnora_courses course ON course.id = a.course_id
WHERE a.status = 'active'
  AND course.ownership = 'organisation'
  AND course.organisation_id <> t.organisation_id
UNION ALL
SELECT 'active_team_assignments_on_inactive_teams', count(*)::bigint
FROM public.team_course_assignments a
JOIN public.organisation_teams t ON t.id = a.team_id
WHERE a.status = 'active' AND t.status <> 'active'
UNION ALL
SELECT 'active_team_assignments_to_unpublished_courses', count(*)::bigint
FROM public.team_course_assignments a
JOIN public.learnora_courses course ON course.id = a.course_id
WHERE a.status = 'active' AND course.status <> 'published'
UNION ALL
SELECT 'active_cohort_assignments_to_foreign_org_owned_courses', count(*)::bigint
FROM public.cohort_course_assignments a
JOIN public.cohorts c ON c.id = a.cohort_id
JOIN public.learnora_courses course ON course.id = a.course_id
WHERE a.status = 'active'
  AND course.ownership = 'organisation'
  AND course.organisation_id <> c.organisation_id
UNION ALL
SELECT 'active_cohort_assignments_to_unpublished_courses', count(*)::bigint
FROM public.cohort_course_assignments a
JOIN public.learnora_courses course ON course.id = a.course_id
WHERE a.status = 'active' AND course.status <> 'published'
UNION ALL
SELECT 'ai_usage_logs_missing_quota_reservation', count(*)::bigint
FROM public.ai_usage_logs l
LEFT JOIN public.learnora_ai_quota_reservations r ON r.usage_log_id = l.id
WHERE l.user_id IS NOT NULL AND r.id IS NULL;

-- New tables should remain RLS-enabled, with no browser-role table grants.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       count(p.oid)::bigint AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname IN ('team_course_assignments','learnora_ai_quota_reservations')
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

SELECT grantee, table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('PUBLIC','anon','authenticated')
  AND table_name IN (
      'organisations','organisation_members','organisation_teams',
      'organisation_team_members','cohorts','cohort_members',
      'cohort_course_assignments','team_course_assignments','course_access',
      'learnora_programmes','learnora_contracts','learnora_contract_entitlements',
      'learnora_access_entitlements','learnora_ai_limits',
      'learnora_ai_quota_reservations','learnora_enrolments',
      'learnora_courses','learnora_creator_accounts','users',
      'learnora_discussions','learnora_learning_paths','course_modules',
      'learnora_lessons','learnora_lesson_progress','learner_lesson_notes',
      'quizzes','quiz_questions','quiz_attempts','ai_usage_logs'
  )
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

SELECT p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       p.prosecdef AS security_definer,
       p.proconfig AS function_settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
      'reserve_learnora_ai_quota',
      'learnora_enforce_org_capacity',
      'learnora_validate_org_relationships',
      'learnora_sync_org_membership_status'
  )
ORDER BY p.proname;
