-- Learnora organisation audit remediation.
-- Review and apply through the normal migration process; this file is not auto-applied.

-- Keep API organisation types aligned with the supported community workflow.
ALTER TABLE public.organisations
    DROP CONSTRAINT IF EXISTS organisations_organisation_type_check;
ALTER TABLE public.organisations
    ADD CONSTRAINT organisations_organisation_type_check
    CHECK (organisation_type = ANY (ARRAY[
        'academy','corporate','university','school','bootcamp',
        'nonprofit','custom','community'
    ]::text[]));

-- Explicit module association makes module-level progression enforceable.
ALTER TABLE public.quizzes
    ADD COLUMN IF NOT EXISTS module_id uuid NULL
    REFERENCES public.course_modules(id) ON DELETE CASCADE;

UPDATE public.quizzes q
SET module_id = l.module_id
FROM public.learnora_lessons l
WHERE q.lesson_id = l.id
  AND q.module_id IS NULL;

ALTER TABLE public.quizzes
    ALTER COLUMN passing_score SET DEFAULT 70;
UPDATE public.quizzes
SET passing_score = GREATEST(COALESCE(passing_score, 70), 70)
WHERE passing_score IS NULL OR passing_score < 70;

CREATE INDEX IF NOT EXISTS quizzes_module_published_idx
    ON public.quizzes(module_id, is_published);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_quiz_passed_idx
    ON public.quiz_attempts(user_id, quiz_id, passed);

