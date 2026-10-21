-- CATALOG-RECONSTRUCTED prerequisite for timestamped migration 20261020234717.
-- The archived 001-015 chain does not define public.set_updated_at(), but the
-- timestamped migration alters its search_path. The original function source was
-- not found in repository history. This catalog-equivalent definition is for
-- disposable replay only and is not an original historical migration.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;
