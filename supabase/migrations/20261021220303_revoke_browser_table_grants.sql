-- Remove direct browser-role access from every existing public table/view.
-- The application uses FastAPI with the server-side service-role client; browser
-- clients must not use the Supabase Data API as an alternate access path.
BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Keep the legacy admin timestamp trigger's name resolution explicit as well.
ALTER FUNCTION public.update_admins_updated_at() SET search_path = pg_catalog, public;

-- Future objects inherit defaults from their creating role. The active Pheonix
-- catalog currently has defaults for both postgres and supabase_admin.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON SEQUENCES FROM PUBLIC, anon, authenticated;
-- PostgreSQL grants EXECUTE on new functions to PUBLIC globally by default.
-- That default cannot be removed by a schema-only REVOKE, so revoke it globally
-- and remove any explicit browser-role defaults in public.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- The active project connects as role postgres, which is not a member of
-- supabase_admin. PostgreSQL forbids changing another role's default ACL
-- without membership; that managed-role ACL must be corrected by Supabase
-- project administration. Existing table grants are still revoked above.
-- Default ACLs for postgres (the migration owner) are hardened below.


COMMIT;
