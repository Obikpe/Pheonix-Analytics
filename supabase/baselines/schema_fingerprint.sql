-- Stable schema-only fingerprint for comparing the catalog snapshot with a replayed chain.
-- Deliberately excludes ACLs: the disposable API snapshot intentionally narrows grants
-- for its service-role-only test harness. Data rows are compared separately.
SELECT jsonb_build_object(
  'columns', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'table', c.table_name,
      'column', c.column_name,
      'type', c.data_type,
      'udt', c.udt_name,
      'nullable', c.is_nullable,
      'default', c.column_default
    ) ORDER BY c.table_name, c.ordinal_position)
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
  ), '[]'::jsonb),
  'constraints', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'table', cl.relname,
      'name', con.conname,
      'type', con.contype,
      'definition', pg_get_constraintdef(con.oid, true)
    ) ORDER BY cl.relname, con.conname)
    FROM pg_constraint con
    JOIN pg_class cl ON cl.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND cl.relkind = 'r'
  ), '[]'::jsonb),
  'indexes', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'table', i.tablename,
      'name', i.indexname,
      'definition', i.indexdef
    ) ORDER BY i.tablename, i.indexname)
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
  ), '[]'::jsonb),
  'triggers', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'table', cl.relname,
      'name', tg.tgname,
      'definition', pg_get_triggerdef(tg.oid, true),
      'enabled', tg.tgenabled
    ) ORDER BY cl.relname, tg.tgname)
    FROM pg_trigger tg
    JOIN pg_class cl ON cl.oid = tg.tgrelid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND NOT tg.tgisinternal
  ), '[]'::jsonb),
  'functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid),
      'definition', pg_get_functiondef(p.oid),
      'security_definer', p.prosecdef,
      'config', p.proconfig,
      'volatility', p.provolatile
    ) ORDER BY p.proname, pg_get_function_identity_arguments(p.oid))
    FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.prokind IN ('f', 'p')
  ), '[]'::jsonb),
  'views', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', v.viewname,
      'definition', v.definition
    ) ORDER BY v.viewname)
    FROM pg_views v
    WHERE v.schemaname = 'public'
  ), '[]'::jsonb),
  'rls', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'table', cl.relname,
      'enabled', cl.relrowsecurity,
      'forced', cl.relforcerowsecurity
    ) ORDER BY cl.relname)
    FROM pg_class cl
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace
    WHERE ns.nspname = 'public' AND cl.relkind = 'r'
  ), '[]'::jsonb),
  'policies', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'table', p.tablename,
      'name', p.policyname,
      'roles', p.roles,
      'command', p.cmd,
      'using', p.qual,
      'check', p.with_check
    ) ORDER BY p.tablename, p.policyname)
    FROM pg_policies p
    WHERE p.schemaname = 'public'
  ), '[]'::jsonb),
  'sequences', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', seq.relname,
      'type', format_type(ps.seqtypid, NULL),
      'start', ps.seqstart,
      'increment', ps.seqincrement,
      'minimum', ps.seqmin,
      'maximum', ps.seqmax,
      'cache', ps.seqcache,
      'cycle', ps.seqcycle,
      'owned_table', owner_table.relname,
      'owned_column', owner_attr.attname
    ) ORDER BY seq.relname)
    FROM pg_class seq
    JOIN pg_namespace ns ON ns.oid = seq.relnamespace
    JOIN pg_sequence ps ON ps.seqrelid = seq.oid
    LEFT JOIN pg_depend dep ON dep.objid = seq.oid AND dep.deptype = 'a'
    LEFT JOIN pg_class owner_table ON owner_table.oid = dep.refobjid
    LEFT JOIN pg_attribute owner_attr ON owner_attr.attrelid = owner_table.oid AND owner_attr.attnum = dep.refobjsubid
    WHERE ns.nspname = 'public' AND seq.relkind = 'S'
  ), '[]'::jsonb)
);
