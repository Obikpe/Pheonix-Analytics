-- Step 5 backend workflow correction.
-- A NULL monthly limit means "no monthly cap" in the Python AI limit resolver.
-- The quota reservation RPC already treats NULL as unlimited in its comparison;
-- do not reject it before reaching that comparison.

CREATE OR REPLACE FUNCTION public.reserve_learnora_ai_quota(
    p_user_id uuid,
    p_organisation_id uuid,
    p_feature text,
    p_scope_type text,
    p_scope_id text,
    p_limit_feature text,
    p_requests_per_day integer,
    p_requests_per_month integer
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_now timestamptz := now();
    v_day_count integer := 0;
    v_month_count integer := 0;
    v_lock_key text;
BEGIN
    IF p_user_id IS NULL OR length(btrim(COALESCE(p_feature, ''))) = 0 THEN
        RAISE EXCEPTION 'user_id and a non-empty feature are required';
    END IF;
    IF p_requests_per_day IS NULL THEN
        RAISE EXCEPTION 'A daily AI quota limit is required';
    END IF;
    IF COALESCE(p_scope_type, 'user') NOT IN ('user','organisation','global','feature') THEN
        RAISE EXCEPTION 'Unsupported AI quota scope type';
    END IF;
    IF p_scope_type = 'organisation' AND p_organisation_id IS NULL THEN
        RAISE EXCEPTION 'organisation_id is required for organisation-scoped quotas';
    END IF;
    IF p_requests_per_day < 0 OR (p_requests_per_month IS NOT NULL AND p_requests_per_month < 0) THEN
        RAISE EXCEPTION 'AI quota limits cannot be negative';
    END IF;

    -- All requests for the same quota bucket must take the same transaction lock.
    -- Caller-supplied scope IDs are deliberately ignored for global/feature scopes.
    v_lock_key := CASE COALESCE(p_scope_type, 'user')
        WHEN 'organisation' THEN 'organisation:' || p_organisation_id::text
        WHEN 'global' THEN 'global'
        WHEN 'feature' THEN 'feature:' || COALESCE(p_limit_feature, p_feature)
        ELSE 'user:' || p_user_id::text
    END || ':' || COALESCE(p_limit_feature, p_feature);
    PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));

    IF p_scope_type = 'organisation' AND p_organisation_id IS NOT NULL THEN
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.organisation_id = p_organisation_id
          AND (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);

        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.organisation_id = p_organisation_id
          AND (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    ELSIF p_scope_type IN ('global', 'feature') THEN
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);
        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    ELSE
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.user_id = p_user_id
          AND (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);
        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.user_id = p_user_id
          AND (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    END IF;

    IF v_day_count >= p_requests_per_day THEN
        RETURN jsonb_build_object('allowed', false, 'limit_scope', 'day');
    END IF;
    IF p_requests_per_month IS NOT NULL AND v_month_count >= p_requests_per_month THEN
        RETURN jsonb_build_object('allowed', false, 'limit_scope', 'month');
    END IF;

    INSERT INTO public.learnora_ai_quota_reservations
        (user_id, organisation_id, feature, scope_type, scope_id, limit_feature)
    VALUES
        (p_user_id, p_organisation_id, p_feature, COALESCE(p_scope_type, 'user'), p_scope_id, COALESCE(p_limit_feature, p_feature));

    RETURN jsonb_build_object('allowed', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_learnora_ai_quota(uuid,uuid,text,text,text,text,integer,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_learnora_ai_quota(uuid,uuid,text,text,text,text,integer,integer) TO service_role;
