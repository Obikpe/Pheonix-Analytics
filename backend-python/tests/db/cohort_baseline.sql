-- Minimal legacy Learnora schema for isolated migration integration tests.
-- Synthetic only: no production credentials or data are used.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE TABLE public.organisations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,is_active boolean NOT NULL DEFAULT true);
CREATE TABLE public.users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,email text,sub_status text NOT NULL DEFAULT 'active');
CREATE TABLE public.organisation_members(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid NOT NULL REFERENCES public.organisations(id),user_id uuid NOT NULL REFERENCES public.users(id),role text NOT NULL,status text NOT NULL DEFAULT 'active',UNIQUE(organisation_id,user_id));
CREATE TABLE public.cohorts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid NOT NULL REFERENCES public.organisations(id),name text NOT NULL,status text NOT NULL DEFAULT 'draft',capacity integer,instructor_capacity integer,programme_id uuid,start_date date,end_date date,description text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.learnora_courses(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organisation_id uuid REFERENCES public.organisations(id),title text NOT NULL,slug text NOT NULL DEFAULT 'course',status text NOT NULL DEFAULT 'published',ownership text NOT NULL DEFAULT 'organisation');
CREATE TABLE public.course_modules(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),course_id uuid NOT NULL REFERENCES public.learnora_courses(id),title text NOT NULL DEFAULT 'Module',order_index integer NOT NULL DEFAULT 0);
CREATE TABLE public.learnora_lessons(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),module_id uuid NOT NULL REFERENCES public.course_modules(id),title text NOT NULL DEFAULT 'Lesson',order_index integer NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'published');
CREATE TABLE public.cohort_members(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),cohort_id uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,user_id uuid REFERENCES public.users(id),status text NOT NULL DEFAULT 'active',joined_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.cohort_course_assignments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),cohort_id uuid NOT NULL REFERENCES public.cohorts(id),course_id uuid NOT NULL REFERENCES public.learnora_courses(id),status text NOT NULL DEFAULT 'active',assigned_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.learnora_enrolments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES public.users(id),cohort_id uuid REFERENCES public.cohorts(id),course_id uuid REFERENCES public.learnora_courses(id),status text NOT NULL DEFAULT 'active',enrolled_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,source_type text);
CREATE TABLE public.learnora_lesson_progress(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES public.users(id),lesson_id uuid REFERENCES public.learnora_lessons(id),progress_percent integer NOT NULL DEFAULT 0,completed boolean NOT NULL DEFAULT false,last_position_seconds integer NOT NULL DEFAULT 0,first_started_at timestamptz,last_accessed_at timestamptz,completed_at timestamptz);
CREATE TABLE public.learner_lesson_notes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES public.users(id),course_id uuid REFERENCES public.learnora_courses(id),lesson_id uuid REFERENCES public.learnora_lessons(id),content text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.learnora_cohort_lifecycle(cohort_id uuid PRIMARY KEY REFERENCES public.cohorts(id),status text NOT NULL,previous_cohort_id uuid,next_cohort_id uuid,changed_at timestamptz NOT NULL DEFAULT now(),changed_by uuid);
CREATE TABLE public.learnora_cohort_lifecycle_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),cohort_id uuid NOT NULL,from_status text,to_status text NOT NULL,reason text,actor_user_id uuid,created_at timestamptz NOT NULL DEFAULT now());
GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
