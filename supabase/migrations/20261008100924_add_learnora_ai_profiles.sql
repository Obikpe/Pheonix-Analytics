-- CATALOG-RECONSTRUCTED SOURCE for applied migration 20261008100924 add_learnora_ai_profiles.
-- Original SQL was not present in repository history; this file restores a catalog-equivalent definition.
-- This is not a byte-for-byte recovery. Do not replay against production or treat as proof of full historical parity.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public."learnora_ai_profiles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "profile_key" text NOT NULL,
  "display_name" text NOT NULL,
  "description" text,
  "provider_key" text DEFAULT 'openrouter'::text NOT NULL,
  "model" text DEFAULT 'openrouter/free'::text NOT NULL,
  "fallback_provider_key" text,
  "fallback_model" text,
  "temperature" numeric DEFAULT 0.3 NOT NULL,
  "max_output_tokens" integer DEFAULT 1200 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
DO $recovered$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_ai_profiles'::regclass AND conname='learnora_ai_profiles_pkey') THEN ALTER TABLE public."learnora_ai_profiles" ADD CONSTRAINT "learnora_ai_profiles_pkey" PRIMARY KEY (id); END IF; END $recovered$;
DO $recovered$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_ai_profiles'::regclass AND conname='learnora_ai_profiles_profile_key_key') THEN ALTER TABLE public."learnora_ai_profiles" ADD CONSTRAINT "learnora_ai_profiles_profile_key_key" UNIQUE (profile_key); END IF; END $recovered$;
ALTER TABLE public."learnora_ai_profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public."learnora_ai_profiles" FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public."learnora_ai_profiles" TO service_role;
