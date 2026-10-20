-- Read-only audit snapshot for the confirmed Learnora target project.
-- Run with a role that can read system catalogs. This script makes no changes.

SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version;

SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      (table_name = 'organisations' AND column_name IN ('organisation_type','settings'))
      OR (table_name = 'quizzes' AND column_name IN ('module_id','passing_score','lesson_id','course_id'))
      OR (table_name = 'learnora_ai_quota_reservations')
      OR (table_name = 'team_course_assignments')
  )
ORDER BY table_name, ordinal_position;

SELECT conrelid::regclass::text AS table_name,
       conname,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
    'public.organisations'::regclass,
    'public.quizzes'::regclass,
    'public.team_course_assignments'::regclass
)
ORDER BY table_name, conname;

SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'learnora_%capacity%'
ORDER BY event_object_table, trigger_name;

SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('reserve_learnora_ai_quota','learnora_enforce_org_capacity')
ORDER BY p.proname;
