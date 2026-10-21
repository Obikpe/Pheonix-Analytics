begin;

create table if not exists public.learnora_creator_accounts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references public.users(id) on delete restrict,
 status text not null default 'application' check(status in ('application','under_review','approved','suspended','closed')),
 display_name text,
 bio text,
 payout_currency text default 'NGN',
 commission_rate numeric(5,2) not null default 70 check(commission_rate between 0 and 100),
 approved_at timestamptz,
 approved_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.learnora_creator_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.users(id) on delete restrict,
 status text not null default 'submitted' check(status in ('submitted','under_review','approved','declined','withdrawn')),
 application_data jsonb not null default '{}'::jsonb,
 reviewed_by uuid references public.users(id) on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);

create table if not exists public.learnora_creator_sales (
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references public.learnora_creator_accounts(id) on delete restrict,
 buyer_user_id uuid references public.users(id) on delete set null,
 course_id uuid not null references public.learnora_courses(id) on delete restrict,
 gross_amount_minor bigint not null default 0,
 currency text not null,
 platform_fee_minor bigint not null default 0,
 creator_earnings_minor bigint not null default 0,
 status text not null default 'pending' check(status in ('pending','available','refunded','cancelled')),
 provider_reference text,
 created_at timestamptz not null default now(),
 available_at timestamptz
);
create index if not exists idx_creator_sales_creator on public.learnora_creator_sales(creator_id);
create index if not exists idx_creator_sales_buyer on public.learnora_creator_sales(buyer_user_id);

create table if not exists public.learnora_creator_ledger (
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references public.learnora_creator_accounts(id) on delete restrict,
 sale_id uuid references public.learnora_creator_sales(id) on delete set null,
 entry_type text not null check(entry_type in ('sale','platform_fee','refund','payout','adjustment')),
 amount_minor bigint not null,
 currency text not null,
 available_at timestamptz,
 created_at timestamptz not null default now(),
 metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_creator_ledger_creator on public.learnora_creator_ledger(creator_id);

create table if not exists public.learnora_creator_payouts (
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references public.learnora_creator_accounts(id) on delete restrict,
 amount_minor bigint not null check(amount_minor > 0),
 currency text not null,
 provider text,
 provider_reference text,
 status text not null default 'requested' check(status in ('requested','processing','paid','failed','cancelled')),
 requested_at timestamptz not null default now(),
 processed_at timestamptz
);

alter table public.learnora_courses add column if not exists creator_id uuid references public.learnora_creator_accounts(id) on delete set null;
create index if not exists idx_courses_creator on public.learnora_courses(creator_id);

commit;
