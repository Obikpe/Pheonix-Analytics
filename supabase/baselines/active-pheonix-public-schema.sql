-- ACTIVE PHEONIX PUBLIC-SCHEMA CATALOG BASELINE
-- Generated from a READ-ONLY catalog inspection of project gihfupzvdpyrmynqgukz on 2026-10-21.
-- This is a disposable-staging schema snapshot, not an original migration and not a data backup.
-- No production rows, secrets, or auth.users records are included.
-- It intentionally grants backend service_role access for API integration tests; browser roles receive no table/function grants.
\set ON_ERROR_STOP on
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
SET search_path = public, extensions, pg_catalog;

-- Sequences needed by catalog defaults.
CREATE SEQUENCE public."admins_id_seq" AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1 NO CYCLE CACHE 1;

-- Tables and column definitions.
CREATE TABLE public."admins" (
  "id" bigint DEFAULT nextval('admins_id_seq'::regclass) NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "password_hash" text NOT NULL,
  "role" text DEFAULT 'staff_admin'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "notes" text
);
CREATE TABLE public."ai_usage_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "organisation_id" uuid,
  "feature" text NOT NULL,
  "provider" text DEFAULT 'openrouter'::text NOT NULL,
  "model" text,
  "request_status" text DEFAULT 'success'::text NOT NULL,
  "latency_ms" integer,
  "input_tokens" integer,
  "output_tokens" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."assignment_submissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "assignment_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "submission_text" text,
  "file_url" text,
  "status" text DEFAULT 'submitted'::text NOT NULL,
  "score" numeric(8,2),
  "feedback" text,
  "submitted_at" timestamp with time zone,
  "graded_at" timestamp with time zone,
  "graded_by" uuid
);
CREATE TABLE public."assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid,
  "course_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "instructions" text,
  "due_date" timestamp with time zone,
  "max_score" numeric(8,2),
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "details" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "email" text,
  "account_type" text,
  "role" text,
  "ip" text,
  "metadata" jsonb
);
CREATE TABLE public."badges" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "icon_url" text,
  "criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."certificates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "organisation_id" uuid,
  "certificate_number" text NOT NULL,
  "issued_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE public."cohort_account_lesson_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_account_id" uuid NOT NULL,
  "cohort_member_id" uuid NOT NULL,
  "cohort_id" uuid NOT NULL,
  "course_assignment_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "progress_percent" integer DEFAULT 0 NOT NULL,
  "completed" boolean DEFAULT false NOT NULL,
  "last_position_seconds" integer DEFAULT 0 NOT NULL,
  "first_started_at" timestamp with time zone,
  "last_accessed_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohort_accounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "organisation_id" uuid NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "email" text NOT NULL,
  "username" text NOT NULL,
  "date_of_birth" date NOT NULL,
  "password_hash" text,
  "status" text DEFAULT 'pending_activation'::text NOT NULL,
  "activation_token_hash" text,
  "activation_expires_at" timestamp with time zone,
  "activated_at" timestamp with time zone,
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohort_course_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "assigned_by" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohort_member_course_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_member_id" uuid NOT NULL,
  "cohort_id" uuid NOT NULL,
  "track_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "tutor_user_id" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_by" uuid,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohort_member_lesson_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_assignment_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohort_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "user_id" uuid,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "cohort_account_id" uuid,
  "track_id" uuid
);
CREATE TABLE public."cohort_track_courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "track_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohort_track_options" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "track_id" uuid NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cohorts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "start_date" date,
  "end_date" date,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "programme_id" uuid,
  "capacity" integer,
  "instructor_capacity" integer
);
CREATE TABLE public."course_access" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "organisation_id" uuid NOT NULL,
  "access_type" text DEFAULT 'assigned'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_by" uuid,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."course_modules" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "order_index" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'published'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "legacy_id" text NOT NULL,
  "title" text NOT NULL,
  "slug" text,
  "description" text,
  "track" text,
  "level" text,
  "module" integer,
  "type" text,
  "project" text,
  "color" text,
  "topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "witstart" boolean DEFAULT false NOT NULL,
  "expected_lesson_count" integer DEFAULT 0 NOT NULL,
  "total_minutes" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."email_verification_tokens" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "email" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learner_badges" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "badge_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "awarded_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learner_lesson_notes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "content" text DEFAULT ''::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learner_onboarding_profiles" (
  "user_id" uuid NOT NULL,
  "goal" text DEFAULT ''::text NOT NULL,
  "experience_level" text DEFAULT 'beginner'::text NOT NULL,
  "preferred_track" text DEFAULT ''::text NOT NULL,
  "interests" text[] DEFAULT '{}'::text[] NOT NULL,
  "weekly_time_minutes" integer DEFAULT 180 NOT NULL,
  "onboarding_completed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learner_skills" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "skill_id" uuid NOT NULL,
  "organisation_id" uuid,
  "proficiency" numeric(5,2) DEFAULT 0,
  "status" text DEFAULT 'developing'::text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learning_recommendations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organisation_id" uuid,
  "course_id" uuid,
  "lesson_id" uuid,
  "recommendation_type" text NOT NULL,
  "reason" text,
  "source" text DEFAULT 'rules'::text NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_access_entitlements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "organisation_id" uuid,
  "course_id" uuid,
  "cohort_id" uuid,
  "source_type" text NOT NULL,
  "source_id" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "starts_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ends_at" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_activity_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "organisation_id" uuid,
  "action" text NOT NULL,
  "entity_type" text,
  "entity_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_admin_organisation_access" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" bigint NOT NULL,
  "organisation_id" uuid NOT NULL,
  "role" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_ai_conversations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organisation_id" uuid,
  "feature" text DEFAULT 'tutor'::text NOT NULL,
  "title" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_ai_limits" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "scope_type" text NOT NULL,
  "scope_id" text,
  "feature" text,
  "requests_per_day" integer,
  "requests_per_month" integer,
  "max_input_chars" integer DEFAULT 12000 NOT NULL,
  "max_output_tokens" integer DEFAULT 1200 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_ai_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "provider" text,
  "model" text,
  "input_tokens" integer,
  "output_tokens" integer,
  "latency_ms" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_ai_profiles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "profile_key" text NOT NULL,
  "display_name" text NOT NULL,
  "description" text,
  "provider_key" text DEFAULT 'openrouter'::text NOT NULL,
  "model" text DEFAULT 'openrouter/free'::text NOT NULL,
  "fallback_provider_key" text,
  "fallback_model" text,
  "temperature" numeric DEFAULT 0.3 NOT NULL,
  "max_output_tokens" integer DEFAULT 1200 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_ai_providers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "provider_key" text NOT NULL,
  "display_name" text NOT NULL,
  "base_url" text,
  "default_model" text,
  "enabled" boolean DEFAULT true NOT NULL,
  "priority" integer DEFAULT 100 NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_ai_quota_reservations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organisation_id" uuid,
  "feature" text NOT NULL,
  "scope_type" text NOT NULL,
  "scope_id" text,
  "limit_feature" text NOT NULL,
  "usage_log_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_api_keys" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid,
  "name" text NOT NULL,
  "key_prefix" text NOT NULL,
  "key_hash" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "last_used_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_audit_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid,
  "actor_staff_id" uuid,
  "action" text NOT NULL,
  "resource_type" text,
  "resource_id" text,
  "organisation_id" uuid,
  "success" boolean DEFAULT true NOT NULL,
  "ip_address" inet,
  "user_agent" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_capacity_reservations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contract_id" uuid,
  "organisation_id" uuid NOT NULL,
  "resource_type" text NOT NULL,
  "quantity" bigint NOT NULL,
  "used_quantity" bigint DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_cohort_archive" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "organisation_id" uuid NOT NULL,
  "cohort_name" text NOT NULL,
  "status_before_archive" text NOT NULL,
  "programme_id" uuid,
  "start_date" date,
  "end_date" date,
  "cohort_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "member_count" integer DEFAULT 0 NOT NULL,
  "archived_by" uuid,
  "archive_reason" text,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_cohort_lifecycle" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "previous_cohort_id" uuid,
  "next_cohort_id" uuid,
  "changed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "changed_by" uuid
);
CREATE TABLE public."learnora_cohort_lifecycle_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_id" uuid NOT NULL,
  "from_status" text,
  "to_status" text NOT NULL,
  "reason" text,
  "actor_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_cohort_member_archive" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "cohort_archive_id" uuid NOT NULL,
  "source_cohort_member_id" uuid NOT NULL,
  "source_user_id" uuid,
  "source_cohort_account_id" uuid,
  "display_name" text,
  "email" text,
  "track_id" uuid,
  "track_name" text,
  "membership_status" text NOT NULL,
  "joined_at" timestamp with time zone NOT NULL,
  "course_history" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "lesson_progress" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "learner_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_contract_clauses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL,
  "clause_key" text NOT NULL,
  "category" text NOT NULL,
  "title" text NOT NULL,
  "approved_text" text NOT NULL,
  "jurisdiction" text DEFAULT 'NG'::text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "required" boolean DEFAULT false NOT NULL,
  "conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_contract_entitlements" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contract_id" uuid NOT NULL,
  "entitlement_key" text NOT NULL,
  "limit_value" bigint,
  "unit" text,
  "enabled" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE public."learnora_contract_templates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "template_key" text NOT NULL,
  "jurisdiction" text DEFAULT 'NG'::text NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_contract_versions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contract_id" uuid NOT NULL,
  "version_number" integer NOT NULL,
  "document_url" text,
  "terms" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "draft_content" text,
  "review_status" text DEFAULT 'draft'::text NOT NULL,
  "qa_result" jsonb
);
CREATE TABLE public."learnora_contracts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "request_id" uuid,
  "contract_number" text NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "currency" text DEFAULT 'NGN'::text NOT NULL,
  "start_date" date,
  "end_date" date,
  "commercial_terms" text,
  "document_url" text,
  "signed_at" timestamp with time zone,
  "approved_at" timestamp with time zone,
  "previous_contract_id" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "sent_at" timestamp with time zone,
  "signed_by_user_id" uuid,
  "signature_name" text,
  "signature_title" text,
  "signature_acknowledged_at" timestamp with time zone
);
CREATE TABLE public."learnora_course_purchases" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "status" text DEFAULT 'paid'::text NOT NULL,
  "currency" text,
  "amount_minor" bigint,
  "provider" text,
  "provider_reference" text,
  "purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
  "refunded_at" timestamp with time zone,
  "access_entitlement_id" uuid
);
CREATE TABLE public."learnora_courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "short_description" text,
  "description" text,
  "level" text,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "ownership" text DEFAULT 'learnora'::text NOT NULL,
  "thumbnail_url" text,
  "estimated_hours" numeric(8,2),
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "creator_id" uuid
);
CREATE TABLE public."learnora_creator_accounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "status" text DEFAULT 'application'::text NOT NULL,
  "display_name" text,
  "bio" text,
  "payout_currency" text DEFAULT 'NGN'::text,
  "commission_rate" numeric(5,2) DEFAULT 70 NOT NULL,
  "approved_at" timestamp with time zone,
  "approved_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "application_id" uuid
);
CREATE TABLE public."learnora_creator_applications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "status" text DEFAULT 'submitted'::text NOT NULL,
  "application_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_creator_ledger" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "sale_id" uuid,
  "entry_type" text NOT NULL,
  "amount_minor" bigint NOT NULL,
  "currency" text NOT NULL,
  "available_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE public."learnora_creator_payouts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "amount_minor" bigint NOT NULL,
  "currency" text NOT NULL,
  "provider" text,
  "provider_reference" text,
  "status" text DEFAULT 'requested'::text NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone
);
CREATE TABLE public."learnora_creator_sales" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "creator_id" uuid NOT NULL,
  "buyer_user_id" uuid,
  "course_id" uuid NOT NULL,
  "gross_amount_minor" bigint DEFAULT 0 NOT NULL,
  "currency" text NOT NULL,
  "platform_fee_minor" bigint DEFAULT 0 NOT NULL,
  "creator_earnings_minor" bigint DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "provider_reference" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "available_at" timestamp with time zone
);
CREATE TABLE public."learnora_departments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_discussion_replies" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "discussion_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "body" text NOT NULL,
  "is_answer" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'visible'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_discussions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid,
  "lesson_id" uuid,
  "organisation_id" uuid,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "category" text DEFAULT 'question'::text NOT NULL,
  "status" text DEFAULT 'open'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_enrolments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "organisation_id" uuid,
  "cohort_id" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "source_type" text DEFAULT 'organisation'::text,
  "access_entitlement_id" uuid
);
CREATE TABLE public."learnora_feature_flags" (
  "key" text NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_feedback" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "organisation_id" uuid,
  "lesson_id" uuid,
  "feedback_type" text NOT NULL,
  "rating" integer,
  "message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_learning_path_courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "path_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "order_index" integer DEFAULT 0 NOT NULL,
  "required" boolean DEFAULT true NOT NULL
);
CREATE TABLE public."learnora_learning_paths" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid,
  "organisation_id" uuid,
  "name" text NOT NULL,
  "slug" text,
  "description" text,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_lesson_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "enrolment_id" uuid,
  "progress_percent" integer DEFAULT 0 NOT NULL,
  "completed" boolean DEFAULT false NOT NULL,
  "last_position_seconds" integer DEFAULT 0 NOT NULL,
  "first_started_at" timestamp with time zone,
  "last_accessed_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);
