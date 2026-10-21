-- Cohort-specific accounts and immutable cohort track assignments.
-- Existing public.users rows and existing cohort_members rows are preserved.

create table if not exists public.learnora_tracks (
    id uuid primary key default gen_random_uuid(),
    organisation_id uuid null references public.organisations(id) on delete cascade,
    name text not null check (length(btrim(name)) between 2 and 120),
    slug text not null check (length(btrim(slug)) between 2 and 140),
    description text,
    status text not null default 'active' check (status in ('active','inactive','archived')),
    created_by uuid null references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists learnora_tracks_scope_slug_uidx
    on public.learnora_tracks (coalesce(organisation_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(slug));

create table if not exists public.cohort_track_options (
    id uuid primary key default gen_random_uuid(),
    cohort_id uuid not null references public.cohorts(id) on delete cascade,
    track_id uuid not null references public.learnora_tracks(id) on delete restrict,
    status text not null default 'active' check (status in ('active','inactive')),
    created_by uuid null references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    unique (cohort_id, track_id)
);

create table if not exists public.cohort_track_courses (
    id uuid primary key default gen_random_uuid(),
    cohort_id uuid not null references public.cohorts(id) on delete cascade,
    track_id uuid not null references public.learnora_tracks(id) on delete restrict,
    course_id uuid not null references public.learnora_courses(id) on delete restrict,
    status text not null default 'active' check (status in ('active','inactive')),
    assigned_by uuid null references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (cohort_id, track_id, course_id),
    constraint cohort_track_courses_option_fk
        foreign key (cohort_id, track_id)
        references public.cohort_track_options(cohort_id, track_id)
        on delete cascade
);

create table if not exists public.cohort_accounts (
    id uuid primary key default gen_random_uuid(),
    cohort_id uuid not null references public.cohorts(id) on delete restrict,
    organisation_id uuid not null references public.organisations(id) on delete restrict,
    first_name text not null check (length(btrim(first_name)) between 1 and 100),
    last_name text not null check (length(btrim(last_name)) between 1 and 100),
    email text not null,
    username text not null,
    date_of_birth date not null,
    password_hash text null,
    status text not null default 'pending_activation'
        check (status in ('pending_activation','active','inactive')),
    activation_token_hash text null,
    activation_expires_at timestamptz null,
    activated_at timestamptz null,
    last_login_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint cohort_accounts_email_format_chk check (position('@' in email) > 1),
    constraint cohort_accounts_email_normalized_chk check (email = lower(btrim(email))),
    unique (cohort_id, email)
);

create unique index if not exists cohort_accounts_active_username_uidx
    on public.cohort_accounts (lower(username))
    where status in ('pending_activation','active');

create index if not exists cohort_accounts_cohort_status_idx
    on public.cohort_accounts (cohort_id, status);

create index if not exists cohort_accounts_email_idx
    on public.cohort_accounts (lower(email));

alter table public.cohort_members
    alter column user_id drop not null;

alter table public.cohort_members
    add column if not exists cohort_account_id uuid null references public.cohort_accounts(id) on delete restrict,
    add column if not exists track_id uuid null references public.learnora_tracks(id) on delete restrict;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'cohort_members_identity_chk'
          and conrelid = 'public.cohort_members'::regclass
    ) then
        alter table public.cohort_members
            add constraint cohort_members_identity_chk
            check (user_id is not null or cohort_account_id is not null);
    end if;
    if not exists (
        select 1 from pg_constraint
        where conname = 'cohort_members_account_track_chk'
          and conrelid = 'public.cohort_members'::regclass
    ) then
        alter table public.cohort_members
            add constraint cohort_members_account_track_chk
            check (cohort_account_id is null or track_id is not null);
    end if;
end $$;

create unique index if not exists cohort_members_cohort_account_uidx
    on public.cohort_members (cohort_id, cohort_account_id)
    where cohort_account_id is not null;

create index if not exists cohort_members_track_idx
    on public.cohort_members (track_id)
    where track_id is not null;

create or replace function public.enforce_cohort_member_track_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
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
$$;

drop trigger if exists trg_cohort_member_track_immutable on public.cohort_members;
create trigger trg_cohort_member_track_immutable
before update of track_id, cohort_account_id on public.cohort_members
for each row execute function public.enforce_cohort_member_track_immutability();

create or replace function public.validate_cohort_track_option_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
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
$$;

drop trigger if exists trg_validate_cohort_track_option_scope on public.cohort_track_options;
create trigger trg_validate_cohort_track_option_scope
before insert or update of cohort_id, track_id on public.cohort_track_options
for each row execute function public.validate_cohort_track_option_scope();

alter table public.learnora_tracks enable row level security;
alter table public.cohort_track_options enable row level security;
alter table public.cohort_track_courses enable row level security;
alter table public.cohort_accounts enable row level security;

revoke all on public.learnora_tracks, public.cohort_track_options, public.cohort_track_courses, public.cohort_accounts from anon, authenticated;
grant all on public.learnora_tracks, public.cohort_track_options, public.cohort_track_courses, public.cohort_accounts to service_role;
