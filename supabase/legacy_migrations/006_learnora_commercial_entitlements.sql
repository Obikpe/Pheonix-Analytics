begin;

create table if not exists public.learnora_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete restrict,
 status text not null default 'trialing' check(status in ('trialing','active','past_due','paused','cancelled','expired')),
 plan_code text,
 billing_interval text check(billing_interval in ('monthly','yearly','one_time')),
 currency text,
 amount_minor bigint,
 provider text,
 provider_customer_id text,
 provider_subscription_id text,
 starts_at timestamptz,
 current_period_start timestamptz,
 current_period_end timestamptz,
 cancelled_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_learnora_subscriptions_user on public.learnora_subscriptions(user_id);
create index if not exists idx_learnora_subscriptions_status on public.learnora_subscriptions(status);

create table if not exists public.learnora_course_purchases (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete restrict,
 course_id uuid not null references public.learnora_courses(id) on delete restrict,
 status text not null default 'paid' check(status in ('pending','paid','refunded','cancelled')),
 currency text,
 amount_minor bigint,
 provider text,
 provider_reference text unique,
 purchased_at timestamptz not null default now(),
 refunded_at timestamptz
);
create index if not exists idx_course_purchases_user on public.learnora_course_purchases(user_id);
create index if not exists idx_course_purchases_course on public.learnora_course_purchases(course_id);

create table if not exists public.learnora_access_entitlements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.users(id) on delete cascade,
 organisation_id uuid references public.organisations(id) on delete cascade,
 course_id uuid references public.learnora_courses(id) on delete cascade,
 cohort_id uuid references public.cohorts(id) on delete cascade,
 source_type text not null check(source_type in ('subscription','purchase','organisation_contract','organisation_assignment','scholarship','promotion','manual')),
 source_id uuid,
 status text not null default 'active' check(status in ('active','scheduled','expired','revoked')),
 starts_at timestamptz not null default now(),
 ends_at timestamptz,
 metadata jsonb not null default '{}'::jsonb,
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists idx_access_entitlements_user on public.learnora_access_entitlements(user_id);
create index if not exists idx_access_entitlements_org on public.learnora_access_entitlements(organisation_id);
create index if not exists idx_access_entitlements_course on public.learnora_access_entitlements(course_id);

create table if not exists public.learnora_organisation_requests (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid references public.organisations(id) on delete set null,
 organisation_name text not null,
 contact_name text not null,
 email text not null,
 phone text,
 country text,
 website text,
 organisation_type text,
 request_type text not null,
 organisation_size integer,
 expected_learners integer,
 expected_instructors integer,
 expected_teams integer,
 expected_cohorts integer,
 duration text,
 requirements jsonb not null default '[]'::jsonb,
 notes text,
 status text not null default 'submitted' check(status in ('submitted','under_review','discussion','contract_preparation','contract_sent','signed','pending_approval','active','declined','closed')),
 submitted_at timestamptz not null default now(),
 reviewed_at timestamptz,
 closed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_org_requests_status on public.learnora_organisation_requests(status);
create index if not exists idx_org_requests_email on public.learnora_organisation_requests(email);

create table if not exists public.learnora_contracts (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid not null references public.organisations(id) on delete restrict,
 request_id uuid references public.learnora_organisation_requests(id) on delete set null,
 contract_number text not null unique,
 status text not null default 'draft' check(status in ('draft','sent','signed','active','expiring','expired','renewed','terminated')),
 currency text not null default 'NGN',
 start_date date,
 end_date date,
 commercial_terms text,
 document_url text,
 signed_at timestamptz,
 approved_at timestamptz,
 previous_contract_id uuid references public.learnora_contracts(id) on delete set null,
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_contract_entitlements (
 id uuid primary key default gen_random_uuid(),
 contract_id uuid not null references public.learnora_contracts(id) on delete cascade,
 entitlement_key text not null,
 limit_value bigint,
 unit text,
 enabled boolean not null default true,
 metadata jsonb not null default '{}'::jsonb,
 unique(contract_id, entitlement_key)
);
create index if not exists idx_contract_entitlements_contract on public.learnora_contract_entitlements(contract_id);

create table if not exists public.learnora_contract_versions (
 id uuid primary key default gen_random_uuid(),
 contract_id uuid not null references public.learnora_contracts(id) on delete cascade,
 version_number integer not null,
 document_url text,
 terms text,
 created_at timestamptz not null default now(),
 unique(contract_id, version_number)
);

create table if not exists public.learnora_capacity_reservations (
 id uuid primary key default gen_random_uuid(),
 contract_id uuid references public.learnora_contracts(id) on delete cascade,
 organisation_id uuid not null references public.organisations(id) on delete cascade,
 resource_type text not null check(resource_type in ('learners','instructors','teams','cohorts','courses','storage','ai')),
 quantity bigint not null check(quantity >= 0),
 used_quantity bigint not null default 0 check(used_quantity >= 0),
 status text not null default 'active' check(status in ('active','released','expired')),
 expires_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists idx_capacity_org_type on public.learnora_capacity_reservations(organisation_id,resource_type);

create table if not exists public.learnora_organisation_lifecycle (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid not null unique references public.organisations(id) on delete cascade,
 status text not null default 'requested' check(status in ('requested','under_review','contract_pending','pending_activation','active','expiring','expired','inactive','suspended','archived')),
 status_reason text,
 effective_at timestamptz not null default now(),
 changed_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

insert into public.learnora_organisation_lifecycle(organisation_id,status)
select id,'active' from public.organisations
on conflict(organisation_id) do nothing;

commit;