CREATE TABLE public."learnora_lessons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "module_id" uuid NOT NULL,
  "title" text NOT NULL,
  "slug" text,
  "description" text,
  "order_index" integer DEFAULT 0 NOT NULL,
  "lesson_type" text DEFAULT 'mixed'::text NOT NULL,
  "content" text,
  "duration_minutes" integer,
  "is_preview" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "organisation_id" uuid,
  "notification_type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "action_url" text,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "read_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_organisation_lifecycle" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "status" text DEFAULT 'requested'::text NOT NULL,
  "status_reason" text,
  "effective_at" timestamp with time zone DEFAULT now() NOT NULL,
  "changed_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_organisation_lifecycle_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "from_status" text,
  "to_status" text NOT NULL,
  "reason" text,
  "actor_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_organisation_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid,
  "organisation_name" text NOT NULL,
  "contact_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "country" text,
  "website" text,
  "organisation_type" text,
  "request_type" text NOT NULL,
  "organisation_size" integer,
  "expected_learners" integer,
  "expected_instructors" integer,
  "expected_teams" integer,
  "expected_cohorts" integer,
  "duration" text,
  "requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notes" text,
  "status" text DEFAULT 'submitted'::text NOT NULL,
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "reviewed_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "portal_user_id" uuid,
  "portal_created_at" timestamp with time zone
);
CREATE TABLE public."learnora_organisation_role_permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_role" text NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "permission_key" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_platform_admins" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" bigint NOT NULL,
  "platform_role" text DEFAULT 'admin'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_platform_role_permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "platform_role" text NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_platform_settings" (
  "key" text NOT NULL,
  "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_secret" boolean DEFAULT false NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_programme_courses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "programme_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "order_index" integer DEFAULT 0 NOT NULL,
  "required" boolean DEFAULT true NOT NULL
);
CREATE TABLE public."learnora_programmes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "start_date" date,
  "end_date" date,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_staff_accounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "employee_code" text,
  "job_title" text,
  "status" text DEFAULT 'invited'::text NOT NULL,
  "joined_at" timestamp with time zone,
  "left_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_staff_role_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "staff_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "assigned_by" uuid
);
CREATE TABLE public."learnora_staff_role_permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_staff_roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "is_system_role" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_staff_team_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "staff_id" uuid NOT NULL,
  "team_role" text DEFAULT 'member'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "left_at" timestamp with time zone
);
CREATE TABLE public."learnora_staff_teams" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "department_id" uuid,
  "manager_staff_id" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_subscriptions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "status" text DEFAULT 'trialing'::text NOT NULL,
  "plan_code" text,
  "billing_interval" text,
  "currency" text,
  "amount_minor" bigint,
  "provider" text,
  "provider_customer_id" text,
  "provider_subscription_id" text,
  "starts_at" timestamp with time zone,
  "current_period_start" timestamp with time zone,
  "current_period_end" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."learnora_tracks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."lesson_resources" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL,
  "title" text NOT NULL,
  "resource_type" text NOT NULL,
  "storage_path" text,
  "external_url" text,
  "file_size_bytes" bigint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."lesson_videos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL,
  "provider" text DEFAULT 'supabase'::text NOT NULL,
  "storage_path" text,
  "external_video_id" text,
  "title" text,
  "duration_seconds" integer,
  "file_size_bytes" bigint,
  "mime_type" text,
  "thumbnail_url" text,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "is_private" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."lessons" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "legacy_id" text NOT NULL,
  "course_id" uuid NOT NULL,
  "title" text NOT NULL,
  "slug" text,
  "lesson_number" integer DEFAULT 1 NOT NULL,
  "description" text,
  "goal" text,
  "level" text,
  "estimated_minutes" integer,
  "index_estimated_minutes" integer,
  "content_markdown" text,
  "learning_objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "source_file" text,
  "source_checksum" text,
  "witstart" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "import_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."media" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid,
  "lesson_id" uuid,
  "type" text DEFAULT 'video'::text NOT NULL,
  "title" text,
  "url" text,
  "storage_path" text,
  "mime_type" text,
  "size_bytes" bigint,
  "duration_seconds" integer,
  "thumbnail_url" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."organisation_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."organisation_team_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text DEFAULT 'member'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."organisation_teams" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "manager_user_id" uuid,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."organisations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "organisation_type" text DEFAULT 'academy'::text NOT NULL,
  "description" text,
  "logo_url" text,
  "brand_primary" text,
  "brand_secondary" text,
  "template" text DEFAULT 'academy'::text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."password_reset_tokens" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL,
  "email" text NOT NULL,
  "account_type" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."project_submissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text,
  "description" text,
  "repository_url" text,
  "live_url" text,
  "submission_url" text,
  "status" text DEFAULT 'submitted'::text NOT NULL,
  "feedback" text,
  "score" numeric(8,2),
  "submitted_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "reviewed_by" uuid
);
CREATE TABLE public."projects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "instructions" text,
  "skills" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."quiz_attempts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "quiz_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "score" numeric(5,2),
  "passed" boolean,
  "answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "submitted_at" timestamp with time zone
);
CREATE TABLE public."quiz_questions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "quiz_id" uuid NOT NULL,
  "question" text NOT NULL,
  "question_type" text DEFAULT 'multiple_choice'::text NOT NULL,
  "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "correct_answer" jsonb,
  "explanation" text,
  "points" numeric(8,2) DEFAULT 1 NOT NULL,
  "order_index" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public."quizzes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid,
  "course_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "passing_score" numeric(5,2) DEFAULT 70,
  "max_attempts" integer,
  "is_published" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "module_id" uuid
);
CREATE TABLE public."security_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "event_type" text NOT NULL,
  "ip_address" text,
  "details" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "action" text,
  "email" text,
  "ip" text,
  "metadata" jsonb
);
CREATE TABLE public."skill_evidence" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "skill_id" uuid NOT NULL,
  "evidence_type" text NOT NULL,
  "source_id" uuid,
  "score" numeric(8,2),
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."skills" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "category" text,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."team_course_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "assigned_by" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "name" text NOT NULL,
  "expires_at" timestamp with time zone,
  "password_hash" text,
  "role" text DEFAULT 'user'::text,
  "is_paid" boolean DEFAULT false,
  "subscription_tier" text DEFAULT 'free'::text,
  "sub_status" text DEFAULT 'inactive'::text,
  "trial_ends_at" timestamp with time zone,
  "email_verified" boolean DEFAULT false NOT NULL,
  "email_verification_token_hash" text,
  "email_verification_expires_at" timestamp with time zone,
  "password_reset_token_hash" text,
  "password_reset_expires_at" timestamp with time zone,
  "email_verified_at" timestamp with time zone
);

