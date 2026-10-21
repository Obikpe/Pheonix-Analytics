-- CATALOG-RECONSTRUCTED prerequisite for the legacy 003 identity bridge.
-- The archived 001/002 scripts do not create public.users, but 003 references it.
-- The original users-table bootstrap source was not found in repository history.
-- This restores the current catalog column/constraint shape for disposable replay only;
-- it is not an original migration and must never be applied to an existing/production DB.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "name" text NOT NULL,
  "expires_at" timestamp with time zone,
  "password_hash" text,
  "role" text DEFAULT 'user'::text,
  "is_paid" boolean DEFAULT false,
  "subscription_tier" text DEFAULT 'free'::text,
  "sub_status" text DEFAULT 'inactive'::text,
  "trial_ends_at" timestamp with time zone,
  "email_verified" boolean DEFAULT false NOT NULL,
  "email_verification_token_hash" text,
  "email_verification_expires_at" timestamp with time zone,
  "password_reset_token_hash" text,
  "password_reset_expires_at" timestamp with time zone,
  "email_verified_at" timestamp with time zone
);

DO $recovered$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_pkey') THEN
    ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.users'::regclass AND conname='users_email_key') THEN
    ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
  END IF;
END
$recovered$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
