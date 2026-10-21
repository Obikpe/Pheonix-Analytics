-- CATALOG-RECONSTRUCTED prerequisite for legacy migration 004.
-- The archived 001-003 scripts do not create public.admins, but 004 references it.
-- The original admins-table bootstrap source was not found in repository history.
-- This restores the current catalog object shape for disposable replay only; it is
-- not an original migration and must never be applied to an existing/production DB.
CREATE SEQUENCE IF NOT EXISTS public.admins_id_seq AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE CACHE 1;

CREATE TABLE IF NOT EXISTS public.admins (
  "id" bigint DEFAULT nextval('admins_id_seq'::regclass) NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "password_hash" text NOT NULL,
  "role" text DEFAULT 'staff_admin'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "notes" text
);

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;

DO $recovered$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.admins'::regclass AND conname='admins_pkey') THEN
    ALTER TABLE ONLY public.admins ADD CONSTRAINT admins_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.admins'::regclass AND conname='admins_role_check') THEN
    ALTER TABLE ONLY public.admins ADD CONSTRAINT admins_role_check CHECK (role = ANY (ARRAY['super_admin'::text, 'staff_admin'::text, 'witstart_admin'::text]));
  END IF;
END
$recovered$;

CREATE INDEX IF NOT EXISTS admins_active_idx ON public.admins USING btree (is_active);
CREATE INDEX IF NOT EXISTS admins_created_at_idx ON public.admins USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique_idx ON public.admins USING btree (lower(email));
CREATE INDEX IF NOT EXISTS admins_role_idx ON public.admins USING btree (role);

CREATE OR REPLACE FUNCTION public.update_admins_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE TRIGGER admins_updated_at_trigger
BEFORE UPDATE ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.update_admins_updated_at();

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
