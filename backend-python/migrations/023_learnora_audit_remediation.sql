-- Learnora organisation audit remediation.
-- Review and apply through the normal migration process; this file is not auto-applied.

-- Pin shared timestamp-trigger functions used by organisation/course records.
-- This changes function resolution only; the trigger behaviour is unchanged.
ALTER FUNCTION public.learnora_set_updated_at() SET search_path = pg_catalog, public;

-- Keep API organisation types aligned with the supported community workflow.
ALTER TABLE public.organisations
    DROP CONSTRAINT IF EXISTS organisations_organisation_type_check;
ALTER TABLE public.organisations
    ADD CONSTRAINT organisations_organisation_type_check
    CHECK (organisation_type = ANY (ARRAY[
        'academy','corporate','university','school','bootcamp',
        'nonprofit','custom','community'
    ]::text[]));

-- Data-shape checks for capacities and programme/cohort dates. The live-data
-- preflight found no current violations; NOT VALID keeps the add and validate
-- phases explicit for safe review and predictable locking.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cohorts_capacity_positive' AND conrelid = 'public.cohorts'::regclass) THEN
        ALTER TABLE public.cohorts ADD CONSTRAINT cohorts_capacity_positive
            CHECK (capacity IS NULL OR capacity >= 1) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cohorts_instructor_capacity_nonnegative' AND conrelid = 'public.cohorts'::regclass) THEN
        ALTER TABLE public.cohorts ADD CONSTRAINT cohorts_instructor_capacity_nonnegative
            CHECK (instructor_capacity IS NULL OR instructor_capacity >= 0) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cohorts_date_range_valid' AND conrelid = 'public.cohorts'::regclass) THEN
        ALTER TABLE public.cohorts ADD CONSTRAINT cohorts_date_range_valid
            CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'learnora_programmes_date_range_valid' AND conrelid = 'public.learnora_programmes'::regclass) THEN
        ALTER TABLE public.learnora_programmes ADD CONSTRAINT learnora_programmes_date_range_valid
            CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date) NOT VALID;
    END IF;
END;
$$;

