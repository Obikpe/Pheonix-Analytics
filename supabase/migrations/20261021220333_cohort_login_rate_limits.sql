-- Persistent shared rate limits for cohort login; stores only a one-way key hash.
BEGIN;
CREATE TABLE IF NOT EXISTS public.cohort_login_rate_limits (
    key_hash text PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
    failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
    window_started_at timestamptz NOT NULL DEFAULT now(),
    blocked_until timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL PRIVILEGES ON TABLE public.cohort_login_rate_limits FROM PUBLIC, anon, authenticated;
ALTER TABLE public.cohort_login_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.cohort_login_is_limited(
    p_key_hash text, p_max_failures integer DEFAULT 5, p_window_seconds integer DEFAULT 900
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE r public.cohort_login_rate_limits%ROWTYPE;
BEGIN
    IF p_key_hash !~ '^[0-9a-f]{64}$' OR p_max_failures < 1 OR p_window_seconds < 1 THEN
        RAISE EXCEPTION 'Invalid rate-limit parameters';
    END IF;
    SELECT * INTO r FROM public.cohort_login_rate_limits WHERE key_hash = p_key_hash;
    IF NOT FOUND THEN RETURN false; END IF;
    IF r.blocked_until IS NOT NULL AND r.blocked_until > clock_timestamp() THEN RETURN true; END IF;
    IF r.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds) THEN RETURN false; END IF;
    RETURN r.failure_count >= p_max_failures;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cohort_login_record_failure(
    p_key_hash text, p_max_failures integer DEFAULT 5, p_window_seconds integer DEFAULT 900
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
DECLARE r public.cohort_login_rate_limits%ROWTYPE; t timestamptz := clock_timestamp();
BEGIN
    IF p_key_hash !~ '^[0-9a-f]{64}$' OR p_max_failures < 1 OR p_window_seconds < 1 THEN
        RAISE EXCEPTION 'Invalid rate-limit parameters';
    END IF;
    INSERT INTO public.cohort_login_rate_limits(key_hash) VALUES (p_key_hash) ON CONFLICT DO NOTHING;
    SELECT * INTO r FROM public.cohort_login_rate_limits WHERE key_hash = p_key_hash FOR UPDATE;
    IF r.window_started_at <= t - make_interval(secs => p_window_seconds) THEN
        r.failure_count := 1;
        r.window_started_at := t;
        r.blocked_until := NULL;
    ELSE
        r.failure_count := r.failure_count + 1;
    END IF;
    IF r.failure_count >= p_max_failures THEN
        r.blocked_until := t + make_interval(secs => p_window_seconds);
    END IF;
    UPDATE public.cohort_login_rate_limits
       SET failure_count = r.failure_count, window_started_at = r.window_started_at,
           blocked_until = r.blocked_until, updated_at = t
     WHERE key_hash = p_key_hash;
    RETURN r.failure_count >= p_max_failures;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cohort_login_clear_failure(p_key_hash text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public
AS $function$
    DELETE FROM public.cohort_login_rate_limits WHERE key_hash = p_key_hash
$function$;

REVOKE ALL ON FUNCTION public.cohort_login_is_limited(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cohort_login_record_failure(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cohort_login_clear_failure(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cohort_login_is_limited(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cohort_login_record_failure(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cohort_login_clear_failure(text) TO service_role;
COMMIT;
