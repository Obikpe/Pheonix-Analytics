begin;

create table if not exists public.learnora_notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.users(id) on delete cascade,
 organisation_id uuid references public.organisations(id) on delete cascade,
 notification_type text not null,
 title text not null,
 body text not null,
 action_url text,
 data jsonb not null default '{}'::jsonb,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.learnora_notifications(user_id,created_at desc);
create index if not exists idx_notifications_org on public.learnora_notifications(organisation_id,created_at desc);

create table if not exists public.learnora_audit_events (
 id uuid primary key default gen_random_uuid(),
 actor_user_id uuid references public.users(id) on delete set null,
 actor_staff_id uuid references public.learnora_staff_accounts(id) on delete set null,
 action text not null,
 resource_type text,
 resource_id text,
 organisation_id uuid references public.organisations(id) on delete set null,
 success boolean not null default true,
 ip_address inet,
 user_agent text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists idx_audit_events_created on public.learnora_audit_events(created_at desc);
create index if not exists idx_audit_events_actor on public.learnora_audit_events(actor_user_id);
create index if not exists idx_audit_events_org on public.learnora_audit_events(organisation_id);

create table if not exists public.learnora_platform_settings (
 key text primary key,
 value jsonb not null default '{}'::jsonb,
 is_secret boolean not null default false,
 updated_by uuid references public.users(id) on delete set null,
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_feature_flags (
 key text primary key,
 enabled boolean not null default false,
 config jsonb not null default '{}'::jsonb,
 updated_by uuid references public.users(id) on delete set null,
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_api_keys (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid references public.organisations(id) on delete cascade,
 name text not null,
 key_prefix text not null,
 key_hash text not null unique,
 status text not null default 'active' check(status in ('active','revoked')),
 last_used_at timestamptz,
 expires_at timestamptz,
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_org on public.learnora_api_keys(organisation_id);

alter table public.learnora_notifications enable row level security;
alter table public.learnora_audit_events enable row level security;
alter table public.learnora_platform_settings enable row level security;
alter table public.learnora_feature_flags enable row level security;
alter table public.learnora_api_keys enable row level security;

commit;
