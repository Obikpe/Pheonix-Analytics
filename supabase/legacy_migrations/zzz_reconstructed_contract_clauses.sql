-- CATALOG-RECONSTRUCTED prerequisite for timestamped migration 20261020234813.
-- That migration revokes browser grants on public.learnora_contract_clauses, but
-- no prior archived or active migration creates this table. The original source
-- was not found. This schema-only reconstruction is for disposable replay only.
CREATE TABLE IF NOT EXISTS public.learnora_contract_clauses (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL,
  "clause_key" text NOT NULL,
  "category" text NOT NULL,
  "title" text NOT NULL,
  "approved_text" text NOT NULL,
  "jurisdiction" text DEFAULT 'NG'::text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "required" boolean DEFAULT false NOT NULL,
  "conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $recovered$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_contract_clauses'::regclass AND conname='learnora_contract_clauses_pkey') THEN
    ALTER TABLE ONLY public.learnora_contract_clauses ADD CONSTRAINT learnora_contract_clauses_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_contract_clauses'::regclass AND conname='learnora_contract_clauses_template_id_clause_key_version_key') THEN
    ALTER TABLE ONLY public.learnora_contract_clauses ADD CONSTRAINT learnora_contract_clauses_template_id_clause_key_version_key UNIQUE (template_id, clause_key, version);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.learnora_contract_clauses'::regclass AND conname='learnora_contract_clauses_template_id_fkey') THEN
    ALTER TABLE ONLY public.learnora_contract_clauses ADD CONSTRAINT learnora_contract_clauses_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.learnora_contract_templates(id) ON DELETE CASCADE;
  END IF;
END
$recovered$;

ALTER TABLE public.learnora_contract_clauses ENABLE ROW LEVEL SECURITY;
