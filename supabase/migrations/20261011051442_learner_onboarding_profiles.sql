-- CATALOG-RECONSTRUCTED SOURCE for applied migration 20261011051442 learner_onboarding_profiles.
-- Original SQL was not present in repository history; this file restores a catalog-equivalent definition.
-- This is not a byte-for-byte recovery. Do not replay against production or treat as proof of full historical parity.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public."learner_onboarding_profiles" (
  "user_id" uuid NOT NULL,
  "goal" text DEFAULT ''::text NOT NULL,
  "experience_level" text DEFAULT 'beginner'::text NOT NULL,
  "preferred_track" text DEFAULT ''::text NOT NULL,
  "interests" text[] DEFAULT '{}'::text[] NOT NULL,
  "weekly_time_minutes" integer DEFAULT 180 NOT NULL,
  "onboarding_completed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
DO $recovered$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learner_onboarding_profiles'::regclass AND conname='learner_onboarding_profiles_experience_level_check') THEN ALTER TABLE public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_experience_level_check" CHECK (experience_level = ANY (ARRAY['beginner'::text, 'some_experience'::text, 'experienced'::text, 'career_changer'::text])); END IF; END $recovered$;
DO $recovered$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learner_onboarding_profiles'::regclass AND conname='learner_onboarding_profiles_pkey') THEN ALTER TABLE public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_pkey" PRIMARY KEY (user_id); END IF; END $recovered$;
DO $recovered$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learner_onboarding_profiles'::regclass AND conname='learner_onboarding_profiles_user_id_fkey') THEN ALTER TABLE public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; END IF; END $recovered$;
DO $recovered$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learner_onboarding_profiles'::regclass AND conname='learner_onboarding_profiles_weekly_time_minutes_check') THEN ALTER TABLE public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_weekly_time_minutes_check" CHECK (weekly_time_minutes >= 15 AND weekly_time_minutes <= 3000); END IF; END $recovered$;
ALTER TABLE public."learner_onboarding_profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."learner_onboarding_profiles" FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public."learner_onboarding_profiles" TO service_role;
