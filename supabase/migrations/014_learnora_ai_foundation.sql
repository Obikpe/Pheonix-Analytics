begin;

create table if not exists public.learnora_ai_providers (
 id uuid primary key default gen_random_uuid(),
 provider_key text not null unique,
 display_name text not null,
 base_url text,
 default_model text,
 enabled boolean not null default true,
 priority integer not null default 100,
 config jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_ai_conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete cascade,
 organisation_id uuid references public.organisations(id) on delete set null,
 feature text not null default 'tutor',
 title text,
 status text not null default 'active' check(status in ('active','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_ai_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.learnora_ai_conversations(id) on delete cascade,
 role text not null check(role in ('system','user','assistant','tool')),
 content text not null,
 provider text,
 model text,
 input_tokens integer,
 output_tokens integer,
 latency_ms integer,
 created_at timestamptz not null default now()
);

create table if not exists public.learnora_ai_limits (
 id uuid primary key default gen_random_uuid(),
 scope_type text not null check(scope_type in ('global','user','organisation','feature')),
 scope_id text,
 feature text,
 requests_per_day integer,
 requests_per_month integer,
 max_input_chars integer not null default 12000,
 max_output_tokens integer not null default 1200,
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

insert into public.learnora_ai_providers(provider_key,display_name,base_url,default_model,priority)
values ('openrouter','OpenRouter','https://openrouter.ai/api/v1','openrouter/auto',10)
on conflict(provider_key) do nothing;

create index if not exists idx_ai_conversations_user on public.learnora_ai_conversations(user_id,created_at desc);
create index if not exists idx_ai_messages_conversation on public.learnora_ai_messages(conversation_id,created_at);
create index if not exists idx_ai_limits_scope on public.learnora_ai_limits(scope_type,scope_id,feature);
alter table public.learnora_ai_providers enable row level security;
alter table public.learnora_ai_conversations enable row level security;
alter table public.learnora_ai_messages enable row level security;
alter table public.learnora_ai_limits enable row level security;

commit;