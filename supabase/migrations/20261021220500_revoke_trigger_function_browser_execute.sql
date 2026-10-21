-- Trigger functions are invoked by PostgreSQL triggers, not as browser-facing RPC endpoints.
-- Remove direct EXECUTE grants from browser roles while leaving trigger execution intact.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.enforce_cohort_member_track_immutability() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.learnora_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admins_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cohort_account_scope() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cohort_member_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cohort_member_identity_scope() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cohort_track_option_scope() FROM PUBLIC, anon, authenticated;
COMMIT;
