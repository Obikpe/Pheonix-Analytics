-- Manual rollback notes for 20261021220327_encrypt_cohort_date_of_birth.sql.
-- Do not drop date_of_birth_encrypted until the backfill is verified and a
-- retention decision has been made. This rollback only restores NOT NULL if no
-- row has been cleared; it intentionally fails if NULL plaintext dates exist.
ALTER TABLE public.cohort_accounts
  ALTER COLUMN date_of_birth SET NOT NULL;
