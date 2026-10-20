-- Remove latent browser-role grants from organisation authorization,
-- contract, audit and AI-service tables that are accessed through FastAPI.
-- RLS remains enabled; no browser-facing policies are introduced.
-- Shared learner/course/progression grants restored by migration 024 are
-- intentionally excluded from this list.
REVOKE ALL PRIVILEGES ON TABLE
    public.learnora_admin_organisation_access,
    public.learnora_organisation_role_permissions,
    public.learnora_permissions,
    public.learnora_organisation_lifecycle,
    public.learnora_organisation_lifecycle_events,
    public.learnora_organisation_requests,
    public.learnora_contract_templates,
    public.learnora_contract_clauses,
    public.learnora_contract_versions,
    public.learnora_audit_events,
    public.learnora_activity_logs,
    public.learnora_ai_profiles,
    public.learnora_ai_providers,
    public.learnora_ai_conversations,
    public.learnora_ai_messages,
    public.learnora_api_keys,
    public.learnora_feature_flags,
    public.learnora_subscriptions
FROM PUBLIC, anon, authenticated;
