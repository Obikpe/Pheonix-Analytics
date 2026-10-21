begin;

create table if not exists public.organisation_teams (
 id uuid primary key default gen_random_uuid(),
 organisation_id uuid not null references public.organisations(id) on delete cascade,
 name text not null,
 slug text not null,
 description text,
 status text not null default 'active' check(status in ('active','inactive','archived')),
 manager_user_id uuid references public.users(id) on delete set null,
 created_by uuid references public.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organisation_id,slug)
);

create table if not exists public.organisation_team_members (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.organisation_teams(id) on delete cascade,
 user_id uuid not null references public.users(id) on delete cascade,
 role text not null default 'member' check(role in ('member','lead','manager')),
 status text not null default 'active' check(status in ('active','inactive')),
 joined_at timestamptz not null default now(),
 unique(team_id,user_id)
);

create index if not exists idx_org_teams_org on public.organisation_teams(organisation_id);
create index if not exists idx_org_team_members_team on public.organisation_team_members(team_id);
create index if not exists idx_org_team_members_user on public.organisation_team_members(user_id);

commit;