ALTER TABLE public.cohorts VALIDATE CONSTRAINT cohorts_capacity_positive;
ALTER TABLE public.cohorts VALIDATE CONSTRAINT cohorts_instructor_capacity_nonnegative;
ALTER TABLE public.cohorts VALIDATE CONSTRAINT cohorts_date_range_valid;
ALTER TABLE public.learnora_programmes VALIDATE CONSTRAINT learnora_programmes_date_range_valid;

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
    feature text NOT NULL CHECK (length(btrim(feature)) > 0),
    scope_type text NOT NULL CHECK (scope_type IN ('user','organisation','global','feature')),
    scope_id text NULL,
    limit_feature text NOT NULL CHECK (length(btrim(limit_feature)) > 0),
    usage_log_id uuid NULL UNIQUE REFERENCES public.ai_usage_logs(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_user_window_idx
    ON public.learnora_ai_quota_reservations(user_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_org_window_idx
    ON public.learnora_ai_quota_reservations(organisation_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_scope_window_idx
    ON public.learnora_ai_quota_reservations(scope_type, scope_id, limit_feature, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_feature_window_idx
    ON public.learnora_ai_quota_reservations(limit_feature, created_at);

-- Carry existing usage forward so installing this migration does not reset quotas.
INSERT INTO public.learnora_ai_quota_reservations
    (user_id, organisation_id, feature, scope_type, scope_id, limit_feature, usage_log_id, created_at)
SELECT l.user_id, l.organisation_id, COALESCE(l.feature, 'tutor'),
       CASE WHEN l.organisation_id IS NULL THEN 'user' ELSE 'organisation' END,
       COALESCE(l.organisation_id::text, l.user_id::text),
       COALESCE(l.feature, 'tutor'), l.id, l.created_at
FROM public.ai_usage_logs l
WHERE l.user_id IS NOT NULL
ON CONFLICT (usage_log_id) DO NOTHING;

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
ALTER TABLE public.team_course_assignments ENABLE ROW LEVEL SECURITY;

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
    IF p_user_id IS NULL OR COALESCE(p_feature, '') = '' THEN
        RAISE EXCEPTION 'user_id and feature are required';
    END IF;
    IF COALESCE(p_scope_type, 'user') NOT IN ('user','organisation','global','feature') THEN
        RAISE EXCEPTION 'Unsupported AI quota scope type';
    END IF;
    IF p_scope_type = 'organisation' AND p_organisation_id IS NULL THEN
        RAISE EXCEPTION 'organisation_id is required for organisation-scoped quotas';
    END IF;
    IF p_requests_per_day < 0 OR p_requests_per_month < 0 THEN
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
    ELSIF p_scope_type = 'global' THEN
        SELECT count(*)::integer INTO v_day_count
        FROM public.learnora_ai_quota_reservations r
        WHERE (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('day', v_now);
        SELECT count(*)::integer INTO v_month_count
        FROM public.learnora_ai_quota_reservations r
        WHERE (p_limit_feature = '*' OR r.limit_feature = p_limit_feature)
          AND r.created_at >= date_trunc('month', v_now);
    ELSIF p_scope_type = 'feature' THEN
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
SET search_path = pg_catalog, public
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
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.cohort_id = NEW.cohort_id THEN RETURN NEW; END IF;
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
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.role = NEW.role AND OLD.organisation_id = NEW.organisation_id THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id;
        v_key := CASE NEW.role WHEN 'learner' THEN 'learners' ELSE 'instructors' END;
    ELSIF TG_TABLE_NAME = 'cohorts' THEN
        IF NEW.status NOT IN ('draft','upcoming','active','ending') THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status IN ('draft','upcoming','active','ending') AND OLD.organisation_id = NEW.organisation_id THEN
            IF NEW.capacity IS NOT NULL THEN
                SELECT count(*) INTO v_used FROM public.cohort_members WHERE cohort_id = NEW.id AND status = 'active';
                IF v_used > NEW.capacity THEN
                    RAISE EXCEPTION 'Cohort capacity cannot be lower than its active membership (capacity %, active members %)', NEW.capacity, v_used
                        USING ERRCODE = '23514';
                END IF;
            END IF;
            RETURN NEW;
        END IF;
        v_org := NEW.organisation_id; v_key := 'cohorts';
    ELSIF TG_TABLE_NAME = 'organisation_teams' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.organisation_id = NEW.organisation_id THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'teams';
    ELSIF TG_TABLE_NAME = 'learnora_programmes' THEN
        IF NEW.status = 'archived' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status <> 'archived' AND OLD.organisation_id = NEW.organisation_id THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'programmes';
    ELSIF TG_TABLE_NAME = 'course_access' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.organisation_id = NEW.organisation_id AND OLD.course_id = NEW.course_id THEN RETURN NEW; END IF;
        -- An organisation-owned course already consumes one course slot.
        IF EXISTS (
            SELECT 1 FROM public.learnora_courses c
            WHERE c.id = NEW.course_id AND c.organisation_id = NEW.organisation_id
              AND c.ownership = 'organisation' AND c.status <> 'archived'
        ) THEN RETURN NEW; END IF;
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
              AND (TG_TABLE_NAME <> 'learnora_courses' OR course_id <> NEW.id)
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


-- Validate tenant/resource relationships at the database boundary as well as
-- in FastAPI. These triggers preserve existing rows and guard future writes.
CREATE OR REPLACE FUNCTION public.learnora_validate_org_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_org uuid;
    v_course_owner text;
    v_course_org uuid;
    v_member_role text;
    v_member_status text;
BEGIN
    IF TG_TABLE_NAME = 'organisation_teams' THEN
        IF NEW.manager_user_id IS NOT NULL THEN
            SELECT role, status INTO v_member_role, v_member_status
            FROM public.organisation_members
            WHERE organisation_id = NEW.organisation_id
              AND user_id = NEW.manager_user_id
            LIMIT 1;
            IF NOT FOUND OR v_member_status <> 'active' THEN
                RAISE EXCEPTION 'Team manager must be an active member of the same organisation'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'organisation_team_members' THEN
        IF NEW.status = 'active' THEN
            SELECT organisation_id INTO v_org
            FROM public.organisation_teams
            WHERE id = NEW.team_id AND status = 'active';
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Team must exist and be active before adding members'
                    USING ERRCODE = '23514';
            END IF;
            SELECT status INTO v_member_status
            FROM public.organisation_members
            WHERE organisation_id = v_org AND user_id = NEW.user_id
            LIMIT 1;
            IF NOT FOUND OR v_member_status <> 'active' THEN
                RAISE EXCEPTION 'Team member must be an active member of the same organisation'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'cohorts' THEN
        IF NEW.programme_id IS NOT NULL THEN
            PERFORM 1 FROM public.learnora_programmes
            WHERE id = NEW.programme_id AND organisation_id = NEW.organisation_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cohort programme must belong to the same organisation'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'cohort_members' THEN
        IF NEW.status = 'active' THEN
            SELECT organisation_id INTO v_org FROM public.cohorts WHERE id = NEW.cohort_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cohort does not exist' USING ERRCODE = '23503';
            END IF;
            SELECT role, status INTO v_member_role, v_member_status
            FROM public.organisation_members
            WHERE organisation_id = v_org AND user_id = NEW.user_id
            LIMIT 1;
            IF NOT FOUND OR v_member_status <> 'active' OR v_member_role <> 'learner' THEN
                RAISE EXCEPTION 'Active cohort members must be active learners in the same organisation'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    ELSIF TG_TABLE_NAME = 'cohort_course_assignments' THEN
        SELECT organisation_id INTO v_org FROM public.cohorts WHERE id = NEW.cohort_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cohort does not exist' USING ERRCODE = '23503';
        END IF;
        SELECT ownership, organisation_id INTO v_course_owner, v_course_org
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503';
        END IF;
        IF v_course_owner = 'organisation' AND v_course_org <> v_org THEN
            RAISE EXCEPTION 'Organisation-owned course cannot be assigned across organisations'
                USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'team_course_assignments' THEN
        SELECT organisation_id INTO v_org FROM public.organisation_teams WHERE id = NEW.team_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Team does not exist' USING ERRCODE = '23503';
        END IF;
        SELECT ownership, organisation_id INTO v_course_owner, v_course_org
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503';
        END IF;
        IF v_course_owner = 'organisation' AND v_course_org <> v_org THEN
            RAISE EXCEPTION 'Organisation-owned course cannot be assigned across organisations'
                USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'course_access' THEN
        SELECT ownership, organisation_id INTO v_course_owner, v_course_org
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503';
        END IF;
        IF v_course_owner = 'organisation' AND v_course_org <> NEW.organisation_id THEN
            RAISE EXCEPTION 'Organisation-owned course access must stay within its owning organisation'
                USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'learnora_enrolments' THEN
        IF NEW.status = 'active' AND NEW.organisation_id IS NOT NULL THEN
            SELECT role, status INTO v_member_role, v_member_status
            FROM public.organisation_members
            WHERE organisation_id = NEW.organisation_id AND user_id = NEW.user_id
            LIMIT 1;
            IF NOT FOUND OR v_member_status <> 'active' OR v_member_role <> 'learner' THEN
                RAISE EXCEPTION 'Active organisation enrolment requires an active learner membership in the same organisation'
                    USING ERRCODE = '23514';
            END IF;
            IF NEW.cohort_id IS NOT NULL THEN
                PERFORM 1 FROM public.cohorts
                WHERE id = NEW.cohort_id AND organisation_id = NEW.organisation_id;
                IF NOT FOUND THEN
                    RAISE EXCEPTION 'Enrolment cohort must belong to the same organisation'
                        USING ERRCODE = '23514';
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS learnora_validate_team_manager ON public.organisation_teams;
CREATE TRIGGER learnora_validate_team_manager
BEFORE INSERT OR UPDATE OF organisation_id, manager_user_id ON public.organisation_teams
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_team_member_tenant ON public.organisation_team_members;
CREATE TRIGGER learnora_validate_team_member_tenant
BEFORE INSERT OR UPDATE ON public.organisation_team_members
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_cohort_programme_tenant ON public.cohorts;
CREATE TRIGGER learnora_validate_cohort_programme_tenant
BEFORE INSERT OR UPDATE OF organisation_id, programme_id ON public.cohorts
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_cohort_member_tenant ON public.cohort_members;
CREATE TRIGGER learnora_validate_cohort_member_tenant
BEFORE INSERT OR UPDATE ON public.cohort_members
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_cohort_course_tenant ON public.cohort_course_assignments;
CREATE TRIGGER learnora_validate_cohort_course_tenant
BEFORE INSERT OR UPDATE ON public.cohort_course_assignments
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_team_course_tenant ON public.team_course_assignments;
CREATE TRIGGER learnora_validate_team_course_tenant
BEFORE INSERT OR UPDATE ON public.team_course_assignments
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_course_access_tenant ON public.course_access;
CREATE TRIGGER learnora_validate_course_access_tenant
BEFORE INSERT OR UPDATE ON public.course_access
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

DROP TRIGGER IF EXISTS learnora_validate_enrolment_tenant ON public.learnora_enrolments;
CREATE TRIGGER learnora_validate_enrolment_tenant
BEFORE INSERT OR UPDATE ON public.learnora_enrolments
FOR EACH ROW EXECUTE FUNCTION public.learnora_validate_org_relationships();

ALTER TABLE public.team_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learnora_ai_quota_reservations ENABLE ROW LEVEL SECURITY;

-- Keep memberships from granting stale access after an organisation member is
-- suspended, moved to another tenant, or changes from learner to another role.
CREATE OR REPLACE FUNCTION public.learnora_sync_org_membership_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.status = 'active'
       AND (NEW.status <> 'active' OR NEW.organisation_id <> OLD.organisation_id) THEN
        UPDATE public.cohort_members cm
        SET status = 'withdrawn'
        FROM public.cohorts c
        WHERE cm.cohort_id = c.id
          AND c.organisation_id = OLD.organisation_id
          AND cm.user_id = OLD.user_id
          AND cm.status = 'active';

        UPDATE public.organisation_team_members tm
        SET status = 'inactive'
        FROM public.organisation_teams t
        WHERE tm.team_id = t.id
          AND t.organisation_id = OLD.organisation_id
          AND tm.user_id = OLD.user_id
          AND tm.status = 'active';

        UPDATE public.organisation_teams
        SET manager_user_id = NULL
        WHERE organisation_id = OLD.organisation_id
          AND manager_user_id = OLD.user_id;

        UPDATE public.learnora_enrolments
        SET status = 'suspended'
        WHERE organisation_id = OLD.organisation_id
          AND user_id = OLD.user_id
          AND status = 'active';
    ELSIF OLD.status = 'active'
       AND NEW.status = 'active'
       AND OLD.role = 'learner'
       AND NEW.role <> 'learner' THEN
        UPDATE public.cohort_members cm
        SET status = 'withdrawn'
        FROM public.cohorts c
        WHERE cm.cohort_id = c.id
          AND c.organisation_id = OLD.organisation_id
          AND cm.user_id = OLD.user_id
          AND cm.status = 'active';

        UPDATE public.learnora_enrolments
        SET status = 'suspended'
        WHERE organisation_id = OLD.organisation_id
          AND user_id = OLD.user_id
          AND status = 'active';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS learnora_sync_org_membership_status ON public.organisation_members;
CREATE TRIGGER learnora_sync_org_membership_status
AFTER UPDATE OF status, organisation_id, role ON public.organisation_members
FOR EACH ROW EXECUTE FUNCTION public.learnora_sync_org_membership_status();



-- These tables are accessed through the authenticated FastAPI service, which
-- uses the server-side service_role key. RLS is enabled but currently has no
-- direct-client policies; remove latent broad table grants from browser roles.
-- Do not grant broad policies as a workaround. Any future direct-client path
-- must receive an explicitly reviewed, least-privilege grant and RLS policy.
REVOKE ALL PRIVILEGES ON TABLE
    public.organisations,
    public.organisation_members,
    public.organisation_teams,
    public.organisation_team_members,
    public.cohorts,
    public.cohort_members,
    public.cohort_course_assignments,
    public.team_course_assignments,
    public.course_access,
    public.learnora_programmes,
    public.learnora_programme_courses,
    public.learnora_contracts,
    public.learnora_contract_entitlements,
    public.learnora_contract_versions,
    public.learnora_access_entitlements,
    public.learnora_enrolments,
    public.learnora_ai_limits,
    public.learnora_ai_quota_reservations,
    public.learnora_capacity_reservations,
    public.ai_usage_logs,
    public.quizzes,
    public.quiz_questions,
    public.quiz_attempts,
    public.course_modules,
    public.learnora_lessons,
    public.learnora_lesson_progress,
    public.learner_lesson_notes
FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.team_course_assignments, public.learnora_ai_quota_reservations TO service_role;