-- Primary keys, unique constraints, checks, and foreign keys.
ALTER TABLE ONLY public."admins" ADD CONSTRAINT "admins_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."admins" ADD CONSTRAINT "admins_role_check" CHECK (role = ANY (ARRAY['super_admin'::text, 'staff_admin'::text, 'witstart_admin'::text]));
ALTER TABLE ONLY public."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_request_status_check" CHECK (request_status = ANY (ARRAY['success'::text, 'failed'::text, 'rate_limited'::text, 'blocked'::text]));
ALTER TABLE ONLY public."assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."assignment_submissions" ADD CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."assignment_submissions" ADD CONSTRAINT "assignment_submissions_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'graded'::text, 'returned'::text]));
ALTER TABLE ONLY public."assignments" ADD CONSTRAINT "assignments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."assignments" ADD CONSTRAINT "assignments_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."assignments" ADD CONSTRAINT "assignments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."badges" ADD CONSTRAINT "badges_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."certificates" ADD CONSTRAINT "certificates_certificate_number_key" UNIQUE (certificate_number);
ALTER TABLE ONLY public."certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."certificates" ADD CONSTRAINT "certificates_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."certificates" ADD CONSTRAINT "certificates_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_cohort_account_id_fkey" FOREIGN KEY (cohort_account_id) REFERENCES cohort_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_cohort_member_id_fkey" FOREIGN KEY (cohort_member_id) REFERENCES cohort_members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_course_assignment_id_fkey" FOREIGN KEY (course_assignment_id) REFERENCES cohort_member_course_assignments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_last_position_seconds_check" CHECK (last_position_seconds >= 0);
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_progress_percent_check" CHECK (progress_percent >= 0 AND progress_percent <= 100);
ALTER TABLE ONLY public."cohort_account_lesson_progress" ADD CONSTRAINT "cohort_account_lesson_progress_unique" UNIQUE (cohort_account_id, lesson_id);
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_cohort_id_email_key" UNIQUE (cohort_id, email);
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_email_format_chk" CHECK (POSITION(('@'::text) IN (email)) > 1);
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_email_normalized_chk" CHECK (email = lower(btrim(email)));
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_first_name_check" CHECK (length(btrim(first_name)) >= 1 AND length(btrim(first_name)) <= 100);
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_last_name_check" CHECK (length(btrim(last_name)) >= 1 AND length(btrim(last_name)) <= 100);
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_accounts" ADD CONSTRAINT "cohort_accounts_status_check" CHECK (status = ANY (ARRAY['pending_activation'::text, 'active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."cohort_course_assignments" ADD CONSTRAINT "cohort_course_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."cohort_course_assignments" ADD CONSTRAINT "cohort_course_assignments_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_course_assignments" ADD CONSTRAINT "cohort_course_assignments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_course_assignments" ADD CONSTRAINT "cohort_course_assignments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_course_assignments" ADD CONSTRAINT "cohort_course_assignments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."cohort_course_assignments" ADD CONSTRAINT "cohort_course_assignments_unique" UNIQUE (cohort_id, course_id);
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignment_unique" UNIQUE (cohort_member_id, course_id);
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_cohort_member_id_fkey" FOREIGN KEY (cohort_member_id) REFERENCES cohort_members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id);
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'completed'::text]));
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_track_id_fkey" FOREIGN KEY (track_id) REFERENCES learnora_tracks(id);
ALTER TABLE ONLY public."cohort_member_course_assignments" ADD CONSTRAINT "cohort_member_course_assignments_tutor_user_id_fkey" FOREIGN KEY (tutor_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."cohort_member_lesson_assignments" ADD CONSTRAINT "cohort_member_lesson_assignment_unique" UNIQUE (course_assignment_id, lesson_id);
ALTER TABLE ONLY public."cohort_member_lesson_assignments" ADD CONSTRAINT "cohort_member_lesson_assignments_course_assignment_id_fkey" FOREIGN KEY (course_assignment_id) REFERENCES cohort_member_course_assignments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_member_lesson_assignments" ADD CONSTRAINT "cohort_member_lesson_assignments_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_member_lesson_assignments" ADD CONSTRAINT "cohort_member_lesson_assignments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_member_lesson_assignments" ADD CONSTRAINT "cohort_member_lesson_assignments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_account_track_chk" CHECK (cohort_account_id IS NULL OR track_id IS NOT NULL);
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_cohort_account_id_fkey" FOREIGN KEY (cohort_account_id) REFERENCES cohort_accounts(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_user_id_key" UNIQUE (cohort_id, user_id);
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_identity_chk" CHECK (user_id IS NOT NULL OR cohort_account_id IS NOT NULL);
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_status_check" CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'withdrawn'::text]));
ALTER TABLE ONLY public."cohort_members" ADD CONSTRAINT "cohort_members_track_id_fkey" FOREIGN KEY (track_id) REFERENCES learnora_tracks(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_cohort_id_track_id_course_id_key" UNIQUE (cohort_id, track_id, course_id);
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_option_fk" FOREIGN KEY (cohort_id, track_id) REFERENCES cohort_track_options(cohort_id, track_id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."cohort_track_courses" ADD CONSTRAINT "cohort_track_courses_track_id_fkey" FOREIGN KEY (track_id) REFERENCES learnora_tracks(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohort_track_options" ADD CONSTRAINT "cohort_track_options_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohort_track_options" ADD CONSTRAINT "cohort_track_options_cohort_id_track_id_key" UNIQUE (cohort_id, track_id);
ALTER TABLE ONLY public."cohort_track_options" ADD CONSTRAINT "cohort_track_options_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."cohort_track_options" ADD CONSTRAINT "cohort_track_options_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohort_track_options" ADD CONSTRAINT "cohort_track_options_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."cohort_track_options" ADD CONSTRAINT "cohort_track_options_track_id_fkey" FOREIGN KEY (track_id) REFERENCES learnora_tracks(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_capacity_positive" CHECK (capacity IS NULL OR capacity >= 1);
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_date_range_valid" CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_instructor_capacity_nonnegative" CHECK (instructor_capacity IS NULL OR instructor_capacity >= 0);
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_programme_id_fkey" FOREIGN KEY (programme_id) REFERENCES learnora_programmes(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."cohorts" ADD CONSTRAINT "cohorts_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'upcoming'::text, 'active'::text, 'ending'::text, 'completed'::text, 'expired'::text, 'closed'::text, 'archived'::text]));
ALTER TABLE ONLY public."course_access" ADD CONSTRAINT "course_access_access_type_check" CHECK (access_type = ANY (ARRAY['assigned'::text, 'catalogue'::text, 'private'::text]));
ALTER TABLE ONLY public."course_access" ADD CONSTRAINT "course_access_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."course_access" ADD CONSTRAINT "course_access_course_id_organisation_id_key" UNIQUE (course_id, organisation_id);
ALTER TABLE ONLY public."course_access" ADD CONSTRAINT "course_access_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."course_access" ADD CONSTRAINT "course_access_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."course_access" ADD CONSTRAINT "course_access_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."course_modules" ADD CONSTRAINT "course_modules_course_id_order_index_key" UNIQUE (course_id, order_index);
ALTER TABLE ONLY public."course_modules" ADD CONSTRAINT "course_modules_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."course_modules" ADD CONSTRAINT "course_modules_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
ALTER TABLE ONLY public."courses" ADD CONSTRAINT "courses_legacy_id_key" UNIQUE (legacy_id);
ALTER TABLE ONLY public."courses" ADD CONSTRAINT "courses_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."courses" ADD CONSTRAINT "courses_slug_key" UNIQUE (slug);
ALTER TABLE ONLY public."courses" ADD CONSTRAINT "courses_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
ALTER TABLE ONLY public."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_token_hash_key" UNIQUE (token_hash);
ALTER TABLE ONLY public."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_badges" ADD CONSTRAINT "learner_badges_badge_id_fkey" FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_badges" ADD CONSTRAINT "learner_badges_badge_id_user_id_key" UNIQUE (badge_id, user_id);
ALTER TABLE ONLY public."learner_badges" ADD CONSTRAINT "learner_badges_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learner_lesson_notes" ADD CONSTRAINT "learner_lesson_notes_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_lesson_notes" ADD CONSTRAINT "learner_lesson_notes_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_lesson_notes" ADD CONSTRAINT "learner_lesson_notes_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learner_lesson_notes" ADD CONSTRAINT "learner_lesson_notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_lesson_notes" ADD CONSTRAINT "learner_lesson_notes_user_lesson_unique" UNIQUE (user_id, lesson_id);
ALTER TABLE ONLY public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_experience_level_check" CHECK (experience_level = ANY (ARRAY['beginner'::text, 'some_experience'::text, 'experienced'::text, 'career_changer'::text]));
ALTER TABLE ONLY public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_pkey" PRIMARY KEY (user_id);
ALTER TABLE ONLY public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_onboarding_profiles" ADD CONSTRAINT "learner_onboarding_profiles_weekly_time_minutes_check" CHECK (weekly_time_minutes >= 15 AND weekly_time_minutes <= 3000);
ALTER TABLE ONLY public."learner_skills" ADD CONSTRAINT "learner_skills_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_skills" ADD CONSTRAINT "learner_skills_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learner_skills" ADD CONSTRAINT "learner_skills_proficiency_check" CHECK (proficiency >= 0::numeric AND proficiency <= 100::numeric);
ALTER TABLE ONLY public."learner_skills" ADD CONSTRAINT "learner_skills_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learner_skills" ADD CONSTRAINT "learner_skills_status_check" CHECK (status = ANY (ARRAY['not_started'::text, 'developing'::text, 'competent'::text, 'advanced'::text]));
ALTER TABLE ONLY public."learner_skills" ADD CONSTRAINT "learner_skills_user_id_skill_id_organisation_id_key" UNIQUE (user_id, skill_id, organisation_id);
ALTER TABLE ONLY public."learning_recommendations" ADD CONSTRAINT "learning_recommendations_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learning_recommendations" ADD CONSTRAINT "learning_recommendations_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learning_recommendations" ADD CONSTRAINT "learning_recommendations_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learning_recommendations" ADD CONSTRAINT "learning_recommendations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learning_recommendations" ADD CONSTRAINT "learning_recommendations_source_check" CHECK (source = ANY (ARRAY['rules'::text, 'ai'::text, 'instructor'::text, 'system'::text]));
ALTER TABLE ONLY public."learning_recommendations" ADD CONSTRAINT "learning_recommendations_status_check" CHECK (status = ANY (ARRAY['active'::text, 'dismissed'::text, 'completed'::text, 'expired'::text]));
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_source_type_check" CHECK (source_type = ANY (ARRAY['subscription'::text, 'purchase'::text, 'organisation_contract'::text, 'organisation_assignment'::text, 'scholarship'::text, 'promotion'::text, 'manual'::text]));
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_status_check" CHECK (status = ANY (ARRAY['active'::text, 'scheduled'::text, 'expired'::text, 'revoked'::text]));
ALTER TABLE ONLY public."learnora_access_entitlements" ADD CONSTRAINT "learnora_access_entitlements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_activity_logs" ADD CONSTRAINT "learnora_activity_logs_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_activity_logs" ADD CONSTRAINT "learnora_activity_logs_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_org_role_unique" UNIQUE (admin_id, organisation_id, role);
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_organisation_access_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_organisation_access_admin_id_organisation_id_key" UNIQUE (admin_id, organisation_id);
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_organisation_access_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_organisation_access_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_organisation_access_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'instructor'::text, 'support'::text, 'analyst'::text, 'content_manager'::text]));
ALTER TABLE ONLY public."learnora_admin_organisation_access" ADD CONSTRAINT "learnora_admin_organisation_access_status_check" CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'revoked'::text]));
ALTER TABLE ONLY public."learnora_ai_conversations" ADD CONSTRAINT "learnora_ai_conversations_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_ai_conversations" ADD CONSTRAINT "learnora_ai_conversations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_ai_conversations" ADD CONSTRAINT "learnora_ai_conversations_status_check" CHECK (status = ANY (ARRAY['active'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_ai_conversations" ADD CONSTRAINT "learnora_ai_conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_ai_limits" ADD CONSTRAINT "learnora_ai_limits_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_ai_limits" ADD CONSTRAINT "learnora_ai_limits_scope_type_check" CHECK (scope_type = ANY (ARRAY['global'::text, 'user'::text, 'organisation'::text, 'feature'::text]));
ALTER TABLE ONLY public."learnora_ai_messages" ADD CONSTRAINT "learnora_ai_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES learnora_ai_conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_ai_messages" ADD CONSTRAINT "learnora_ai_messages_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_ai_messages" ADD CONSTRAINT "learnora_ai_messages_role_check" CHECK (role = ANY (ARRAY['system'::text, 'user'::text, 'assistant'::text, 'tool'::text]));
ALTER TABLE ONLY public."learnora_ai_profiles" ADD CONSTRAINT "learnora_ai_profiles_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_ai_profiles" ADD CONSTRAINT "learnora_ai_profiles_profile_key_key" UNIQUE (profile_key);
ALTER TABLE ONLY public."learnora_ai_providers" ADD CONSTRAINT "learnora_ai_providers_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_ai_providers" ADD CONSTRAINT "learnora_ai_providers_provider_key_key" UNIQUE (provider_key);
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_feature_check" CHECK (length(btrim(feature)) > 0);
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_limit_feature_check" CHECK (length(btrim(limit_feature)) > 0);
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_scope_type_check" CHECK (scope_type = ANY (ARRAY['user'::text, 'organisation'::text, 'global'::text, 'feature'::text]));
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_usage_log_id_fkey" FOREIGN KEY (usage_log_id) REFERENCES ai_usage_logs(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_ai_quota_reservations" ADD CONSTRAINT "learnora_ai_quota_reservations_usage_log_id_key" UNIQUE (usage_log_id);
ALTER TABLE ONLY public."learnora_api_keys" ADD CONSTRAINT "learnora_api_keys_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_api_keys" ADD CONSTRAINT "learnora_api_keys_key_hash_key" UNIQUE (key_hash);
ALTER TABLE ONLY public."learnora_api_keys" ADD CONSTRAINT "learnora_api_keys_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_api_keys" ADD CONSTRAINT "learnora_api_keys_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_api_keys" ADD CONSTRAINT "learnora_api_keys_status_check" CHECK (status = ANY (ARRAY['active'::text, 'revoked'::text]));
ALTER TABLE ONLY public."learnora_audit_events" ADD CONSTRAINT "learnora_audit_events_actor_staff_id_fkey" FOREIGN KEY (actor_staff_id) REFERENCES learnora_staff_accounts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_audit_events" ADD CONSTRAINT "learnora_audit_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_audit_events" ADD CONSTRAINT "learnora_audit_events_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_audit_events" ADD CONSTRAINT "learnora_audit_events_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES learnora_contracts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_quantity_check" CHECK (quantity >= 0);
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_resource_type_check" CHECK (resource_type = ANY (ARRAY['learners'::text, 'instructors'::text, 'teams'::text, 'cohorts'::text, 'courses'::text, 'storage'::text, 'ai'::text]));
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_status_check" CHECK (status = ANY (ARRAY['active'::text, 'released'::text, 'expired'::text]));
ALTER TABLE ONLY public."learnora_capacity_reservations" ADD CONSTRAINT "learnora_capacity_reservations_used_quantity_check" CHECK (used_quantity >= 0);
ALTER TABLE ONLY public."learnora_cohort_archive" ADD CONSTRAINT "learnora_cohort_archive_cohort_id_key" UNIQUE (cohort_id);
ALTER TABLE ONLY public."learnora_cohort_archive" ADD CONSTRAINT "learnora_cohort_archive_member_count_check" CHECK (member_count >= 0);
ALTER TABLE ONLY public."learnora_cohort_archive" ADD CONSTRAINT "learnora_cohort_archive_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_cohort_id_key" UNIQUE (cohort_id);
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_next_cohort_id_fkey" FOREIGN KEY (next_cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_previous_cohort_id_fkey" FOREIGN KEY (previous_cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_cohort_lifecycle" ADD CONSTRAINT "learnora_cohort_lifecycle_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'upcoming'::text, 'active'::text, 'ending'::text, 'completed'::text, 'expired'::text, 'closed'::text]));
ALTER TABLE ONLY public."learnora_cohort_lifecycle_events" ADD CONSTRAINT "learnora_cohort_lifecycle_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_cohort_lifecycle_events" ADD CONSTRAINT "learnora_cohort_lifecycle_events_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_cohort_lifecycle_events" ADD CONSTRAINT "learnora_cohort_lifecycle_events_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_cohort_member_archive" ADD CONSTRAINT "learnora_cohort_member_archive_cohort_archive_id_fkey" FOREIGN KEY (cohort_archive_id) REFERENCES learnora_cohort_archive(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_cohort_member_archive" ADD CONSTRAINT "learnora_cohort_member_archive_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_cohort_member_archive" ADD CONSTRAINT "learnora_cohort_member_archive_source_unique" UNIQUE (cohort_archive_id, source_cohort_member_id);
ALTER TABLE ONLY public."learnora_contract_clauses" ADD CONSTRAINT "learnora_contract_clauses_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_contract_clauses" ADD CONSTRAINT "learnora_contract_clauses_template_id_clause_key_version_key" UNIQUE (template_id, clause_key, version);
ALTER TABLE ONLY public."learnora_contract_clauses" ADD CONSTRAINT "learnora_contract_clauses_template_id_fkey" FOREIGN KEY (template_id) REFERENCES learnora_contract_templates(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_contract_entitlements" ADD CONSTRAINT "learnora_contract_entitlements_contract_id_entitlement_key_key" UNIQUE (contract_id, entitlement_key);
ALTER TABLE ONLY public."learnora_contract_entitlements" ADD CONSTRAINT "learnora_contract_entitlements_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES learnora_contracts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_contract_entitlements" ADD CONSTRAINT "learnora_contract_entitlements_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_contract_templates" ADD CONSTRAINT "learnora_contract_templates_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_contract_templates" ADD CONSTRAINT "learnora_contract_templates_template_key_jurisdiction_versi_key" UNIQUE (template_key, jurisdiction, version);
ALTER TABLE ONLY public."learnora_contract_versions" ADD CONSTRAINT "learnora_contract_versions_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES learnora_contracts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_contract_versions" ADD CONSTRAINT "learnora_contract_versions_contract_id_version_number_key" UNIQUE (contract_id, version_number);
ALTER TABLE ONLY public."learnora_contract_versions" ADD CONSTRAINT "learnora_contract_versions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_contract_number_key" UNIQUE (contract_number);
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_previous_contract_id_fkey" FOREIGN KEY (previous_contract_id) REFERENCES learnora_contracts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_request_id_fkey" FOREIGN KEY (request_id) REFERENCES learnora_organisation_requests(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_signed_by_user_id_fkey" FOREIGN KEY (signed_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_contracts" ADD CONSTRAINT "learnora_contracts_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'signed'::text, 'active'::text, 'expiring'::text, 'expired'::text, 'renewed'::text, 'terminated'::text]));
ALTER TABLE ONLY public."learnora_course_purchases" ADD CONSTRAINT "learnora_course_purchases_access_entitlement_id_fkey" FOREIGN KEY (access_entitlement_id) REFERENCES learnora_access_entitlements(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_course_purchases" ADD CONSTRAINT "learnora_course_purchases_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_course_purchases" ADD CONSTRAINT "learnora_course_purchases_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_course_purchases" ADD CONSTRAINT "learnora_course_purchases_provider_reference_key" UNIQUE (provider_reference);
ALTER TABLE ONLY public."learnora_course_purchases" ADD CONSTRAINT "learnora_course_purchases_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text, 'cancelled'::text]));
ALTER TABLE ONLY public."learnora_course_purchases" ADD CONSTRAINT "learnora_course_purchases_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES learnora_creator_accounts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_level_check" CHECK (level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'mixed'::text]));
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_organisation_id_slug_key" UNIQUE (organisation_id, slug);
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_ownership_check" CHECK (ownership = ANY (ARRAY['learnora'::text, 'organisation'::text, 'creator'::text]));
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_courses" ADD CONSTRAINT "learnora_courses_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_application_id_fkey" FOREIGN KEY (application_id) REFERENCES learnora_creator_applications(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_commission_rate_check" CHECK (commission_rate >= 0::numeric AND commission_rate <= 100::numeric);
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_status_check" CHECK (status = ANY (ARRAY['application'::text, 'under_review'::text, 'approved'::text, 'suspended'::text, 'closed'::text]));
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_creator_accounts" ADD CONSTRAINT "learnora_creator_accounts_user_id_key" UNIQUE (user_id);
ALTER TABLE ONLY public."learnora_creator_applications" ADD CONSTRAINT "learnora_creator_applications_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_creator_applications" ADD CONSTRAINT "learnora_creator_applications_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_creator_applications" ADD CONSTRAINT "learnora_creator_applications_status_check" CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'declined'::text, 'withdrawn'::text]));
ALTER TABLE ONLY public."learnora_creator_applications" ADD CONSTRAINT "learnora_creator_applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_creator_ledger" ADD CONSTRAINT "creator_ledger_amount_direction_check" CHECK ((entry_type = ANY (ARRAY['sale'::text, 'adjustment'::text])) AND amount_minor >= 0 OR (entry_type = ANY (ARRAY['platform_fee'::text, 'refund'::text, 'payout'::text])) AND amount_minor >= 0);
ALTER TABLE ONLY public."learnora_creator_ledger" ADD CONSTRAINT "learnora_creator_ledger_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES learnora_creator_accounts(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_creator_ledger" ADD CONSTRAINT "learnora_creator_ledger_entry_type_check" CHECK (entry_type = ANY (ARRAY['sale'::text, 'platform_fee'::text, 'refund'::text, 'payout'::text, 'adjustment'::text]));
ALTER TABLE ONLY public."learnora_creator_ledger" ADD CONSTRAINT "learnora_creator_ledger_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_creator_ledger" ADD CONSTRAINT "learnora_creator_ledger_sale_id_fkey" FOREIGN KEY (sale_id) REFERENCES learnora_creator_sales(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_creator_payouts" ADD CONSTRAINT "learnora_creator_payouts_amount_minor_check" CHECK (amount_minor > 0);
ALTER TABLE ONLY public."learnora_creator_payouts" ADD CONSTRAINT "learnora_creator_payouts_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES learnora_creator_accounts(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_creator_payouts" ADD CONSTRAINT "learnora_creator_payouts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_creator_payouts" ADD CONSTRAINT "learnora_creator_payouts_status_check" CHECK (status = ANY (ARRAY['requested'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'cancelled'::text]));
ALTER TABLE ONLY public."learnora_creator_sales" ADD CONSTRAINT "learnora_creator_sales_buyer_user_id_fkey" FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_creator_sales" ADD CONSTRAINT "learnora_creator_sales_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_creator_sales" ADD CONSTRAINT "learnora_creator_sales_creator_id_fkey" FOREIGN KEY (creator_id) REFERENCES learnora_creator_accounts(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_creator_sales" ADD CONSTRAINT "learnora_creator_sales_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_creator_sales" ADD CONSTRAINT "learnora_creator_sales_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'available'::text, 'refunded'::text, 'cancelled'::text]));
ALTER TABLE ONLY public."learnora_departments" ADD CONSTRAINT "learnora_departments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_departments" ADD CONSTRAINT "learnora_departments_slug_key" UNIQUE (slug);
ALTER TABLE ONLY public."learnora_departments" ADD CONSTRAINT "learnora_departments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_discussion_replies" ADD CONSTRAINT "learnora_discussion_replies_discussion_id_fkey" FOREIGN KEY (discussion_id) REFERENCES learnora_discussions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_discussion_replies" ADD CONSTRAINT "learnora_discussion_replies_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_discussion_replies" ADD CONSTRAINT "learnora_discussion_replies_status_check" CHECK (status = ANY (ARRAY['visible'::text, 'hidden'::text]));
ALTER TABLE ONLY public."learnora_discussion_replies" ADD CONSTRAINT "learnora_discussion_replies_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_category_check" CHECK (category = ANY (ARRAY['question'::text, 'discussion'::text, 'announcement'::text]));
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_status_check" CHECK (status = ANY (ARRAY['open'::text, 'closed'::text, 'hidden'::text]));
ALTER TABLE ONLY public."learnora_discussions" ADD CONSTRAINT "learnora_discussions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_access_entitlement_id_fkey" FOREIGN KEY (access_entitlement_id) REFERENCES learnora_access_entitlements(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_cohort_id_fkey" FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_status_check" CHECK (status = ANY (ARRAY['invited'::text, 'active'::text, 'completed'::text, 'withdrawn'::text, 'suspended'::text]));
ALTER TABLE ONLY public."learnora_enrolments" ADD CONSTRAINT "learnora_enrolments_user_id_course_id_organisation_id_key" UNIQUE (user_id, course_id, organisation_id);
ALTER TABLE ONLY public."learnora_feature_flags" ADD CONSTRAINT "learnora_feature_flags_pkey" PRIMARY KEY (key);
ALTER TABLE ONLY public."learnora_feature_flags" ADD CONSTRAINT "learnora_feature_flags_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_feedback" ADD CONSTRAINT "learnora_feedback_feedback_type_check" CHECK (feedback_type = ANY (ARRAY['lesson'::text, 'platform'::text, 'feature_request'::text, 'instructor'::text, 'organisation'::text]));
ALTER TABLE ONLY public."learnora_feedback" ADD CONSTRAINT "learnora_feedback_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_feedback" ADD CONSTRAINT "learnora_feedback_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_feedback" ADD CONSTRAINT "learnora_feedback_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_feedback" ADD CONSTRAINT "learnora_feedback_rating_check" CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE ONLY public."learnora_learning_path_courses" ADD CONSTRAINT "learnora_learning_path_courses_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_learning_path_courses" ADD CONSTRAINT "learnora_learning_path_courses_path_id_course_id_key" UNIQUE (path_id, course_id);
ALTER TABLE ONLY public."learnora_learning_path_courses" ADD CONSTRAINT "learnora_learning_path_courses_path_id_fkey" FOREIGN KEY (path_id) REFERENCES learnora_learning_paths(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_learning_path_courses" ADD CONSTRAINT "learnora_learning_path_courses_path_id_order_index_key" UNIQUE (path_id, order_index);
ALTER TABLE ONLY public."learnora_learning_path_courses" ADD CONSTRAINT "learnora_learning_path_courses_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_learning_paths" ADD CONSTRAINT "learnora_learning_paths_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_learning_paths" ADD CONSTRAINT "learnora_learning_paths_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_learning_paths" ADD CONSTRAINT "learnora_learning_paths_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_learning_paths" ADD CONSTRAINT "learnora_learning_paths_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_learning_paths" ADD CONSTRAINT "learnora_learning_paths_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_lesson_progress" ADD CONSTRAINT "learnora_lesson_progress_enrolment_id_fkey" FOREIGN KEY (enrolment_id) REFERENCES learnora_enrolments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_lesson_progress" ADD CONSTRAINT "learnora_lesson_progress_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_lesson_progress" ADD CONSTRAINT "learnora_lesson_progress_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_lesson_progress" ADD CONSTRAINT "learnora_lesson_progress_progress_percent_check" CHECK (progress_percent >= 0 AND progress_percent <= 100);
ALTER TABLE ONLY public."learnora_lesson_progress" ADD CONSTRAINT "learnora_lesson_progress_user_id_lesson_id_key" UNIQUE (user_id, lesson_id);
ALTER TABLE ONLY public."learnora_lessons" ADD CONSTRAINT "learnora_lessons_lesson_type_check" CHECK (lesson_type = ANY (ARRAY['video'::text, 'article'::text, 'text'::text, 'practice'::text, 'quiz'::text, 'assignment'::text, 'project'::text, 'mixed'::text]));
ALTER TABLE ONLY public."learnora_lessons" ADD CONSTRAINT "learnora_lessons_module_id_fkey" FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_lessons" ADD CONSTRAINT "learnora_lessons_module_id_order_index_key" UNIQUE (module_id, order_index);
ALTER TABLE ONLY public."learnora_lessons" ADD CONSTRAINT "learnora_lessons_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_lessons" ADD CONSTRAINT "learnora_lessons_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_notifications" ADD CONSTRAINT "learnora_notifications_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_notifications" ADD CONSTRAINT "learnora_notifications_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_notifications" ADD CONSTRAINT "learnora_notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_organisation_lifecycle" ADD CONSTRAINT "learnora_organisation_lifecycle_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_organisation_lifecycle" ADD CONSTRAINT "learnora_organisation_lifecycle_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_organisation_lifecycle" ADD CONSTRAINT "learnora_organisation_lifecycle_organisation_id_key" UNIQUE (organisation_id);
ALTER TABLE ONLY public."learnora_organisation_lifecycle" ADD CONSTRAINT "learnora_organisation_lifecycle_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_organisation_lifecycle" ADD CONSTRAINT "learnora_organisation_lifecycle_status_check" CHECK (status = ANY (ARRAY['requested'::text, 'under_review'::text, 'contract_pending'::text, 'pending_activation'::text, 'active'::text, 'expiring'::text, 'expired'::text, 'inactive'::text, 'suspended'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_organisation_lifecycle_events" ADD CONSTRAINT "learnora_organisation_lifecycle_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_organisation_lifecycle_events" ADD CONSTRAINT "learnora_organisation_lifecycle_events_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_organisation_lifecycle_events" ADD CONSTRAINT "learnora_organisation_lifecycle_events_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_organisation_requests" ADD CONSTRAINT "learnora_organisation_requests_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_organisation_requests" ADD CONSTRAINT "learnora_organisation_requests_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_organisation_requests" ADD CONSTRAINT "learnora_organisation_requests_portal_user_id_fkey" FOREIGN KEY (portal_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_organisation_requests" ADD CONSTRAINT "learnora_organisation_requests_status_check" CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'discussion'::text, 'contract_preparation'::text, 'contract_sent'::text, 'signed'::text, 'pending_approval'::text, 'active'::text, 'declined'::text, 'closed'::text]));
ALTER TABLE ONLY public."learnora_organisation_role_permissions" ADD CONSTRAINT "learnora_organisation_role_pe_organisation_role_permission__key" UNIQUE (organisation_role, permission_id);
ALTER TABLE ONLY public."learnora_organisation_role_permissions" ADD CONSTRAINT "learnora_organisation_role_permissions_organisation_role_check" CHECK (organisation_role = ANY (ARRAY['owner'::text, 'admin'::text, 'instructor'::text, 'learner'::text]));
ALTER TABLE ONLY public."learnora_organisation_role_permissions" ADD CONSTRAINT "learnora_organisation_role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES learnora_permissions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_organisation_role_permissions" ADD CONSTRAINT "learnora_organisation_role_permissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_permissions" ADD CONSTRAINT "learnora_permissions_permission_key_key" UNIQUE (permission_key);
ALTER TABLE ONLY public."learnora_permissions" ADD CONSTRAINT "learnora_permissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_platform_admins" ADD CONSTRAINT "learnora_platform_admins_admin_id_fkey" FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_platform_admins" ADD CONSTRAINT "learnora_platform_admins_admin_role_unique" UNIQUE (admin_id, platform_role);
ALTER TABLE ONLY public."learnora_platform_admins" ADD CONSTRAINT "learnora_platform_admins_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_platform_admins" ADD CONSTRAINT "learnora_platform_admins_platform_role_check" CHECK (platform_role = ANY (ARRAY['super_admin'::text, 'platform_admin'::text, 'support_admin'::text, 'content_admin'::text, 'analytics_admin'::text]));
ALTER TABLE ONLY public."learnora_platform_admins" ADD CONSTRAINT "learnora_platform_admins_status_check" CHECK (status = ANY (ARRAY['active'::text, 'suspended'::text, 'revoked'::text]));
ALTER TABLE ONLY public."learnora_platform_role_permissions" ADD CONSTRAINT "learnora_platform_role_permissi_platform_role_permission_id_key" UNIQUE (platform_role, permission_id);
ALTER TABLE ONLY public."learnora_platform_role_permissions" ADD CONSTRAINT "learnora_platform_role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES learnora_permissions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_platform_role_permissions" ADD CONSTRAINT "learnora_platform_role_permissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_platform_role_permissions" ADD CONSTRAINT "learnora_platform_role_permissions_platform_role_check" CHECK (platform_role = ANY (ARRAY['super_admin'::text, 'platform_admin'::text, 'support_admin'::text, 'content_admin'::text, 'analytics_admin'::text]));
ALTER TABLE ONLY public."learnora_platform_settings" ADD CONSTRAINT "learnora_platform_settings_pkey" PRIMARY KEY (key);
ALTER TABLE ONLY public."learnora_platform_settings" ADD CONSTRAINT "learnora_platform_settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_programme_courses" ADD CONSTRAINT "learnora_programme_courses_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_programme_courses" ADD CONSTRAINT "learnora_programme_courses_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_programme_courses" ADD CONSTRAINT "learnora_programme_courses_programme_id_course_id_key" UNIQUE (programme_id, course_id);
ALTER TABLE ONLY public."learnora_programme_courses" ADD CONSTRAINT "learnora_programme_courses_programme_id_fkey" FOREIGN KEY (programme_id) REFERENCES learnora_programmes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_programme_courses" ADD CONSTRAINT "learnora_programme_courses_programme_id_order_index_key" UNIQUE (programme_id, order_index);
ALTER TABLE ONLY public."learnora_programmes" ADD CONSTRAINT "learnora_programmes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_programmes" ADD CONSTRAINT "learnora_programmes_date_range_valid" CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
ALTER TABLE ONLY public."learnora_programmes" ADD CONSTRAINT "learnora_programmes_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_programmes" ADD CONSTRAINT "learnora_programmes_organisation_id_slug_key" UNIQUE (organisation_id, slug);
ALTER TABLE ONLY public."learnora_programmes" ADD CONSTRAINT "learnora_programmes_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_programmes" ADD CONSTRAINT "learnora_programmes_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'upcoming'::text, 'active'::text, 'completed'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_staff_accounts" ADD CONSTRAINT "learnora_staff_accounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_staff_accounts" ADD CONSTRAINT "learnora_staff_accounts_employee_code_key" UNIQUE (employee_code);
ALTER TABLE ONLY public."learnora_staff_accounts" ADD CONSTRAINT "learnora_staff_accounts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_staff_accounts" ADD CONSTRAINT "learnora_staff_accounts_status_check" CHECK (status = ANY (ARRAY['invited'::text, 'pending_activation'::text, 'active'::text, 'suspended'::text, 'deactivated'::text]));
ALTER TABLE ONLY public."learnora_staff_accounts" ADD CONSTRAINT "learnora_staff_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_staff_accounts" ADD CONSTRAINT "learnora_staff_accounts_user_id_key" UNIQUE (user_id);
ALTER TABLE ONLY public."learnora_staff_role_assignments" ADD CONSTRAINT "learnora_staff_role_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES learnora_staff_accounts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_staff_role_assignments" ADD CONSTRAINT "learnora_staff_role_assignments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_staff_role_assignments" ADD CONSTRAINT "learnora_staff_role_assignments_role_id_fkey" FOREIGN KEY (role_id) REFERENCES learnora_staff_roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_staff_role_assignments" ADD CONSTRAINT "learnora_staff_role_assignments_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES learnora_staff_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_staff_role_assignments" ADD CONSTRAINT "learnora_staff_role_assignments_staff_id_role_id_key" UNIQUE (staff_id, role_id);
ALTER TABLE ONLY public."learnora_staff_role_assignments" ADD CONSTRAINT "learnora_staff_role_assignments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."learnora_staff_role_permissions" ADD CONSTRAINT "learnora_staff_role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES learnora_permissions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_staff_role_permissions" ADD CONSTRAINT "learnora_staff_role_permissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_staff_role_permissions" ADD CONSTRAINT "learnora_staff_role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES learnora_staff_roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_staff_role_permissions" ADD CONSTRAINT "learnora_staff_role_permissions_role_id_permission_id_key" UNIQUE (role_id, permission_id);
ALTER TABLE ONLY public."learnora_staff_roles" ADD CONSTRAINT "learnora_staff_roles_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_staff_roles" ADD CONSTRAINT "learnora_staff_roles_slug_key" UNIQUE (slug);
ALTER TABLE ONLY public."learnora_staff_roles" ADD CONSTRAINT "learnora_staff_roles_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_staff_team_members" ADD CONSTRAINT "learnora_staff_team_members_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_staff_team_members" ADD CONSTRAINT "learnora_staff_team_members_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES learnora_staff_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_staff_team_members" ADD CONSTRAINT "learnora_staff_team_members_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."learnora_staff_team_members" ADD CONSTRAINT "learnora_staff_team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES learnora_staff_teams(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_staff_team_members" ADD CONSTRAINT "learnora_staff_team_members_team_id_staff_id_key" UNIQUE (team_id, staff_id);
ALTER TABLE ONLY public."learnora_staff_teams" ADD CONSTRAINT "learnora_staff_teams_department_id_fkey" FOREIGN KEY (department_id) REFERENCES learnora_departments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_staff_teams" ADD CONSTRAINT "learnora_staff_teams_manager_staff_id_fkey" FOREIGN KEY (manager_staff_id) REFERENCES learnora_staff_accounts(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_staff_teams" ADD CONSTRAINT "learnora_staff_teams_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_staff_teams" ADD CONSTRAINT "learnora_staff_teams_slug_key" UNIQUE (slug);
ALTER TABLE ONLY public."learnora_staff_teams" ADD CONSTRAINT "learnora_staff_teams_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));
ALTER TABLE ONLY public."learnora_subscriptions" ADD CONSTRAINT "learnora_subscriptions_billing_interval_check" CHECK (billing_interval = ANY (ARRAY['monthly'::text, 'yearly'::text, 'one_time'::text]));
ALTER TABLE ONLY public."learnora_subscriptions" ADD CONSTRAINT "learnora_subscriptions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_subscriptions" ADD CONSTRAINT "learnora_subscriptions_status_check" CHECK (status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'paused'::text, 'cancelled'::text, 'expired'::text]));
ALTER TABLE ONLY public."learnora_subscriptions" ADD CONSTRAINT "learnora_subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE ONLY public."learnora_tracks" ADD CONSTRAINT "learnora_tracks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."learnora_tracks" ADD CONSTRAINT "learnora_tracks_name_check" CHECK (length(btrim(name)) >= 2 AND length(btrim(name)) <= 120);
ALTER TABLE ONLY public."learnora_tracks" ADD CONSTRAINT "learnora_tracks_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."learnora_tracks" ADD CONSTRAINT "learnora_tracks_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."learnora_tracks" ADD CONSTRAINT "learnora_tracks_slug_check" CHECK (length(btrim(slug)) >= 2 AND length(btrim(slug)) <= 140);
ALTER TABLE ONLY public."learnora_tracks" ADD CONSTRAINT "learnora_tracks_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));
ALTER TABLE ONLY public."lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."lesson_resources" ADD CONSTRAINT "lesson_resources_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."lesson_resources" ADD CONSTRAINT "lesson_resources_resource_type_check" CHECK (resource_type = ANY (ARRAY['pdf'::text, 'document'::text, 'spreadsheet'::text, 'image'::text, 'link'::text, 'dataset'::text, 'other'::text]));
ALTER TABLE ONLY public."lesson_videos" ADD CONSTRAINT "lesson_videos_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."lesson_videos" ADD CONSTRAINT "lesson_videos_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."lesson_videos" ADD CONSTRAINT "lesson_videos_provider_check" CHECK (provider = ANY (ARRAY['supabase'::text, 'cloudflare'::text, 'mux'::text, 'bunny'::text, 'vimeo'::text, 'youtube'::text, 'external'::text, 'other'::text]));
ALTER TABLE ONLY public."lesson_videos" ADD CONSTRAINT "lesson_videos_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'ready'::text, 'failed'::text, 'archived'::text]));
ALTER TABLE ONLY public."lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."lessons" ADD CONSTRAINT "lessons_legacy_id_key" UNIQUE (legacy_id);
ALTER TABLE ONLY public."lessons" ADD CONSTRAINT "lessons_lesson_number_check" CHECK (lesson_number > 0);
ALTER TABLE ONLY public."lessons" ADD CONSTRAINT "lessons_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."lessons" ADD CONSTRAINT "lessons_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]));
ALTER TABLE ONLY public."media" ADD CONSTRAINT "media_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."media" ADD CONSTRAINT "media_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."media" ADD CONSTRAINT "media_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."media" ADD CONSTRAINT "media_status_check" CHECK (status = ANY (ARRAY['active'::text, 'processing'::text, 'failed'::text, 'archived'::text]));
ALTER TABLE ONLY public."media" ADD CONSTRAINT "media_type_check" CHECK (type = ANY (ARRAY['video'::text, 'pdf'::text, 'document'::text, 'dataset'::text, 'image'::text, 'audio'::text, 'link'::text, 'other'::text]));
ALTER TABLE ONLY public."organisation_members" ADD CONSTRAINT "organisation_members_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."organisation_members" ADD CONSTRAINT "organisation_members_organisation_id_user_id_key" UNIQUE (organisation_id, user_id);
ALTER TABLE ONLY public."organisation_members" ADD CONSTRAINT "organisation_members_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."organisation_members" ADD CONSTRAINT "organisation_members_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'instructor'::text, 'learner'::text]));
ALTER TABLE ONLY public."organisation_members" ADD CONSTRAINT "organisation_members_status_check" CHECK (status = ANY (ARRAY['active'::text, 'invited'::text, 'suspended'::text]));
ALTER TABLE ONLY public."organisation_team_members" ADD CONSTRAINT "organisation_team_members_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."organisation_team_members" ADD CONSTRAINT "organisation_team_members_role_check" CHECK (role = ANY (ARRAY['member'::text, 'lead'::text, 'manager'::text]));
ALTER TABLE ONLY public."organisation_team_members" ADD CONSTRAINT "organisation_team_members_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."organisation_team_members" ADD CONSTRAINT "organisation_team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES organisation_teams(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."organisation_team_members" ADD CONSTRAINT "organisation_team_members_team_id_user_id_key" UNIQUE (team_id, user_id);
ALTER TABLE ONLY public."organisation_team_members" ADD CONSTRAINT "organisation_team_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."organisation_teams" ADD CONSTRAINT "organisation_teams_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."organisation_teams" ADD CONSTRAINT "organisation_teams_manager_user_id_fkey" FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."organisation_teams" ADD CONSTRAINT "organisation_teams_organisation_id_fkey" FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."organisation_teams" ADD CONSTRAINT "organisation_teams_organisation_id_slug_key" UNIQUE (organisation_id, slug);
ALTER TABLE ONLY public."organisation_teams" ADD CONSTRAINT "organisation_teams_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."organisation_teams" ADD CONSTRAINT "organisation_teams_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));
ALTER TABLE ONLY public."organisations" ADD CONSTRAINT "organisations_organisation_type_check" CHECK (organisation_type = ANY (ARRAY['academy'::text, 'corporate'::text, 'university'::text, 'school'::text, 'bootcamp'::text, 'nonprofit'::text, 'custom'::text, 'community'::text]));
ALTER TABLE ONLY public."organisations" ADD CONSTRAINT "organisations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."organisations" ADD CONSTRAINT "organisations_slug_key" UNIQUE (slug);
ALTER TABLE ONLY public."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_token_hash_key" UNIQUE (token_hash);
ALTER TABLE ONLY public."project_submissions" ADD CONSTRAINT "project_submissions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."project_submissions" ADD CONSTRAINT "project_submissions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."project_submissions" ADD CONSTRAINT "project_submissions_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'reviewed'::text, 'approved'::text, 'returned'::text]));
ALTER TABLE ONLY public."projects" ADD CONSTRAINT "projects_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."projects" ADD CONSTRAINT "projects_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."quiz_attempts" ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."quiz_questions" ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."quiz_questions" ADD CONSTRAINT "quiz_questions_question_type_check" CHECK (question_type = ANY (ARRAY['multiple_choice'::text, 'multiple_select'::text, 'true_false'::text, 'short_answer'::text]));
ALTER TABLE ONLY public."quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."quizzes" ADD CONSTRAINT "quizzes_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."quizzes" ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES learnora_lessons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."quizzes" ADD CONSTRAINT "quizzes_module_id_fkey" FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."quizzes" ADD CONSTRAINT "quizzes_passing_score_valid" CHECK (passing_score IS NOT NULL AND passing_score >= 70::numeric AND passing_score <= 100::numeric);
ALTER TABLE ONLY public."quizzes" ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."security_logs" ADD CONSTRAINT "security_logs_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."skill_evidence" ADD CONSTRAINT "skill_evidence_evidence_type_check" CHECK (evidence_type = ANY (ARRAY['quiz'::text, 'assessment'::text, 'assignment'::text, 'project'::text, 'simulation'::text, 'certificate'::text, 'manual'::text]));
ALTER TABLE ONLY public."skill_evidence" ADD CONSTRAINT "skill_evidence_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."skill_evidence" ADD CONSTRAINT "skill_evidence_skill_id_fkey" FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."skills" ADD CONSTRAINT "skills_name_key" UNIQUE (name);
ALTER TABLE ONLY public."skills" ADD CONSTRAINT "skills_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."team_course_assignments" ADD CONSTRAINT "team_course_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public."team_course_assignments" ADD CONSTRAINT "team_course_assignments_course_id_fkey" FOREIGN KEY (course_id) REFERENCES learnora_courses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."team_course_assignments" ADD CONSTRAINT "team_course_assignments_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."team_course_assignments" ADD CONSTRAINT "team_course_assignments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE ONLY public."team_course_assignments" ADD CONSTRAINT "team_course_assignments_team_id_course_id_key" UNIQUE (team_id, course_id);
ALTER TABLE ONLY public."team_course_assignments" ADD CONSTRAINT "team_course_assignments_team_id_fkey" FOREIGN KEY (team_id) REFERENCES organisation_teams(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."users" ADD CONSTRAINT "users_email_key" UNIQUE (email);
ALTER TABLE ONLY public."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);

-- Non-constraint indexes.
CREATE INDEX IF NOT EXISTS admins_active_idx ON public.admins USING btree (is_active);
CREATE INDEX IF NOT EXISTS admins_created_at_idx ON public.admins USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique_idx ON public.admins USING btree (lower(email));
CREATE INDEX IF NOT EXISTS admins_role_idx ON public.admins USING btree (role);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON public.ai_usage_logs USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON public.ai_usage_logs USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON public.ai_usage_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON public.assignment_submissions USING btree (assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user ON public.assignment_submissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs USING btree (action);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_email_idx ON public.audit_logs USING btree (email);
CREATE INDEX IF NOT EXISTS audit_logs_role_idx ON public.audit_logs USING btree (role);
CREATE INDEX IF NOT EXISTS idx_cohort_account_lesson_progress_account ON public.cohort_account_lesson_progress USING btree (cohort_account_id);
CREATE INDEX IF NOT EXISTS idx_cohort_account_lesson_progress_assignment ON public.cohort_account_lesson_progress USING btree (course_assignment_id);
CREATE INDEX IF NOT EXISTS idx_cohort_account_lesson_progress_cohort ON public.cohort_account_lesson_progress USING btree (cohort_id, completed);
CREATE INDEX IF NOT EXISTS idx_cohort_account_lesson_progress_lesson ON public.cohort_account_lesson_progress USING btree (lesson_id);
CREATE INDEX IF NOT EXISTS idx_cohort_account_lesson_progress_member ON public.cohort_account_lesson_progress USING btree (cohort_member_id, last_accessed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS cohort_accounts_active_username_uidx ON public.cohort_accounts USING btree (lower(username)) WHERE (status = ANY (ARRAY['pending_activation'::text, 'active'::text]));
CREATE INDEX IF NOT EXISTS cohort_accounts_cohort_status_idx ON public.cohort_accounts USING btree (cohort_id, status);
CREATE INDEX IF NOT EXISTS cohort_accounts_email_idx ON public.cohort_accounts USING btree (lower(email));
CREATE INDEX IF NOT EXISTS cohort_accounts_organisation_id_idx ON public.cohort_accounts USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS cohort_course_assignments_cohort_status_idx ON public.cohort_course_assignments USING btree (cohort_id, status);
CREATE INDEX IF NOT EXISTS idx_cohort_member_course_assignments_cohort_track ON public.cohort_member_course_assignments USING btree (cohort_id, track_id, status);
CREATE INDEX IF NOT EXISTS idx_cohort_member_course_assignments_course ON public.cohort_member_course_assignments USING btree (course_id, status);
CREATE INDEX IF NOT EXISTS idx_cohort_member_course_assignments_member_status ON public.cohort_member_course_assignments USING btree (cohort_member_id, status);
CREATE INDEX IF NOT EXISTS idx_cohort_member_lesson_assignments_lesson ON public.cohort_member_lesson_assignments USING btree (lesson_id, status);
CREATE INDEX IF NOT EXISTS cohort_members_cohort_account_id_idx ON public.cohort_members USING btree (cohort_account_id) WHERE (cohort_account_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS cohort_members_cohort_account_uidx ON public.cohort_members USING btree (cohort_id, cohort_account_id) WHERE (cohort_account_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS cohort_members_track_idx ON public.cohort_members USING btree (track_id) WHERE (track_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort ON public.cohort_members USING btree (cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user ON public.cohort_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS cohort_track_courses_assigned_by_idx ON public.cohort_track_courses USING btree (assigned_by) WHERE (assigned_by IS NOT NULL);
CREATE INDEX IF NOT EXISTS cohort_track_courses_course_id_idx ON public.cohort_track_courses USING btree (course_id);
CREATE INDEX IF NOT EXISTS cohort_track_courses_track_id_idx ON public.cohort_track_courses USING btree (track_id);
CREATE INDEX IF NOT EXISTS cohort_track_options_created_by_idx ON public.cohort_track_options USING btree (created_by) WHERE (created_by IS NOT NULL);
CREATE INDEX IF NOT EXISTS cohort_track_options_track_id_idx ON public.cohort_track_options USING btree (track_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_org ON public.cohorts USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_course_access_course ON public.course_access USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_course_access_org ON public.course_access USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.course_modules USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_courses_legacy_id ON public.courses USING btree (legacy_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses USING btree (status);
CREATE INDEX IF NOT EXISTS idx_courses_track ON public.courses USING btree (track);
CREATE INDEX IF NOT EXISTS idx_courses_witstart ON public.courses USING btree (witstart);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_email ON public.email_verification_tokens USING btree (email);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);
CREATE INDEX IF NOT EXISTS learner_lesson_notes_user_course_idx ON public.learner_lesson_notes USING btree (user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_access_entitlements_course ON public.learnora_access_entitlements USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_access_entitlements_org ON public.learnora_access_entitlements USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_access_entitlements_user ON public.learnora_access_entitlements USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_scope ON public.learnora_access_entitlements USING btree (user_id, organisation_id, course_id, status);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.learnora_activity_logs USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_activity_org ON public.learnora_activity_logs USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.learnora_activity_logs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_org_access_admin ON public.learnora_admin_organisation_access USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_org_access_org ON public.learnora_admin_organisation_access USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.learnora_ai_conversations USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_limits_scope ON public.learnora_ai_limits USING btree (scope_type, scope_id, feature);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.learnora_ai_messages USING btree (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_feature_window_idx ON public.learnora_ai_quota_reservations USING btree (limit_feature, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_org_window_idx ON public.learnora_ai_quota_reservations USING btree (organisation_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_scope_window_idx ON public.learnora_ai_quota_reservations USING btree (scope_type, scope_id, limit_feature, created_at);
CREATE INDEX IF NOT EXISTS learnora_ai_quota_user_window_idx ON public.learnora_ai_quota_reservations USING btree (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON public.learnora_api_keys USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON public.learnora_audit_events USING btree (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON public.learnora_audit_events USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON public.learnora_audit_events USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_capacity_org_type ON public.learnora_capacity_reservations USING btree (organisation_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_learnora_cohort_archive_org_archived ON public.learnora_cohort_archive USING btree (organisation_id, archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_lifecycle_events_cohort ON public.learnora_cohort_lifecycle_events USING btree (cohort_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learnora_cohort_member_archive_archive_id ON public.learnora_cohort_member_archive USING btree (cohort_archive_id);
CREATE INDEX IF NOT EXISTS idx_learnora_cohort_member_archive_source_user ON public.learnora_cohort_member_archive USING btree (source_user_id);
CREATE INDEX IF NOT EXISTS idx_learnora_cohort_member_archive_track ON public.learnora_cohort_member_archive USING btree (track_id);
CREATE INDEX IF NOT EXISTS idx_contract_entitlements_contract ON public.learnora_contract_entitlements USING btree (contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_status ON public.learnora_contracts USING btree (organisation_id, status);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course ON public.learnora_course_purchases USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_user ON public.learnora_course_purchases USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_courses_creator ON public.learnora_courses USING btree (creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_org ON public.learnora_courses USING btree (organisation_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_learnora_course_slug_global ON public.learnora_courses USING btree (slug) WHERE ((organisation_id IS NULL) AND (ownership = 'learnora'::text));
CREATE INDEX IF NOT EXISTS idx_creator_apps_status ON public.learnora_creator_applications USING btree (status);
CREATE INDEX IF NOT EXISTS idx_creator_ledger_creator ON public.learnora_creator_ledger USING btree (creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_sales_buyer ON public.learnora_creator_sales USING btree (buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_creator_sales_creator ON public.learnora_creator_sales USING btree (creator_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_creator_sales_provider_reference ON public.learnora_creator_sales USING btree (provider_reference) WHERE (provider_reference IS NOT NULL);
CREATE INDEX IF NOT EXISTS learnora_discussion_replies_discussion_created_idx ON public.learnora_discussion_replies USING btree (discussion_id, created_at);
CREATE INDEX IF NOT EXISTS learnora_discussions_course_created_idx ON public.learnora_discussions USING btree (course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learnora_discussions_org_created_idx ON public.learnora_discussions USING btree (organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrolments_course ON public.learnora_enrolments USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_org ON public.learnora_enrolments USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_user ON public.learnora_enrolments USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_path_courses_path ON public.learnora_learning_path_courses USING btree (path_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_org ON public.learnora_learning_paths USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.learnora_lesson_progress USING btree (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.learnora_lesson_progress USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.learnora_lessons USING btree (module_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.learnora_notifications USING btree (organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.learnora_notifications USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_lifecycle_status ON public.learnora_organisation_lifecycle USING btree (status);
CREATE INDEX IF NOT EXISTS idx_org_lifecycle_events_org ON public.learnora_organisation_lifecycle_events USING btree (organisation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_requests_email ON public.learnora_organisation_requests USING btree (email);
CREATE INDEX IF NOT EXISTS idx_org_requests_status ON public.learnora_organisation_requests USING btree (status);
CREATE INDEX IF NOT EXISTS learnora_organisation_requests_portal_user_idx ON public.learnora_organisation_requests USING btree (portal_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_role_permissions_role ON public.learnora_organisation_role_permissions USING btree (organisation_role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_admin ON public.learnora_platform_admins USING btree (admin_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON public.learnora_platform_admins USING btree (platform_role);
CREATE UNIQUE INDEX IF NOT EXISTS uq_learnora_platform_admin_role ON public.learnora_platform_admins USING btree (admin_id, platform_role);
CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_permission ON public.learnora_platform_role_permissions USING btree (permission_id);
CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_role ON public.learnora_platform_role_permissions USING btree (platform_role);
CREATE INDEX IF NOT EXISTS idx_programme_courses_programme ON public.learnora_programme_courses USING btree (programme_id);
CREATE INDEX IF NOT EXISTS idx_programmes_org ON public.learnora_programmes USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_status ON public.learnora_staff_accounts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_user ON public.learnora_staff_accounts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_role_assignments_role ON public.learnora_staff_role_assignments USING btree (role_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_role_assignments_staff ON public.learnora_staff_role_assignments USING btree (staff_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_members_staff ON public.learnora_staff_team_members USING btree (staff_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_members_team ON public.learnora_staff_team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_team_department ON public.learnora_staff_teams USING btree (department_id);
CREATE INDEX IF NOT EXISTS idx_learnora_staff_team_manager ON public.learnora_staff_teams USING btree (manager_staff_id);
CREATE INDEX IF NOT EXISTS idx_learnora_subscriptions_status ON public.learnora_subscriptions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_learnora_subscriptions_user ON public.learnora_subscriptions USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS learnora_tracks_scope_slug_uidx ON public.learnora_tracks USING btree (COALESCE(organisation_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson ON public.lesson_resources USING btree (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson ON public.lesson_videos USING btree (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON public.lessons USING btree (course_id, lesson_number);
CREATE INDEX IF NOT EXISTS idx_lessons_legacy_id ON public.lessons USING btree (legacy_id);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons USING btree (status);
CREATE INDEX IF NOT EXISTS idx_media_course_id ON public.media USING btree (course_id);
CREATE INDEX IF NOT EXISTS idx_media_lesson_id ON public.media USING btree (lesson_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media USING btree (type);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organisation_members USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organisation_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_org_team_members_team ON public.organisation_team_members USING btree (team_id);
CREATE INDEX IF NOT EXISTS idx_org_team_members_user ON public.organisation_team_members USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_org_teams_org ON public.organisation_teams USING btree (organisation_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_account_id ON public.password_reset_tokens USING btree (account_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON public.password_reset_tokens USING btree (email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_project_submissions_user ON public.project_submissions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts USING btree (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts USING btree (user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_quiz_passed_idx ON public.quiz_attempts USING btree (user_id, quiz_id, passed);
CREATE INDEX IF NOT EXISTS quizzes_module_published_idx ON public.quizzes USING btree (module_id, is_published);
CREATE INDEX IF NOT EXISTS security_logs_action_idx ON public.security_logs USING btree (action);
CREATE INDEX IF NOT EXISTS security_logs_created_at_idx ON public.security_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS security_logs_email_idx ON public.security_logs USING btree (email);
CREATE INDEX IF NOT EXISTS team_course_assignments_team_status_idx ON public.team_course_assignments USING btree (team_id, status);

-- Public functions (catalog definitions).
CREATE OR REPLACE FUNCTION public.archive_and_close_cohort(p_cohort_id uuid, p_actor_user_id uuid DEFAULT NULL::uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    cohort_row record;
    archive_row public.learnora_cohort_archive%rowtype;
    archived_members integer := 0;
    prior_archive_id uuid;
begin
    select c.id, c.organisation_id, c.name, c.status, c.programme_id,
           c.start_date, c.end_date, c.description, c.capacity,
           c.instructor_capacity, c.created_at, c.updated_at
      into cohort_row
      from public.cohorts c
     where c.id = p_cohort_id
     for update;
    if not found then
        raise exception 'Cohort not found';
    end if;

    select a.id into prior_archive_id
      from public.learnora_cohort_archive a
     where a.cohort_id = p_cohort_id;
    if found then
        return jsonb_build_object(
            'success', true,
            'already_archived', true,
            'archive_id', prior_archive_id,
            'cohort_id', p_cohort_id
        );
    end if;

    if cohort_row.status not in ('completed','expired','closed','archived') then
        raise exception 'Set the cohort to completed, expired, or closed before archiving';
    end if;

    insert into public.learnora_cohort_archive (
        cohort_id, organisation_id, cohort_name, status_before_archive,
        programme_id, start_date, end_date, cohort_snapshot,
        member_count, archived_by, archive_reason
    )
    select
        cohort_row.id, cohort_row.organisation_id, cohort_row.name, cohort_row.status,
        cohort_row.programme_id, cohort_row.start_date, cohort_row.end_date,
        jsonb_build_object(
            'description', cohort_row.description,
            'capacity', cohort_row.capacity,
            'instructor_capacity', cohort_row.instructor_capacity,
            'created_at', cohort_row.created_at,
            'updated_at', cohort_row.updated_at
        ),
        count(cm.id)::integer, p_actor_user_id, nullif(pg_catalog.btrim(p_reason), '')
      from public.cohort_members cm
     where cm.cohort_id = cohort_row.id
    returning * into archive_row;

    insert into public.learnora_cohort_member_archive (
        cohort_archive_id, source_cohort_member_id, source_user_id,
        source_cohort_account_id, display_name, email, track_id, track_name,
        membership_status, joined_at, course_history, lesson_progress, learner_notes
    )
    select
        archive_row.id,
        cm.id,
        cm.user_id,
        cm.cohort_account_id,
        coalesce(nullif(pg_catalog.btrim(concat_ws(' ', ca.first_name, ca.last_name)), ''),
                 nullif(pg_catalog.btrim(u.name), '')),
        coalesce(ca.email, u.email),
        cm.track_id,
        lt.name,
        cm.status,
        cm.joined_at,
        jsonb_build_object(
            'track_enabled_courses', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'course_slug', lc.slug,
                    'assignment_status', ctc.status,
                    'assigned_at', ctc.created_at
                ) order by lc.title)
                from public.cohort_track_courses ctc
                join public.learnora_courses lc on lc.id = ctc.course_id
                where ctc.cohort_id = cohort_row.id
                  and ctc.track_id = cm.track_id
            ), '[]'::jsonb),
            'cohort_course_assignments', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'status', cca.status,
                    'assigned_at', cca.assigned_at
                ) order by lc.title)
                from public.cohort_course_assignments cca
                join public.learnora_courses lc on lc.id = cca.course_id
                where cca.cohort_id = cohort_row.id
            ), '[]'::jsonb),
            'individual_course_assignments', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'assignment_id', cca.id,
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'track_id', cca.track_id,
                    'status', cca.status,
                    'tutor_user_id', cca.tutor_user_id,
                    'assigned_at', cca.assigned_at,
                    'lessons', coalesce((
                        select jsonb_agg(jsonb_build_object(
                            'lesson_id', ll.id,
                            'lesson_title', ll.title,
                            'status', cla.status,
                            'assigned_at', cla.assigned_at
                        ) order by ll.order_index)
                        from public.cohort_member_lesson_assignments cla
                        join public.learnora_lessons ll on ll.id = cla.lesson_id
                        where cla.course_assignment_id = cca.id
                    ), '[]'::jsonb)
                ) order by lc.title)
                from public.cohort_member_course_assignments cca
                join public.learnora_courses lc on lc.id = cca.course_id
                where cca.cohort_member_id = cm.id
            ), '[]'::jsonb),
            'legacy_enrolments', coalesce((
                select jsonb_agg(jsonb_build_object(
                    'enrolment_id', e.id,
                    'course_id', lc.id,
                    'course_title', lc.title,
                    'status', e.status,
                    'enrolled_at', e.enrolled_at,
                    'completed_at', e.completed_at,
                    'source_type', e.source_type
                ) order by lc.title)
                from public.learnora_enrolments e
                join public.learnora_courses lc on lc.id = e.course_id
                where e.cohort_id = cohort_row.id
                  and e.user_id = cm.user_id
            ), '[]'::jsonb)
        ),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'lesson_id', lp.lesson_id,
                'lesson_title', ll.title,
                'course_id', cmodule.course_id,
                'course_title', lc.title,
                'progress_percent', lp.progress_percent,
                'completed', lp.completed,
                'last_position_seconds', lp.last_position_seconds,
                'first_started_at', lp.first_started_at,
                'last_accessed_at', lp.last_accessed_at,
                'completed_at', lp.completed_at
            ) order by lp.last_accessed_at nulls last)
            from public.learnora_lesson_progress lp
            join public.learnora_lessons ll on ll.id = lp.lesson_id
            join public.course_modules cmodule on cmodule.id = ll.module_id
            left join public.learnora_courses lc on lc.id = cmodule.course_id
            where cm.user_id is not null
              and lp.user_id = cm.user_id
              and (
                  exists (select 1 from public.cohort_course_assignments cca
                           where cca.cohort_id = cohort_row.id and cca.course_id = cmodule.course_id)
                  or exists (select 1 from public.learnora_enrolments e
                              where e.cohort_id = cohort_row.id and e.user_id = cm.user_id
                                and e.course_id = cmodule.course_id)
                  or exists (select 1 from public.cohort_member_course_assignments cca
                              where cca.cohort_member_id = cm.id and cca.course_id = cmodule.course_id)
              )
        ), '[]'::jsonb)
        ||
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'lesson_id', cap.lesson_id,
                'progress_percent', cap.progress_percent,
                'completed', cap.completed,
                'last_position_seconds', cap.last_position_seconds,
                'first_started_at', cap.first_started_at,
                'last_accessed_at', cap.last_accessed_at,
                'completed_at', cap.completed_at
            ) order by cap.last_accessed_at nulls last)
            from public.cohort_account_lesson_progress cap
            where cap.cohort_member_id = cm.id
        ), '[]'::jsonb),
        coalesce((
            select jsonb_agg(jsonb_build_object(
                'course_id', n.course_id,
                'lesson_id', n.lesson_id,
                'content', n.content,
                'created_at', n.created_at,
                'updated_at', n.updated_at
            ) order by n.updated_at desc)
            from public.learner_lesson_notes n
            where cm.user_id is not null
              and n.user_id = cm.user_id
              and (
                  exists (select 1 from public.cohort_course_assignments cca
                           where cca.cohort_id = cohort_row.id and cca.course_id = n.course_id)
                  or exists (select 1 from public.learnora_enrolments e
                              where e.cohort_id = cohort_row.id and e.user_id = cm.user_id
                                and e.course_id = n.course_id)
                  or exists (select 1 from public.cohort_member_course_assignments cca
                              where cca.cohort_member_id = cm.id and cca.course_id = n.course_id)
              )
        ), '[]'::jsonb)
    from public.cohort_members cm
    left join public.cohort_accounts ca on ca.id = cm.cohort_account_id
    left join public.users u on u.id = cm.user_id
    left join public.learnora_tracks lt on lt.id = cm.track_id
    where cm.cohort_id = cohort_row.id
    on conflict (cohort_archive_id, source_cohort_member_id) do nothing;

    get diagnostics archived_members = row_count;

    -- Retire legacy course enrolments for this cohort without deleting history.
    update public.learnora_enrolments e
       set status = 'inactive'
     where e.cohort_id = cohort_row.id
       and e.status = 'active';

    -- Disable cohort accounts and remove credentials so usernames can be reused.
    update public.cohort_accounts ca
       set status = 'inactive',
           username = 'archived-' || replace(ca.id::text, '-', ''),
           password_hash = null,
           activation_token_hash = null,
           activation_expires_at = null,
           updated_at = pg_catalog.now()
     where ca.cohort_id = cohort_row.id;

    -- Legacy users are shared identities. Deactivate only if no other active cohort
    -- still depends on that identity; do not disable the whole organisation.
    update public.users u
       set sub_status = 'inactive'
     where exists (
         select 1 from public.learnora_cohort_member_archive ma
          where ma.cohort_archive_id = archive_row.id
            and ma.source_user_id = u.id
     )
       and not exists (
         select 1 from public.cohort_members cm2
         join public.cohorts c2 on c2.id = cm2.cohort_id
          where cm2.user_id = u.id
            and cm2.status = 'active'
            and cm2.cohort_id <> cohort_row.id
            and c2.status in ('draft','upcoming','active','ending')
       );

    -- Remove live cohort membership after the durable archive has been written.
    -- Cascading course/lesson assignments and cohort-account progress are now safe.
    delete from public.cohort_members cm
     where cm.cohort_id = cohort_row.id;

    update public.cohorts c
       set status = 'archived',
           updated_at = pg_catalog.now()
     where c.id = cohort_row.id;

    insert into public.learnora_cohort_lifecycle (
        cohort_id, status, previous_cohort_id, next_cohort_id, changed_at, changed_by
    )
    values (
        cohort_row.id, 'closed', null, null, pg_catalog.now(), p_actor_user_id
    )
    on conflict (cohort_id) do update
       set status = 'closed',
           changed_at = excluded.changed_at,
           changed_by = excluded.changed_by;

    insert into public.learnora_cohort_lifecycle_events (
        cohort_id, from_status, to_status, reason, actor_user_id, created_at
    )
    values (
        cohort_row.id, cohort_row.status, 'closed',
        nullif(pg_catalog.btrim(p_reason), ''), p_actor_user_id, pg_catalog.now()
    );

    return jsonb_build_object(
        'success', true,
        'already_archived', false,
        'archive_id', archive_row.id,
        'cohort_id', cohort_row.id,
        'archived_members', archived_members,
        'cohort_status', 'archived',
        'organisation_unchanged', true
    );
end;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_cohort_member_track_immutability()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
    if old.track_id is not null and new.track_id is distinct from old.track_id then
        raise exception 'A learner track cannot be changed after assignment within a cohort'
            using errcode = '23514';
    end if;
    if new.cohort_account_id is not null and new.track_id is null then
        raise exception 'Cohort accounts must have a track assignment'
            using errcode = '23514';
    end if;
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.learnora_enforce_org_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
    v_is_active boolean;
    v_course_id uuid;
    v_course_owner text;
    v_course_org uuid;
    v_resource_status text;
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
        -- Capacity remains an invariant even when a cohort is being closed.
        IF TG_OP = 'UPDATE' AND NEW.capacity IS NOT NULL THEN
            SELECT count(*) INTO v_used FROM public.cohort_members WHERE cohort_id = NEW.id AND status = 'active';
            IF v_used > NEW.capacity THEN
                RAISE EXCEPTION 'Cohort capacity cannot be lower than its active membership (capacity %, active members %)', NEW.capacity, v_used
                    USING ERRCODE = '23514';
            END IF;
        END IF;
        IF NEW.status NOT IN ('draft','upcoming','active','ending') THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status IN ('draft','upcoming','active','ending') AND OLD.organisation_id = NEW.organisation_id THEN
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
        v_org := NEW.organisation_id; v_key := 'courses'; v_course_id := NEW.course_id;
    ELSIF TG_TABLE_NAME = 'team_course_assignments' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.team_id = NEW.team_id AND OLD.course_id = NEW.course_id THEN RETURN NEW; END IF;
        SELECT organisation_id, status INTO v_org, v_resource_status
        FROM public.organisation_teams WHERE id = NEW.team_id;
        IF NOT FOUND OR v_resource_status <> 'active' THEN
            RAISE EXCEPTION 'Active team course assignments require an active team' USING ERRCODE = '23514';
        END IF;
        SELECT ownership, organisation_id INTO v_course_owner, v_course_org
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503'; END IF;
        IF v_course_owner = 'organisation' AND v_course_org = v_org THEN RETURN NEW; END IF;
        v_key := 'courses'; v_course_id := NEW.course_id;
    ELSIF TG_TABLE_NAME = 'cohort_course_assignments' THEN
        IF NEW.status <> 'active' THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.status = 'active' AND OLD.cohort_id = NEW.cohort_id AND OLD.course_id = NEW.course_id THEN RETURN NEW; END IF;
        SELECT organisation_id, status INTO v_org, v_resource_status
        FROM public.cohorts WHERE id = NEW.cohort_id;
        IF NOT FOUND OR v_resource_status NOT IN ('draft','upcoming','active') THEN
            RAISE EXCEPTION 'Active cohort course assignments require an open cohort' USING ERRCODE = '23514';
        END IF;
        SELECT ownership, organisation_id INTO v_course_owner, v_course_org
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503'; END IF;
        IF v_course_owner = 'organisation' AND v_course_org = v_org THEN RETURN NEW; END IF;
        v_key := 'courses'; v_course_id := NEW.course_id;
    ELSIF TG_TABLE_NAME = 'learnora_courses' THEN
        IF NEW.ownership <> 'organisation' OR NEW.status = 'archived' OR NEW.organisation_id IS NULL THEN RETURN NEW; END IF;
        IF TG_OP = 'UPDATE' AND OLD.ownership = 'organisation' AND OLD.status <> 'archived'
           AND OLD.organisation_id = NEW.organisation_id THEN RETURN NEW; END IF;
        v_org := NEW.organisation_id; v_key := 'courses'; v_course_id := NEW.id;
    ELSE
        RETURN NEW;
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended('orgcap:' || v_org::text || ':' || v_key, 0));

    SELECT settings, is_active INTO v_settings, v_is_active
    FROM public.organisations WHERE id = v_org;
    IF NOT FOUND OR COALESCE(v_is_active, false) = false THEN
        RAISE EXCEPTION 'Organisation workspace is inactive or unavailable'
            USING ERRCODE = '23514';
    END IF;
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
              AND id <> v_course_id
            UNION
            SELECT course_id FROM public.course_access
            WHERE organisation_id = v_org AND status = 'active'
              AND course_id <> v_course_id
            UNION
            SELECT a.course_id
            FROM public.team_course_assignments a
            JOIN public.organisation_teams t ON t.id = a.team_id
            WHERE t.organisation_id = v_org AND t.status = 'active'
              AND a.status = 'active' AND a.course_id <> v_course_id
            UNION
            SELECT a.course_id
            FROM public.cohort_course_assignments a
            JOIN public.cohorts c ON c.id = a.cohort_id
            WHERE c.organisation_id = v_org AND c.status IN ('draft','upcoming','active','ending')
              AND a.status = 'active' AND a.course_id <> v_course_id
        ) scoped_courses;
    END IF;

    IF v_used + 1 > v_limit THEN
        RAISE EXCEPTION 'Organisation % capacity exceeded (limit %, current %)', v_key, v_limit, v_used
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.learnora_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.learnora_sync_org_membership_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.learnora_validate_org_relationships()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_org uuid;
    v_course_owner text;
    v_course_org uuid;
    v_member_role text;
    v_member_status text;
    v_resource_status text;
    v_workspace_active boolean;
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
            SELECT is_active INTO v_workspace_active FROM public.organisations WHERE id = v_org;
            IF NOT COALESCE(v_workspace_active, false) THEN
                RAISE EXCEPTION 'Inactive organisations cannot accept active team members' USING ERRCODE = '23514';
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
            SELECT organisation_id, status INTO v_org, v_resource_status FROM public.cohorts WHERE id = NEW.cohort_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Cohort does not exist' USING ERRCODE = '23503';
            END IF;
            IF v_resource_status NOT IN ('draft','upcoming','active') THEN
                RAISE EXCEPTION 'Closed cohorts cannot accept active members' USING ERRCODE = '23514';
            END IF;
            SELECT is_active INTO v_workspace_active FROM public.organisations WHERE id = v_org;
            IF NOT COALESCE(v_workspace_active, false) THEN
                RAISE EXCEPTION 'Inactive organisations cannot accept active cohort members' USING ERRCODE = '23514';
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
        SELECT organisation_id, status INTO v_org, v_resource_status FROM public.cohorts WHERE id = NEW.cohort_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cohort does not exist' USING ERRCODE = '23503';
        END IF;
        IF NEW.status = 'active' AND v_resource_status NOT IN ('draft','upcoming','active') THEN
            RAISE EXCEPTION 'Closed cohorts cannot receive active course assignments' USING ERRCODE = '23514';
        END IF;
        SELECT is_active INTO v_workspace_active FROM public.organisations WHERE id = v_org;
        IF NEW.status = 'active' AND NOT COALESCE(v_workspace_active, false) THEN
            RAISE EXCEPTION 'Inactive organisations cannot receive active cohort course assignments' USING ERRCODE = '23514';
        END IF;
        SELECT ownership, organisation_id, status INTO v_course_owner, v_course_org, v_resource_status
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503';
        END IF;
        IF NEW.status = 'active' AND v_resource_status <> 'published' THEN
            RAISE EXCEPTION 'Only published courses can be actively assigned' USING ERRCODE = '23514';
        END IF;
        IF v_course_owner = 'organisation' AND v_course_org <> v_org THEN
            RAISE EXCEPTION 'Organisation-owned course cannot be assigned across organisations'
                USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'team_course_assignments' THEN
        SELECT organisation_id, status INTO v_org, v_resource_status FROM public.organisation_teams WHERE id = NEW.team_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Team does not exist' USING ERRCODE = '23503';
        END IF;
        IF NEW.status = 'active' AND v_resource_status <> 'active' THEN
            RAISE EXCEPTION 'Inactive teams cannot receive active course assignments' USING ERRCODE = '23514';
        END IF;
        SELECT is_active INTO v_workspace_active FROM public.organisations WHERE id = v_org;
        IF NEW.status = 'active' AND NOT COALESCE(v_workspace_active, false) THEN
            RAISE EXCEPTION 'Inactive organisations cannot receive active team course assignments' USING ERRCODE = '23514';
        END IF;
        SELECT ownership, organisation_id, status INTO v_course_owner, v_course_org, v_resource_status
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503';
        END IF;
        IF NEW.status = 'active' AND v_resource_status <> 'published' THEN
            RAISE EXCEPTION 'Only published courses can be actively assigned' USING ERRCODE = '23514';
        END IF;
        IF v_course_owner = 'organisation' AND v_course_org <> v_org THEN
            RAISE EXCEPTION 'Organisation-owned course cannot be assigned across organisations'
                USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'course_access' THEN
        SELECT ownership, organisation_id, status INTO v_course_owner, v_course_org, v_resource_status
        FROM public.learnora_courses WHERE id = NEW.course_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course does not exist' USING ERRCODE = '23503';
        END IF;
        IF NEW.status = 'active' AND v_resource_status <> 'published' THEN
            RAISE EXCEPTION 'Only published courses can be actively assigned' USING ERRCODE = '23514';
        END IF;
        IF NEW.status = 'active' THEN
            SELECT is_active INTO v_workspace_active FROM public.organisations WHERE id = NEW.organisation_id;
            IF NOT COALESCE(v_workspace_active, false) THEN
                RAISE EXCEPTION 'Inactive organisations cannot receive active course access' USING ERRCODE = '23514';
            END IF;
        END IF;
        IF v_course_owner = 'organisation' AND v_course_org <> NEW.organisation_id THEN
            RAISE EXCEPTION 'Organisation-owned course access must stay within its owning organisation'
                USING ERRCODE = '23514';
        END IF;
    ELSIF TG_TABLE_NAME = 'learnora_enrolments' THEN
        IF NEW.status = 'active' AND NEW.organisation_id IS NOT NULL THEN
            SELECT is_active INTO v_workspace_active FROM public.organisations WHERE id = NEW.organisation_id;
            IF NOT COALESCE(v_workspace_active, false) THEN
                RAISE EXCEPTION 'Inactive organisations cannot receive active course enrolments' USING ERRCODE = '23514';
            END IF;
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
$function$;
CREATE OR REPLACE FUNCTION public.reserve_learnora_ai_quota(p_user_id uuid, p_organisation_id uuid, p_feature text, p_scope_type text, p_scope_id text, p_limit_feature text, p_requests_per_day integer, p_requests_per_month integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
$function$;
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
CREATE OR REPLACE FUNCTION public.update_admins_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_account_lesson_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    member_row record;
    account_status text;
    assignment_row record;
begin
    select cm.id, cm.cohort_id, cm.cohort_account_id, cm.status into member_row
      from public.cohort_members cm where cm.id = new.cohort_member_id;
    if not found then raise exception 'Cohort membership not found'; end if;
    if member_row.cohort_id <> new.cohort_id or member_row.cohort_account_id <> new.cohort_account_id then
        raise exception 'Progress identity does not match cohort membership';
    end if;
    if member_row.status <> 'active' then raise exception 'Only active cohort members can update progress'; end if;
    select ca.status into account_status from public.cohort_accounts ca
      where ca.id = new.cohort_account_id and ca.cohort_id = new.cohort_id;
    if not found or account_status <> 'active' then raise exception 'Cohort account is not active'; end if;
    select cca.id, cca.status, cca.cohort_member_id, cca.cohort_id into assignment_row
      from public.cohort_member_course_assignments cca where cca.id = new.course_assignment_id;
    if not found or assignment_row.status <> 'active' or assignment_row.cohort_member_id <> new.cohort_member_id
       or assignment_row.cohort_id <> new.cohort_id then
        raise exception 'Progress requires an active course assigned to this learner';
    end if;
    if not exists (
        select 1 from public.cohort_member_lesson_assignments cla
         where cla.course_assignment_id = new.course_assignment_id
           and cla.lesson_id = new.lesson_id and cla.status = 'active'
    ) then raise exception 'Progress lesson is not assigned to this learner'; end if;
    if new.progress_percent = 100 then new.completed := true; end if;
    if new.completed and new.completed_at is null then
        new.completed_at := pg_catalog.now(); new.progress_percent := 100;
    end if;
    if new.first_started_at is null then new.first_started_at := pg_catalog.now(); end if;
    new.last_accessed_at := pg_catalog.now();
    new.updated_at := pg_catalog.now();
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_account_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
    cohort_org uuid;
    cohort_status text;
    org_active boolean;
begin
    if tg_op = 'UPDATE' and
       (new.cohort_id is distinct from old.cohort_id or
        new.organisation_id is distinct from old.organisation_id) then
        raise exception 'A cohort account cannot be moved to another cohort or organisation'
            using errcode = '23514';
    end if;

    select c.organisation_id, c.status
      into cohort_org, cohort_status
      from public.cohorts c
     where c.id = new.cohort_id;
    if cohort_org is null then
        raise exception 'Cohort does not exist' using errcode = '23503';
    end if;
    if cohort_org <> new.organisation_id then
        raise exception 'Cohort account organisation must match the cohort organisation'
            using errcode = '23514';
    end if;

    if new.status in ('pending_activation','active') and cohort_status not in ('draft','upcoming','active') then
        raise exception 'Closed cohorts cannot create or activate learner accounts'
            using errcode = '23514';
    end if;

    select o.is_active into org_active
      from public.organisations o
     where o.id = new.organisation_id;
    if new.status in ('pending_activation','active') and coalesce(org_active, false) = false then
        raise exception 'Inactive organisations cannot create or activate cohort accounts'
            using errcode = '23514';
    end if;
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_member_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
    account_cohort uuid;
    account_org uuid;
    cohort_org uuid;
    option_is_active boolean;
begin
    if new.cohort_account_id is null then
        return new;
    end if;

    select ca.cohort_id, ca.organisation_id
      into account_cohort, account_org
      from public.cohort_accounts ca
     where ca.id = new.cohort_account_id;

    if account_cohort is null then
        raise exception 'Cohort account does not exist';
    end if;
    if account_cohort <> new.cohort_id then
        raise exception 'Cohort account and membership must belong to the same cohort';
    end if;

    select c.organisation_id into cohort_org
      from public.cohorts c where c.id = new.cohort_id;
    if cohort_org is null or cohort_org <> account_org then
        raise exception 'Cohort account and cohort must belong to the same organisation';
    end if;

    select (cto.status = 'active') into option_is_active
      from public.cohort_track_options cto
     where cto.cohort_id = new.cohort_id
       and cto.track_id = new.track_id;

    if option_is_active is distinct from true then
        raise exception 'Learner track must be enabled for the cohort';
    end if;
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_member_course_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    member_row record;
    course_row record;
    cohort_row record;
begin
    select cm.id, cm.cohort_id, cm.track_id, cm.status as member_status
      into member_row
      from public.cohort_members cm
     where cm.id = new.cohort_member_id;
    if not found then
        raise exception 'Cohort membership not found';
    end if;
    if member_row.cohort_id <> new.cohort_id then
        raise exception 'Course assignment cohort does not match learner membership';
    end if;
    if member_row.track_id is null or member_row.track_id <> new.track_id then
        raise exception 'Course assignment must use the learner fixed track';
    end if;

    select c.id, c.organisation_id, c.status
      into cohort_row
      from public.cohorts c
     where c.id = new.cohort_id;
    if not found then
        raise exception 'Cohort not found';
    end if;

    select lc.id, lc.organisation_id, lc.ownership, lc.status
      into course_row
      from public.learnora_courses lc
     where lc.id = new.course_id;
    if not found then
        raise exception 'Course not found';
    end if;

    if course_row.ownership = 'organisation'
       and course_row.organisation_id <> cohort_row.organisation_id then
        raise exception 'Course belongs to another organisation';
    end if;

    if new.status = 'active' then
        if member_row.member_status <> 'active' then
            raise exception 'Only active cohort learners can receive course assignments';
        end if;
        if cohort_row.status not in ('draft','upcoming','active') then
            raise exception 'Cohort is closed to course assignment';
        end if;
        if course_row.status <> 'published' then
            raise exception 'Only published courses can be assigned';
        end if;
        if not exists (
            select 1 from public.cohort_track_options cto
             where cto.cohort_id = new.cohort_id
               and cto.track_id = new.track_id
               and cto.status = 'active'
        ) then
            raise exception 'Track is not enabled for this cohort';
        end if;
        if not exists (
            select 1 from public.cohort_track_courses ctc
             where ctc.cohort_id = new.cohort_id
               and ctc.track_id = new.track_id
               and ctc.course_id = new.course_id
               and ctc.status = 'active'
        ) then
            raise exception 'Course is not enabled for this track and cohort';
        end if;
        if new.tutor_user_id is not null and not exists (
            select 1
              from public.organisation_members om
             where om.organisation_id = cohort_row.organisation_id
               and om.user_id = new.tutor_user_id
               and om.status = 'active'
        ) then
            raise exception 'Assigned tutor must be an active member of the same organisation';
        end if;
    end if;

    new.updated_at := pg_catalog.now();
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_member_identity_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
    cohort_org uuid;
    cohort_status text;
    org_active boolean;
    account_cohort uuid;
    account_org uuid;
    account_status text;
    member_role text;
    member_status text;
    track_enabled boolean;
begin
    if new.status <> 'active' then
        return new;
    end if;

    select c.organisation_id, c.status
      into cohort_org, cohort_status
      from public.cohorts c
     where c.id = new.cohort_id;
    if cohort_org is null then
        raise exception 'Cohort does not exist' using errcode = '23503';
    end if;
    if cohort_status not in ('draft','upcoming','active') then
        raise exception 'Closed cohorts cannot accept active members' using errcode = '23514';
    end if;

    select o.is_active into org_active
      from public.organisations o
     where o.id = cohort_org;
    if coalesce(org_active, false) = false then
        raise exception 'Inactive organisations cannot accept active cohort members' using errcode = '23514';
    end if;

    if new.cohort_account_id is not null then
        select ca.cohort_id, ca.organisation_id, ca.status
          into account_cohort, account_org, account_status
          from public.cohort_accounts ca
         where ca.id = new.cohort_account_id;
        if account_cohort is null then
            raise exception 'Cohort account does not exist' using errcode = '23503';
        end if;
        if account_cohort <> new.cohort_id or account_org <> cohort_org then
            raise exception 'Cohort account must belong to the same cohort and organisation' using errcode = '23514';
        end if;
        if account_status = 'inactive' then
            raise exception 'Inactive cohort accounts cannot have active memberships' using errcode = '23514';
        end if;
        select (cto.status = 'active') into track_enabled
          from public.cohort_track_options cto
         where cto.cohort_id = new.cohort_id
           and cto.track_id = new.track_id;
        if track_enabled is distinct from true then
            raise exception 'Learner track must be enabled for the cohort' using errcode = '23514';
        end if;
    else
        select om.role, om.status
          into member_role, member_status
          from public.organisation_members om
         where om.organisation_id = cohort_org
           and om.user_id = new.user_id
         limit 1;
        if not found or member_status <> 'active' or member_role <> 'learner' then
            raise exception 'Legacy cohort members must be active learners in the same organisation' using errcode = '23514';
        end if;
    end if;
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_member_lesson_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    assignment_row record;
    lesson_course_id uuid;
    lesson_status text;
begin
    select cca.course_id, cca.status
      into assignment_row
      from public.cohort_member_course_assignments cca
     where cca.id = new.course_assignment_id;
    if not found then
        raise exception 'Course assignment not found';
    end if;

    if new.status = 'active' then
        if assignment_row.status <> 'active' then
            raise exception 'Lesson assignment requires an active course assignment';
        end if;
        select cm.course_id, ll.status
          into lesson_course_id, lesson_status
          from public.learnora_lessons ll
          join public.course_modules cm on cm.id = ll.module_id
         where ll.id = new.lesson_id;
        if not found then
            raise exception 'Lesson not found';
        end if;
        if lesson_course_id <> assignment_row.course_id then
            raise exception 'Lesson must belong to the assigned course';
        end if;
        if lesson_status <> 'published' then
            raise exception 'Only published lessons can be assigned';
        end if;
    end if;
    new.updated_at := pg_catalog.now();
    return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_cohort_track_option_scope()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
    cohort_org uuid;
    track_org uuid;
begin
    select c.organisation_id into cohort_org
    from public.cohorts c where c.id = new.cohort_id;

    select t.organisation_id into track_org
    from public.learnora_tracks t where t.id = new.track_id and t.status = 'active';

    if cohort_org is null then
        raise exception 'Cohort does not exist';
    end if;
    if not found and track_org is null then
        raise exception 'Track does not exist or is inactive';
    end if;
    if track_org is not null and track_org <> cohort_org then
        raise exception 'Track belongs to a different organisation';
    end if;
    return new;
end;
$function$;

-- Row-level security flags from the live catalog.
ALTER TABLE public."admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ai_usage_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."assignment_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_account_lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_course_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_member_course_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_member_lesson_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_track_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohort_track_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cohorts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."course_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."course_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."email_verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learner_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learner_lesson_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learner_onboarding_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learner_skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learning_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_access_entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_activity_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_admin_organisation_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_ai_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_ai_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_ai_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_ai_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_ai_providers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_ai_quota_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_capacity_reservations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_cohort_archive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_cohort_lifecycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_cohort_lifecycle_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_cohort_member_archive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_contract_clauses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_contract_entitlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_contract_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_contract_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_course_purchases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_creator_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_creator_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_creator_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_creator_payouts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_creator_sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_discussion_replies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_discussions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_enrolments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_feature_flags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_learning_path_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_learning_paths" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_organisation_lifecycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_organisation_lifecycle_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_organisation_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_organisation_role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_platform_admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_platform_role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_platform_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_programme_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_programmes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_staff_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_staff_role_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_staff_role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_staff_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_staff_team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_staff_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."learnora_tracks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lesson_resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lesson_videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organisation_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organisation_team_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organisation_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organisations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."password_reset_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quiz_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quiz_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."security_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."skill_evidence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."skills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."team_course_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;

-- Triggers.
CREATE TRIGGER admins_updated_at_trigger BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_admins_updated_at();
CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER trg_validate_cohort_account_lesson_progress BEFORE INSERT OR UPDATE OF cohort_account_id, cohort_member_id, cohort_id, course_assignment_id, lesson_id, progress_percent, completed, last_position_seconds ON cohort_account_lesson_progress FOR EACH ROW EXECUTE FUNCTION validate_cohort_account_lesson_progress();
CREATE TRIGGER trg_validate_cohort_account_scope BEFORE INSERT OR UPDATE OF cohort_id, organisation_id, status ON cohort_accounts FOR EACH ROW EXECUTE FUNCTION validate_cohort_account_scope();
CREATE TRIGGER learnora_cohort_course_capacity BEFORE INSERT OR UPDATE ON cohort_course_assignments FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_validate_cohort_course_tenant BEFORE INSERT OR UPDATE ON cohort_course_assignments FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();
CREATE TRIGGER trg_validate_cohort_member_course_assignment BEFORE INSERT OR UPDATE OF cohort_member_id, cohort_id, track_id, course_id, tutor_user_id, status ON cohort_member_course_assignments FOR EACH ROW EXECUTE FUNCTION validate_cohort_member_course_assignment();
CREATE TRIGGER trg_validate_cohort_member_lesson_assignment BEFORE INSERT OR UPDATE OF course_assignment_id, lesson_id, status ON cohort_member_lesson_assignments FOR EACH ROW EXECUTE FUNCTION validate_cohort_member_lesson_assignment();
CREATE TRIGGER learnora_cohort_member_capacity BEFORE INSERT OR UPDATE ON cohort_members FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_validate_cohort_member_tenant BEFORE INSERT OR UPDATE ON cohort_members FOR EACH ROW EXECUTE FUNCTION validate_cohort_member_identity_scope();
CREATE TRIGGER trg_cohort_member_track_immutable BEFORE UPDATE OF track_id, cohort_account_id ON cohort_members FOR EACH ROW EXECUTE FUNCTION enforce_cohort_member_track_immutability();
CREATE TRIGGER trg_validate_cohort_member_assignment BEFORE INSERT OR UPDATE OF cohort_id, cohort_account_id, track_id ON cohort_members FOR EACH ROW EXECUTE FUNCTION validate_cohort_member_assignment();
CREATE TRIGGER trg_validate_cohort_track_option_scope BEFORE INSERT OR UPDATE OF cohort_id, track_id ON cohort_track_options FOR EACH ROW EXECUTE FUNCTION validate_cohort_track_option_scope();
CREATE TRIGGER learnora_cohort_capacity BEFORE INSERT OR UPDATE ON cohorts FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_validate_cohort_programme_tenant BEFORE INSERT OR UPDATE OF organisation_id, programme_id ON cohorts FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();
CREATE TRIGGER trg_cohorts_updated_at BEFORE UPDATE ON cohorts FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER learnora_course_access_capacity BEFORE INSERT OR UPDATE ON course_access FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_validate_course_access_tenant BEFORE INSERT OR UPDATE ON course_access FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();
CREATE TRIGGER trg_modules_updated_at BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_admin_org_access_updated_at BEFORE UPDATE ON learnora_admin_organisation_access FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER learnora_owned_course_capacity BEFORE INSERT OR UPDATE ON learnora_courses FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON learnora_courses FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER trg_learnora_departments_updated_at BEFORE UPDATE ON learnora_departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER learnora_validate_enrolment_tenant BEFORE INSERT OR UPDATE ON learnora_enrolments FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();
CREATE TRIGGER trg_lessons_updated_at BEFORE UPDATE ON learnora_lessons FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER trg_platform_admins_updated_at BEFORE UPDATE ON learnora_platform_admins FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER learnora_programme_capacity BEFORE INSERT OR UPDATE ON learnora_programmes FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER trg_learnora_staff_updated_at BEFORE UPDATE ON learnora_staff_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_learnora_staff_roles_updated_at BEFORE UPDATE ON learnora_staff_roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_learnora_staff_teams_updated_at BEFORE UPDATE ON learnora_staff_teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_videos_updated_at BEFORE UPDATE ON lesson_videos FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER media_set_updated_at BEFORE UPDATE ON media FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER learnora_org_member_capacity BEFORE INSERT OR UPDATE ON organisation_members FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_sync_org_membership_status AFTER UPDATE OF status, organisation_id, role ON organisation_members FOR EACH ROW EXECUTE FUNCTION learnora_sync_org_membership_status();
CREATE TRIGGER learnora_validate_team_member_tenant BEFORE INSERT OR UPDATE ON organisation_team_members FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();
CREATE TRIGGER learnora_team_capacity BEFORE INSERT OR UPDATE ON organisation_teams FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_validate_team_manager BEFORE INSERT OR UPDATE OF organisation_id, manager_user_id ON organisation_teams FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();
CREATE TRIGGER trg_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION learnora_set_updated_at();
CREATE TRIGGER learnora_team_course_capacity BEFORE INSERT OR UPDATE ON team_course_assignments FOR EACH ROW EXECUTE FUNCTION learnora_enforce_org_capacity();
CREATE TRIGGER learnora_validate_team_course_tenant BEFORE INSERT OR UPDATE ON team_course_assignments FOR EACH ROW EXECUTE FUNCTION learnora_validate_org_relationships();

-- Views.
CREATE VIEW public."course_content_health" AS
 SELECT c.id,
    c.legacy_id,
    c.title,
    c.track,
    c.level,
    c.witstart,
    c.expected_lesson_count,
    COALESCE(l.actual_lesson_count, 0) AS actual_lesson_count,
    COALESCE(l.content_count, 0) AS content_count,
    COALESCE(l.published_lesson_count, 0) AS published_lesson_count,
    COALESCE(m.video_count, 0) AS video_count,
    COALESCE(m.resource_count, 0) AS resource_count
   FROM courses c
     LEFT JOIN ( SELECT lessons.course_id,
            count(*)::integer AS actual_lesson_count,
            count(*) FILTER (WHERE lessons.content_markdown IS NOT NULL AND length(TRIM(BOTH FROM lessons.content_markdown)) > 0)::integer AS content_count,
            count(*) FILTER (WHERE lessons.is_published = true)::integer AS published_lesson_count
           FROM lessons
          GROUP BY lessons.course_id) l ON l.course_id = c.id
     LEFT JOIN ( SELECT media.course_id,
            count(*) FILTER (WHERE media.type = 'video'::text AND media.status = 'active'::text)::integer AS video_count,
            count(*) FILTER (WHERE media.type <> 'video'::text AND media.status = 'active'::text)::integer AS resource_count
           FROM media
          GROUP BY media.course_id) m ON m.course_id = c.id;;

-- Isolated integration-test grants; not a copy of production role grants.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
COMMIT;
