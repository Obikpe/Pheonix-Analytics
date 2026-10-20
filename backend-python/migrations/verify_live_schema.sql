-- Read-only organisation audit snapshot. Safe before or after proposed migration 023.
-- Run with a role that can read system catalogs. This script makes no changes.

SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      (table_name = 'organisations' AND column_name IN ('organisation_type','settings','is_active'))
      OR (table_name = 'organisation_members' AND column_name IN ('organisation_id','user_id','role','status'))
      OR (table_name = 'organisation_teams' AND column_name IN ('organisation_id','manager_user_id','status'))
      OR (table_name = 'cohorts' AND column_name IN ('organisation_id','programme_id','capacity','status'))
      OR (table_name = 'quizzes' AND column_name IN ('module_id','passing_score','lesson_id','course_id'))
      OR table_name IN ('learnora_ai_quota_reservations','team_course_assignments')
  )
ORDER BY table_name, ordinal_position;

-- Missing optional tables simply return no rows; do not cast an absent table to regclass.
SELECT n.nspname AS schema_name,
       c.relname AS table_name,
       con.conname,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
      'organisations','organisation_members','organisation_teams',
      'organisation_team_members','cohorts','cohort_members',
      'cohort_course_assignments','team_course_assignments',
      'course_access','learnora_programmes','learnora_enrolments','quizzes'
  )
ORDER BY c.relname, con.conname;

SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS force_rls,
       count(pol.oid) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy pol ON pol.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
      'organisations','organisation_members','organisation_teams',
      'organisation_team_members','cohorts','cohort_members',
      'cohort_course_assignments','team_course_assignments',
      'course_access','learnora_programmes','learnora_contracts',
      'learnora_contract_entitlements','learnora_ai_limits',
      'learnora_ai_quota_reservations','learnora_enrolments','quizzes'
  )
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

-- Effective table grants for the named API roles; pair this with the RLS policy output above.
SELECT grantee, table_name,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon','authenticated','service_role')
  AND table_name IN (
      'organisations','organisation_members','organisation_teams',
      'organisation_team_members','cohorts','cohort_members',
      'cohort_course_assignments','team_course_assignments','course_access',
      'learnora_programmes','learnora_contracts','learnora_contract_entitlements',
      'learnora_ai_limits','learnora_capacity_reservations',
      'learnora_ai_quota_reservations','learnora_enrolments','quizzes'
  )
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

SELECT event_object_table AS table_name, trigger_name, action_timing,
       event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'learnora_%'
  AND (
      event_object_table IN (
          'organisations','organisation_members','organisation_teams',
          'organisation_team_members','cohorts','cohort_members',
          'cohort_course_assignments','team_course_assignments',
          'course_access','learnora_programmes','learnora_courses',
          'learnora_enrolments'
      )
  )
ORDER BY event_object_table, trigger_name;

SELECT n.nspname AS schema_name, p.proname AS function_name,
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
      'learnora_sync_org_membership_status',
      'learnora_set_updated_at', 'set_updated_at'
  )
ORDER BY p.proname;

-- Preflight integrity counts. Run before migration and resolve any non-zero
-- count explicitly; these checks are read-only and do not repair existing rows.
SELECT 'active_team_members_without_active_org_membership' AS check_name, count(*) AS issue_count
FROM public.organisation_team_members tm
JOIN public.organisation_teams t ON t.id = tm.team_id
LEFT JOIN public.organisation_members m
  ON m.organisation_id = t.organisation_id AND m.user_id = tm.user_id AND m.status = 'active'
WHERE tm.status = 'active' AND m.id IS NULL
UNION ALL
SELECT 'active_cohort_members_without_active_learner_membership', count(*)
FROM public.cohort_members cm
JOIN public.cohorts c ON c.id = cm.cohort_id
LEFT JOIN public.organisation_members m
  ON m.organisation_id = c.organisation_id AND m.user_id = cm.user_id
 AND m.status = 'active' AND m.role = 'learner'
WHERE cm.status = 'active' AND m.id IS NULL
UNION ALL
SELECT 'cohort_programmes_from_another_organisation', count(*)
FROM public.cohorts c
JOIN public.learnora_programmes p ON p.id = c.programme_id
WHERE c.programme_id IS NOT NULL AND c.organisation_id <> p.organisation_id
UNION ALL
SELECT 'cohort_assignments_to_foreign_org_owned_courses', count(*)
FROM public.cohort_course_assignments a
JOIN public.cohorts c ON c.id = a.cohort_id
JOIN public.learnora_courses course ON course.id = a.course_id
WHERE course.ownership = 'organisation' AND course.organisation_id <> c.organisation_id
UNION ALL
SELECT 'course_access_to_foreign_org_owned_courses', count(*)
FROM public.course_access a
JOIN public.learnora_courses course ON course.id = a.course_id
WHERE course.ownership = 'organisation' AND course.organisation_id <> a.organisation_id
UNION ALL
SELECT 'active_team_managers_without_active_org_membership', count(*)
FROM public.organisation_teams t
LEFT JOIN public.organisation_members m
  ON m.organisation_id = t.organisation_id AND m.user_id = t.manager_user_id AND m.status = 'active'
WHERE t.manager_user_id IS NOT NULL AND t.status = 'active' AND m.id IS NULL
UNION ALL
SELECT 'organisation_types_outside_supported_set', count(*)
FROM public.organisations
WHERE organisation_type IS NULL OR organisation_type NOT IN (
    'academy','corporate','university','school','bootcamp','nonprofit','custom','community'
)
UNION ALL
SELECT 'quizzes_below_70_percent_or_missing_score', count(*)
FROM public.quizzes
WHERE passing_score IS NULL OR passing_score < 70
UNION ALL
SELECT 'cohorts_over_current_capacity', count(*)
FROM public.cohorts c
WHERE c.capacity IS NOT NULL
  AND (SELECT count(*) FROM public.cohort_members cm
       WHERE cm.cohort_id = c.id AND cm.status = 'active') > c.capacity
UNION ALL
SELECT 'duplicate_active_team_memberships', count(*)
FROM (
    SELECT team_id, user_id
    FROM public.organisation_team_members
    WHERE status = 'active'
    GROUP BY team_id, user_id
    HAVING count(*) > 1
) duplicate_memberships;
