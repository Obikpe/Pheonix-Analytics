-- Move cohort learner dates of birth to application-encrypted storage.
-- Existing plaintext rows are deliberately not rewritten here: the separate
-- backfill script requires the deployment's COHORT_DOB_ENCRYPTION_KEY.
BEGIN;
ALTER TABLE public.cohort_accounts
  ADD COLUMN IF NOT EXISTS date_of_birth_encrypted text;
ALTER TABLE public.cohort_accounts
  ALTER COLUMN date_of_birth DROP NOT NULL;
COMMIT;
