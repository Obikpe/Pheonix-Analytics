-- 005_learnora_internal_staff.sql
-- Internal Learnora organisation: staff, departments, teams, roles and assignments.
-- Additive: legacy public.admins is intentionally untouched.

begin;

create table if not exists public.learnora_departments (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text,
    status text not null default 'active' check (status in ('active','inactive','archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.learnora_staff_accounts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.users(id) on delete restrict,
    employee_code text unique,
    job_title text,
    status text not null default 'invited' check (status in ('invited','pending_activation','active','suspended','deactivated')),
    joined_at timestamptz,
    left_at timestamptz,
    created_by uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.learnora_staff_teams (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text,
    department_id uuid references public.learnora_departments(id) on delete set null,
    manager_staff_id uuid references public.learnora_staff_accounts(id) on delete set null,
    status text not null default 'active' check (status in ('active','inactive','archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.learnora_staff_team_members (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.learnora_staff_teams(id) on delete cascade,
    staff_id uuid not null references public.learnora_staff_accounts(id) on delete cascade,
    team_role text not null default 'member',
    status text not null default 'active' check (status in ('active','inactive')),
    joined_at timestamptz not null default now(),
    left_at timestamptz,
    unique (team_id, staff_id)
);

create table if not exists public.learnora_staff_roles (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text,
    is_system_role boolean not null default false,
    status text not null default 'active' check (status in ('active','inactive','archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.learnora_staff_role_assignments (
    id uuid primary key default gen_random_uuid(),
    staff_id uuid not null references public.learnora_staff_accounts(id) on delete cascade,
    role_id uuid not null references public.learnora_staff_roles(id) on delete cascade,
    status text not null default 'active' check (status in ('active','inactive')),
    assigned_at timestamptz not null default now(),
    assigned_by uuid references public.learnora_staff_accounts(id) on delete set null,
    unique (staff_id, role_id)
);

create index if not exists idx_learnora_staff_user on public.learnora_staff_accounts(user_id);
create index if not exists idx_learnora_staff_status on public.learnora_staff_accounts(status);
create index if not exists idx_learnora_staff_team_department on public.learnora_staff_teams(department_id);
create index if not exists idx_learnora_staff_team_manager on public.learnora_staff_teams(manager_staff_id);
create index if not exists idx_learnora_staff_members_team on public.learnora_staff_team_members(team_id);
create index if not exists idx_learnora_staff_members_staff on public.learnora_staff_team_members(staff_id);
create index if not exists idx_learnora_staff_role_assignments_staff on public.learnora_staff_role_assignments(staff_id);
create index if not exists idx_learnora_staff_role_assignments_role on public.learnora_staff_role_assignments(role_id);

insert into public.learnora_permissions (permission_key,name,description,category) values
('staff.view','View Learnora Staff','View internal Learnora staff accounts and structure.','staff'),
('staff.create','Create Learnora Staff','Create internal Learnora staff accounts.','staff'),
('staff.update','Manage Learnora Staff','Update staff records and lifecycle state.','staff'),
('staff.roles','Manage Staff Roles','Assign and manage internal staff roles.','staff'),
('staff.teams','Manage Staff Teams','Manage internal departments, teams and memberships.','staff'),
('staff.departments','Manage Staff Departments','Manage internal Learnora departments.','staff'),
('system.audit','View Internal Audit','View internal platform administration activity.','security')
on conflict (permission_key) do nothing;

insert into public.learnora_platform_role_permissions (platform_role, permission_id)
select 'super_admin', id from public.learnora_permissions
where permission_key in ('staff.view','staff.create','staff.update','staff.roles','staff.teams','staff.departments','system.audit')
on conflict (platform_role, permission_id) do nothing;

insert into public.learnora_staff_roles (name,slug,description,is_system_role) values
('Super Admin','super_admin','Highest internal Learnora authority.',true),
('Executive','executive','Leadership and company-level operations.',true),
('Product','product','Product strategy, requirements and platform experience.',true),
('Engineering','engineering','Software engineering and technical systems.',true),
('Data & Analytics','data_analytics','Data, analytics, reporting and measurement.',true),
('Learning & Curriculum','learning_curriculum','Curriculum, learning design and academic quality.',true),
('Customer Success','customer_success','Customer onboarding, support and retention.',true),
('Sales & Partnerships','sales_partnerships','Commercial relationships and partnerships.',true),
('Finance','finance','Finance, transactions and financial operations.',true),
('Operations','operations','Internal operations and administration.',true),
('Support','support','User and organisation support.',true),
('AI & Research','ai_research','AI systems, experimentation and research.',true)
on conflict (slug) do nothing;

insert into public.learnora_departments (name,slug,description) values
('Executive','executive','Learnora leadership and strategic direction.'),
('Product','product','Product management, research and experience.'),
('Engineering','engineering','Platform engineering and infrastructure.'),
('Data & Analytics','data-analytics','Data, analytics and business intelligence.'),
('Learning & Curriculum','learning-curriculum','Learning design, curriculum and academic quality.'),
('Customer Success','customer-success','Customer onboarding, support and success.'),
('Sales & Partnerships','sales-partnerships','Commercial relationships and partnerships.'),
('Finance','finance','Financial operations and controls.'),
('Operations','operations','Internal operations and administration.'),
('Support','support','User and organisation support.'),
('AI & Research','ai-research','AI systems and research.')
on conflict (slug) do nothing;

do $$
begin
    if to_regprocedure('public.set_updated_at()') is not null then
        execute 'drop trigger if exists trg_learnora_departments_updated_at on public.learnora_departments';
        execute 'create trigger trg_learnora_departments_updated_at before update on public.learnora_departments for each row execute function public.set_updated_at()';
        execute 'drop trigger if exists trg_learnora_staff_updated_at on public.learnora_staff_accounts';
        execute 'create trigger trg_learnora_staff_updated_at before update on public.learnora_staff_accounts for each row execute function public.set_updated_at()';
        execute 'drop trigger if exists trg_learnora_staff_teams_updated_at on public.learnora_staff_teams';
        execute 'create trigger trg_learnora_staff_teams_updated_at before update on public.learnora_staff_teams for each row execute function public.set_updated_at()';
        execute 'drop trigger if exists trg_learnora_staff_roles_updated_at on public.learnora_staff_roles';
        execute 'create trigger trg_learnora_staff_roles_updated_at before update on public.learnora_staff_roles for each row execute function public.set_updated_at()';
    end if;
end $$;

alter table public.learnora_departments enable row level security;
alter table public.learnora_staff_accounts enable row level security;
alter table public.learnora_staff_teams enable row level security;
alter table public.learnora_staff_team_members enable row level security;
alter table public.learnora_staff_roles enable row level security;
alter table public.learnora_staff_role_assignments enable row level security;

commit;
