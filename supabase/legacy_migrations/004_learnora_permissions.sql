-- ============================================================
-- 004_learnora_permissions.sql
--
-- Learnora V1 permission and administration foundation
--
-- Design:
--   users   -> learners / instructors / organisation members
--   admins  -> existing administrative accounts
--   organisation_members -> organisation-level access
--   platform_admins -> Learnora platform-level administration
--
-- IMPORTANT:
--   This migration does NOT delete or modify existing roles.
--   Existing authentication remains compatible.
-- ============================================================

begin;


-- ============================================================
-- 1. PLATFORM ADMINS
--
-- Connect the existing admins table to Learnora's platform
-- administration layer.
--
-- admins.id is BIGINT, so we deliberately use BIGINT here.
-- ============================================================

create table if not exists learnora_platform_admins (

    id uuid primary key default gen_random_uuid(),

    admin_id bigint not null
        references public.admins(id)
        on delete cascade,

    platform_role text not null default 'admin'
        check (
            platform_role in (
                'super_admin',
                'platform_admin',
                'support_admin',
                'content_admin',
                'analytics_admin'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'suspended',
                'revoked'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (admin_id)
);


create index if not exists idx_platform_admins_admin
    on learnora_platform_admins(admin_id);

create index if not exists idx_platform_admins_role
    on learnora_platform_admins(platform_role);


-- ============================================================
-- 2. ADMIN ORGANISATION ACCESS
--
-- Platform administrators may have access to one or more
-- organisations.
--
-- This is deliberately separate from organisation_members
-- because organisation_members currently belongs to users
-- (UUID identities), while admins use BIGINT identities.
-- ============================================================

create table if not exists learnora_admin_organisation_access (

    id uuid primary key default gen_random_uuid(),

    admin_id bigint not null
        references public.admins(id)
        on delete cascade,

    organisation_id uuid not null
        references public.organisations(id)
        on delete cascade,

    role text not null
        check (
            role in (
                'owner',
                'admin',
                'instructor',
                'support',
                'analyst',
                'content_manager'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'suspended',
                'revoked'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (admin_id, organisation_id)
);


create index if not exists idx_admin_org_access_admin
    on learnora_admin_organisation_access(admin_id);

create index if not exists idx_admin_org_access_org
    on learnora_admin_organisation_access(organisation_id);


-- ============================================================
-- 3. PLATFORM PERMISSIONS
--
-- Fine-grained permissions allow us to grow beyond simply
-- checking whether someone is an "admin".
-- ============================================================

create table if not exists learnora_permissions (

    id uuid primary key default gen_random_uuid(),

    permission_key text not null unique,

    name text not null,

    description text,

    category text not null,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 4. PLATFORM ROLE PERMISSIONS
--
-- Maps platform roles to permissions.
-- ============================================================

create table if not exists learnora_platform_role_permissions (

    id uuid primary key default gen_random_uuid(),

    platform_role text not null
        check (
            platform_role in (
                'super_admin',
                'platform_admin',
                'support_admin',
                'content_admin',
                'analytics_admin'
            )
        ),

    permission_id uuid not null
        references learnora_permissions(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    unique (platform_role, permission_id)
);


create index if not exists idx_platform_role_permissions_role
    on learnora_platform_role_permissions(platform_role);

create index if not exists idx_platform_role_permissions_permission
    on learnora_platform_role_permissions(permission_id);


-- ============================================================
-- 5. ORGANISATION ROLE PERMISSIONS
--
-- Organisation roles are separate from platform roles.
--
-- Example:
--
--   platform: super_admin
--   organisation: admin
--   organisation: instructor
--   organisation: learner
-- ============================================================

create table if not exists learnora_organisation_role_permissions (

    id uuid primary key default gen_random_uuid(),

    organisation_role text not null
        check (
            organisation_role in (
                'owner',
                'admin',
                'instructor',
                'learner'
            )
        ),

    permission_id uuid not null
        references learnora_permissions(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    unique (organisation_role, permission_id)
);


create index if not exists idx_org_role_permissions_role
    on learnora_organisation_role_permissions(organisation_role);


-- ============================================================
-- 6. SEED PLATFORM PERMISSIONS
-- ============================================================

insert into learnora_permissions (
    permission_key,
    name,
    description,
    category
)
values

-- Platform
(
    'platform.view',
    'View Platform',
    'View the Learnora platform administration area.',
    'platform'
),

(
    'platform.settings',
    'Manage Platform Settings',
    'Manage global Learnora platform settings.',
    'platform'
),

(
    'platform.analytics',
    'View Platform Analytics',
    'View whole-platform analytics and performance.',
    'analytics'
),

(
    'platform.activity',
    'View Platform Activity',
    'View platform-wide activity and audit information.',
    'platform'
),

-- Organisations
(
    'organisations.view',
    'View Organisations',
    'View Learnora organisations.',
    'organisations'
),

(
    'organisations.create',
    'Create Organisations',
    'Create new organisations on Learnora.',
    'organisations'
),

(
    'organisations.update',
    'Manage Organisations',
    'Edit organisation settings and configuration.',
    'organisations'
),

(
    'organisations.delete',
    'Delete Organisations',
    'Delete or deactivate organisations.',
    'organisations'
),

(
    'organisations.members',
    'Manage Organisation Members',
    'Manage organisation users and membership.',
    'organisations'
),

-- Users
(
    'users.view',
    'View Users',
    'View learner, instructor and administrative users.',
    'users'
),

(
    'users.create',
    'Create Users',
    'Create user accounts.',
    'users'
),

(
    'users.update',
    'Manage Users',
    'Edit user accounts and access.',
    'users'
),

(
    'users.suspend',
    'Suspend Users',
    'Suspend or deactivate user access.',
    'users'
),

-- Courses
(
    'courses.view',
    'View Courses',
    'View courses in the Learnora library.',
    'courses'
),

(
    'courses.create',
    'Create Courses',
    'Create new courses.',
    'courses'
),

(
    'courses.update',
    'Manage Courses',
    'Edit course information and structure.',
    'courses'
),

(
    'courses.publish',
    'Publish Courses',
    'Publish or unpublish courses.',
    'courses'
),

(
    'courses.delete',
    'Delete Courses',
    'Archive or remove courses.',
    'courses'
),

(
    'courses.assign',
    'Assign Courses',
    'Assign courses to organisations, cohorts or learners.',
    'courses'
),

-- Content
(
    'content.manage',
    'Manage Learning Content',
    'Create and manage modules, lessons and resources.',
    'content'
),

(
    'content.video',
    'Manage Videos',
    'Upload, manage and remove lesson videos.',
    'content'
),

(
    'content.resources',
    'Manage Resources',
    'Manage lesson files, datasets and other resources.',
    'content'
),

-- Assessment
(
    'assessment.manage',
    'Manage Assessments',
    'Create and manage quizzes, assignments and projects.',
    'assessment'
),

(
    'assessment.grade',
    'Grade Assessments',
    'Review and grade learner submissions.',
    'assessment'
),

(
    'assessment.view',
    'View Assessment Results',
    'View learner assessment performance.',
    'assessment'
),

-- Learner progress
(
    'progress.view',
    'View Learner Progress',
    'View learner progress and activity.',
    'learning'
),

(
    'progress.manage',
    'Manage Learner Progress',
    'Manage or correct learner progress records.',
    'learning'
),

-- Analytics
(
    'analytics.learners',
    'View Learner Analytics',
    'View learner-level analytics.',
    'analytics'
),

(
    'analytics.organisation',
    'View Organisation Analytics',
    'View organisation and cohort analytics.',
    'analytics'
),

(
    'analytics.courses',
    'View Course Analytics',
    'View course and lesson performance.',
    'analytics'
),

-- AI
(
    'ai.view',
    'View AI Usage',
    'View Learnora AI usage and activity.',
    'ai'
),

(
    'ai.manage',
    'Manage AI',
    'Manage AI settings, limits and provider configuration.',
    'ai'
),

-- Certificates
(
    'certificates.manage',
    'Manage Certificates',
    'Issue, revoke and manage certificates.',
    'credentials'
),

-- Platform administration
(
    'audit.view',
    'View Audit Logs',
    'View security and administrative audit records.',
    'security'
)

on conflict (permission_key) do nothing;


-- ============================================================
-- 7. SUPER ADMIN GETS ALL PERMISSIONS
-- ============================================================

insert into learnora_platform_role_permissions (
    platform_role,
    permission_id
)
select
    'super_admin',
    id
from learnora_permissions
on conflict (platform_role, permission_id) do nothing;


-- ============================================================
-- 8. PLATFORM ADMIN PERMISSIONS
-- ============================================================

insert into learnora_platform_role_permissions (
    platform_role,
    permission_id
)
select
    'platform_admin',
    id
from learnora_permissions
where permission_key in (
    'platform.view',
    'platform.analytics',
    'platform.activity',
    'organisations.view',
    'organisations.create',
    'organisations.update',
    'organisations.members',
    'users.view',
    'users.create',
    'users.update',
    'users.suspend',
    'courses.view',
    'courses.create',
    'courses.update',
    'courses.publish',
    'courses.assign',
    'content.manage',
    'content.video',
    'content.resources',
    'assessment.manage',
    'assessment.grade',
    'assessment.view',
    'progress.view',
    'analytics.learners',
    'analytics.organisation',
    'analytics.courses',
    'ai.view',
    'certificates.manage'
)
on conflict (platform_role, permission_id) do nothing;


-- ============================================================
-- 9. SUPPORT ADMIN PERMISSIONS
-- ============================================================

insert into learnora_platform_role_permissions (
    platform_role,
    permission_id
)
select
    'support_admin',
    id
from learnora_permissions
where permission_key in (
    'platform.view',
    'organisations.view',
    'organisations.members',
    'users.view',
    'users.update',
    'progress.view',
    'analytics.learners',
    'analytics.organisation',
    'platform.activity'
)
on conflict (platform_role, permission_id) do nothing;


-- ============================================================
-- 10. CONTENT ADMIN PERMISSIONS
-- ============================================================

insert into learnora_platform_role_permissions (
    platform_role,
    permission_id
)
select
    'content_admin',
    id
from learnora_permissions
where permission_key in (
    'platform.view',
    'courses.view',
    'courses.create',
    'courses.update',
    'courses.publish',
    'courses.assign',
    'content.manage',
    'content.video',
    'content.resources',
    'assessment.manage',
    'certificates.manage'
)
on conflict (platform_role, permission_id) do nothing;


-- ============================================================
-- 11. ANALYTICS ADMIN PERMISSIONS
-- ============================================================

insert into learnora_platform_role_permissions (
    platform_role,
    permission_id
)
select
    'analytics_admin',
    id
from learnora_permissions
where permission_key in (
    'platform.view',
    'platform.analytics',
    'platform.activity',
    'organisations.view',
    'users.view',
    'courses.view',
    'assessment.view',
    'progress.view',
    'analytics.learners',
    'analytics.organisation',
    'analytics.courses',
    'ai.view',
    'audit.view'
)
on conflict (platform_role, permission_id) do nothing;


-- ============================================================
-- 12. ORGANISATION ROLE PERMISSIONS
-- ============================================================

-- OWNER
insert into learnora_organisation_role_permissions (
    organisation_role,
    permission_id
)
select
    'owner',
    id
from learnora_permissions
where permission_key in (
    'organisations.view',
    'organisations.update',
    'organisations.members',
    'users.view',
    'users.create',
    'users.update',
    'users.suspend',
    'courses.view',
    'courses.create',
    'courses.update',
    'courses.publish',
    'courses.assign',
    'content.manage',
    'content.video',
    'content.resources',
    'assessment.manage',
    'assessment.grade',
    'assessment.view',
    'progress.view',
    'progress.manage',
    'analytics.learners',
    'analytics.organisation',
    'analytics.courses',
    'ai.view',
    'certificates.manage'
)
on conflict (organisation_role, permission_id) do nothing;


-- ADMIN
insert into learnora_organisation_role_permissions (
    organisation_role,
    permission_id
)
select
    'admin',
    id
from learnora_permissions
where permission_key in (
    'organisations.view',
    'organisations.members',
    'users.view',
    'users.create',
    'users.update',
    'users.suspend',
    'courses.view',
    'courses.create',
    'courses.update',
    'courses.publish',
    'courses.assign',
    'content.manage',
    'content.video',
    'content.resources',
    'assessment.manage',
    'assessment.grade',
    'assessment.view',
    'progress.view',
    'analytics.learners',
    'analytics.organisation',
    'analytics.courses',
    'ai.view',
    'certificates.manage'
)
on conflict (organisation_role, permission_id) do nothing;


-- INSTRUCTOR
insert into learnora_organisation_role_permissions (
    organisation_role,
    permission_id
)
select
    'instructor',
    id
from learnora_permissions
where permission_key in (
    'courses.view',
    'courses.create',
    'courses.update',
    'content.manage',
    'content.video',
    'content.resources',
    'assessment.manage',
    'assessment.grade',
    'assessment.view',
    'progress.view',
    'analytics.learners',
    'analytics.courses',
    'ai.view',
    'certificates.manage'
)
on conflict (organisation_role, permission_id) do nothing;


-- LEARNER
insert into learnora_organisation_role_permissions (
    organisation_role,
    permission_id
)
select
    'learner',
    id
from learnora_permissions
where permission_key in (
    'courses.view',
    'assessment.view',
    'progress.view',
    'analytics.courses'
)
on conflict (organisation_role, permission_id) do nothing;


-- ============================================================
-- 13. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists trg_platform_admins_updated_at
on learnora_platform_admins;

create trigger trg_platform_admins_updated_at
before update on learnora_platform_admins
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_admin_org_access_updated_at
on learnora_admin_organisation_access;

create trigger trg_admin_org_access_updated_at
before update on learnora_admin_organisation_access
for each row
execute function learnora_set_updated_at();


-- ============================================================
-- 14. ENABLE RLS
--
-- Policies will be introduced when the backend starts using
-- the new permission resolver.
-- ============================================================

alter table learnora_platform_admins
enable row level security;

alter table learnora_admin_organisation_access
enable row level security;

alter table learnora_permissions
enable row level security;

alter table learnora_platform_role_permissions
enable row level security;

alter table learnora_organisation_role_permissions
enable row level security;


commit;


-- ============================================================
-- END OF 004
-- ============================================================