-- Persistent quota reservations make rate limits atomic across concurrent requests.
CREATE TABLE IF NOT EXISTS public.learnora_ai_quota_reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    organisation_id uuid NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    feature text NOT NULL,
    scope_type text NOT NULL,
    scope_id text NULL,
    limit_feature text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_user_window_idx
    ON public.learnora_ai_quota_reservations(user_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_org_window_idx
    ON public.learnora_ai_quota_reservations(organisation_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_scope_window_idx
    ON public.learnora_ai_quota_reservations(scope_type, scope_id, limit_feature, created_at);

-- Corporate/team learning assignments are distinct from cohort assignments.
CREATE TABLE IF NOT EXISTS public.team_course_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES public.organisation_teams(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.learnora_courses(id) ON DELETE CASCADE,
    assigned_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    assigned_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (team_id, course_id)
);
CREATE INDEX IF NOT EXISTS team_course_assignments_team_status_idx
    ON public.team_course_assignments(team_id, status);

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
SET search_path = public
AS $$
DECLARE
    v_now timestamptz := now();
    v_day_count integer := 0;
    v_month_count integer := 0;
    v_lock_key text;
BEGIN
    IF p_user_id IS NULL OR COALESCE(p_feature, '') = '' THEN
        RAISE EXCEPTION 'user_id and feature are required';
    END IF;

    -- Serialise reservations for the quota identity; transaction lock releases on return.
    v_lock_key := COALESCE(p_scope_type, 'user') || ':' ||
                  COALESCE(p_scope_id, p_user_id::text) || ':' ||
                  COALESCE(p_limit_feature, p_feature);
    PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));

    IF p_scope_type = 'organisation' AND p_organisation_id IS NOT NULL THEN
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.organisation_id = p_organisation_id
          AND (p_limit_feature = '*' OR r.feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);

        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.organisation_id = p_organisation_id
          AND (p_limit_feature = '*' OR r.feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    ELSIF p_scope_type = 'global' THEN
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE (p_limit_feature = '*' OR r.feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);
        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE (p_limit_feature = '*' OR r.feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    ELSIF p_scope_type = 'feature' THEN
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.feature = p_limit_feature
          AND r.created_at >= date_trunc('day', v_now);
        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.feature = p_limit_feature
          AND r.created_at >= date_trunc('month', v_now);
    ELSE
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.user_id = p_user_id
          AND (p_limit_feature = '*' OR r.feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);
        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE r.user_id = p_user_id
          AND (p_limit_feature = '*' OR r.feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    END IF;

    IF p_requests_per_day IS NOT NULL AND v_day_count >= p_requests_per_day THEN
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

REVOKE ALL ON FUNCTION public.reserve_learnora_ai_quota(uuid,uuid,text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_learnora_ai_quota(uuid,uuid,text,text,text,text,integer,integer) TO service_role;
ALTER TABLE public.learnora_ai_quota_reservations ENABLE ROW LEVEL SECURITY;

-- Enforce contract capacity inside the same transaction as the insert/update.
CREATE OR REPLACE FUNCTION public.learnora_enforce_org_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org uuid;
    v_key text;
    v_limit bigint;
    v_used bigint;
    v_settings jsonb;
    v_contract uuid;
    v_status text;
    v_cohort uuid;
    v_cohort_limit integer;
BEGIN
    IF TG_TABLE_NAME = 'cohort_members' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NEW; END IF;
        v_cohort := NEW.cohort_id;
        PERFORM pg_advisory_xact_lock(hashtextextended('cohort:' || v_cohort::text, 0));
        SELECT capacity INTO v_cohort_limit FROM public.cohorts WHERE id = v_cohort;
        IF v_cohort_limit IS NOT NULL THEN
            SELECT count(*) INTO v_used FROM public.cohort_members
            WHERE cohort_id = v_cohort AND status = 'active'
              AND (TG_OP = 'INSERT' OR id <> NEW.id);
            IF v_used + 1 > v_cohort_limit THEN
                RAISE EXCEPTION 'Cohort capacity exceeded (limit %, current %)', v_cohort_limit, v_used
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_TABLE_NAME = 'organisation_members' THEN
        IF NEW.status <> 'active' OR NEW.role NOT IN ('learner','instructor') THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.role = NEW.role THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id;
        v_key := CASE NEW.role WHEN 'learner' THEN 'learners' ELSE 'instructors' END;
    ELSIF TG_TABLE_NAME = 'cohorts' THEN
        IF NEW.status NOT IN ('draft','upcoming','active','ending') THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status IN ('draft','upcoming','active','ending') THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'cohorts';
    ELSIF TG_TABLE_NAME = 'organisation_teams' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'teams';
    ELSIF TG_TABLE_NAME = 'learnora_programmes' THEN
        IF NEW.status = 'archived' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status <> 'archived' THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'programmes';
    ELSIF TG_TABLE_NAME = 'course_access' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'courses';
    ELSIF TG_TABLE_NAME = 'learnora_courses' THEN
        IF NEW.ownership <> 'organisation' OR NEW.status = 'archived' OR NEW.organisation_id IS NULL THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.ownership = 'organisation' AND OLD.status <> 'archived'
           AND OLD.organisation_id = NEW.organisation_id THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'courses';
    ELSE
        RETURN NEW;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('orgcap:' || v_org::text || ':' || v_key, 0));

    SELECT settings INTO v_settings FROM public.organisations WHERE id = v_org;
    IF COALESCE(v_settings->>'pilot_mode', 'false') = 'true' THEN RETURN NEW; END IF;

    SELECT id INTO v_contract
    FROM public.learnora_contracts
    WHERE organisation_id = v_org
      AND status IN ('signed','active','expiring')
      AND (start_date IS NULL OR start_date <= CURRENT_DATE)
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_contract IS NULL THEN
        v_limit := 0;
    ELSE
        SELECT limit_value INTO v_limit
        FROM public.learnora_contract_entitlements
        WHERE contract_id = v_contract
          AND entitlement_key = v_key
          AND enabled = true
        LIMIT 1;
        IF NOT FOUND THEN v_limit := 0; END IF;
    END IF;

    IF v_limit IS NULL THEN RETURN NEW; END IF;

    IF v_key IN ('learners','instructors') THEN
        SELECT count(*) INTO v_used FROM public.organisation_members
        WHERE organisation_id = v_org AND role = CASE v_key WHEN 'learners' THEN 'learner' ELSE 'instructor' END
          AND status = 'active' AND (TG_OP = 'INSERT' OR id <> NEW.id);
    ELSIF v_key = 'cohorts' THEN
        SELECT count(*) INTO v_used FROM public.cohorts
        WHERE organisation_id = v_org AND status IN ('draft','upcoming','active','ending')
          AND (TG_OP = 'INSERT' OR id <> NEW.id);
    ELSIF v_key = 'teams' THEN
        SELECT count(*) INTO v_used FROM public.organisation_teams
        WHERE organisation_id = v_org AND status = 'active'
          AND (TG_OP = 'INSERT' OR id <> NEW.id);
    ELSIF v_key = 'programmes' THEN
        SELECT count(*) INTO v_used FROM public.learnora_programmes
        WHERE organisation_id = v_org AND status <> 'archived'
          AND (TG_OP = 'INSERT' OR id <> NEW.id);
    ELSE
        SELECT count(*) INTO v_used FROM (
            SELECT id AS course_id FROM public.learnora_courses
            WHERE organisation_id = v_org AND ownership = 'organisation' AND status <> 'archived'
              AND (TG_OP = 'INSERT' OR id <> NEW.id)
            UNION
            SELECT course_id FROM public.course_access
            WHERE organisation_id = v_org AND status = 'active'
              AND (TG_OP = 'INSERT' OR id <> NEW.id)
        ) scoped_courses;
    END IF;

    IF v_used + 1 > v_limit THEN
        RAISE EXCEPTION 'Organisation % capacity exceeded (limit %, current %)', v_key, v_limit, v_used
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS learnora_org_member_capacity ON public.organisation_members;
CREATE TRIGGER learnora_org_member_capacity BEFORE INSERT OR UPDATE ON public.organisation_members
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
DROP TRIGGER IF EXISTS learnora_cohort_capacity ON public.cohorts;
CREATE TRIGGER learnora_cohort_capacity BEFORE INSERT OR UPDATE ON public.cohorts
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
DROP TRIGGER IF EXISTS learnora_team_capacity ON public.organisation_teams;
CREATE TRIGGER learnora_team_capacity BEFORE INSERT OR UPDATE ON public.organisation_teams
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
DROP TRIGGER IF EXISTS learnora_programme_capacity ON public.learnora_programmes;
CREATE TRIGGER learnora_programme_capacity BEFORE INSERT OR UPDATE ON public.learnora_programmes
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
DROP TRIGGER IF EXISTS learnora_course_access_capacity ON public.course_access;
CREATE TRIGGER learnora_course_access_capacity BEFORE INSERT OR UPDATE ON public.course_access
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
DROP TRIGGER IF EXISTS learnora_owned_course_capacity ON public.learnora_courses;
CREATE TRIGGER learnora_owned_course_capacity BEFORE INSERT OR UPDATE ON public.learnora_courses
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
DROP TRIGGER IF EXISTS learnora_cohort_member_capacity ON public.cohort_members;
CREATE TRIGGER learnora_cohort_member_capacity BEFORE INSERT OR UPDATE ON public.cohort_members
FOR EACH ROW EXECUTE FUNCTION public.learnora_enforce_org_capacity();
