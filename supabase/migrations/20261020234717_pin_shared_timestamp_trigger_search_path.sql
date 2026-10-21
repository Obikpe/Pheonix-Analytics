-- Pin the generic timestamp trigger's name-resolution path.
-- This routine is used by application tables; the unrelated admins-only
-- update_admins_updated_at routine is intentionally outside this migration.
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public;
