-- CATALOG-RECONSTRUCTED prerequisite for timestamped migration 20261020234813.
-- That migration revokes browser grants on public.learnora_contract_templates, but
-- no archived bootstrap or earlier timestamped migration creates this table.
-- Its original source was not found. This schema-only reconstruction is for
-- disposable replay only; it does not recover production template rows.
CREATE TABLE IF NOT EXISTS public.learnora_contract_templates (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "template_key" text NOT NULL,
  "jurisdiction" text DEFAULT 'NG'::text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $recovered$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_contract_templates'::regclass AND conname='learnora_contract_templates_pkey') THEN
    ALTER TABLE ONLY public.learnora_contract_templates ADD CONSTRAINT learnora_contract_templates_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_contract_templates'::regclass AND conname='learnora_contract_templates_template_key_jurisdiction_versi_key') THEN
    ALTER TABLE ONLY public.learnora_contract_templates ADD CONSTRAINT learnora_contract_templates_template_key_jurisdiction_versi_key UNIQUE (template_key, jurisdiction, version);
  END IF;
END
$recovered$;

ALTER TABLE public.learnora_contract_templates ENABLE ROW LEVEL SECURITY;
