-- ============================================================
-- LEARNORA ME V1 FOUNDATION
-- Migration: 002_learnora_v1_foundation.sql
--
-- Purpose:
--   Establish the multi-tenant Learnora architecture without
--   destroying the existing application or Witstart data.
--
-- Design principles:
--   - Organisation is the tenant boundary.
--   - Witstart is an organisation, not a special code path.
--   - Courses/content are reusable.
--   - Learning evidence is stored separately from content.
--   - AI provider is abstracted from the rest of Learnora.
--   - Video storage is abstracted from lessons.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. ORGANISATIONS
-- ============================================================

create table if not exists organisations (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    slug text not null unique,

    organisation_type text not null default 'academy'
        check (
            organisation_type in (
                'academy',
                'corporate',
                'university',
                'school',
                'bootcamp',
                'nonprofit',
                'custom'
            )
        ),

    description text,

    logo_url text,

    brand_primary text,
    brand_secondary text,

    template text not null default 'academy',

    is_active boolean not null default true,

    settings jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- 2. ORGANISATION MEMBERS
-- ============================================================

create table if not exists organisation_members (
    id uuid primary key default gen_random_uuid(),

    organisation_id uuid not null
        references organisations(id)
        on delete cascade,

    user_id uuid not null,

    role text not null
        check (
            role in (
                'owner',
                'admin',
                'instructor',
                'learner'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'invited',
                'suspended'
            )
        ),

    joined_at timestamptz not null default now(),

    unique (organisation_id, user_id)
);


create index if not exists idx_org_members_org
    on organisation_members(organisation_id);

create index if not exists idx_org_members_user
    on organisation_members(user_id);


-- ============================================================
-- 3. COHORTS
-- ============================================================

create table if not exists cohorts (
    id uuid primary key default gen_random_uuid(),

    organisation_id uuid not null
        references organisations(id)
        on delete cascade,

    name text not null,
    description text,

    start_date date,
    end_date date,

    status text not null default 'active'
        check (
            status in (
                'draft',
                'active',
                'completed',
                'archived'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create index if not exists idx_cohorts_org
    on cohorts(organisation_id);


-- ============================================================
-- 4. COHORT MEMBERS
-- ============================================================

create table if not exists cohort_members (
    id uuid primary key default gen_random_uuid(),

    cohort_id uuid not null
        references cohorts(id)
        on delete cascade,

    user_id uuid not null,

    joined_at timestamptz not null default now(),

    status text not null default 'active'
        check (
            status in (
                'active',
                'completed',
                'withdrawn'
            )
        ),

    unique (cohort_id, user_id)
);


create index if not exists idx_cohort_members_cohort
    on cohort_members(cohort_id);

create index if not exists idx_cohort_members_user
    on cohort_members(user_id);


-- ============================================================
-- 5. LEARNORA COURSE LIBRARY
-- ============================================================

create table if not exists learnora_courses (
    id uuid primary key default gen_random_uuid(),

    organisation_id uuid
        references organisations(id)
        on delete cascade,

    title text not null,
    slug text not null,

    short_description text,
    description text,

    level text
        check (
            level in (
                'beginner',
                'intermediate',
                'advanced',
                'mixed'
            )
        ),

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'published',
                'archived'
            )
        ),

    ownership text not null default 'learnora'
        check (
            ownership in (
                'learnora',
                'organisation'
            )
        ),

    thumbnail_url text,

    estimated_hours numeric(8,2),

    settings jsonb not null default '{}'::jsonb,

    created_by uuid,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (organisation_id, slug)
);


create index if not exists idx_courses_org
    on learnora_courses(organisation_id);

create index if not exists idx_courses_status
    on learnora_courses(status);


-- ============================================================
-- 6. COURSE ACCESS / ASSIGNMENT
--
-- A course is not duplicated when an organisation receives it.
-- Access is assigned here.
-- ============================================================

create table if not exists course_access (
    id uuid primary key default gen_random_uuid(),

    course_id uuid not null
        references learnora_courses(id)
        on delete cascade,

    organisation_id uuid not null
        references organisations(id)
        on delete cascade,

    access_type text not null default 'assigned'
        check (
            access_type in (
                'assigned',
                'catalogue',
                'private'
            )
        ),

    status text not null default 'active'
        check (
            status in (
                'active',
                'inactive'
            )
        ),

    assigned_by uuid,

    assigned_at timestamptz not null default now(),

    unique (course_id, organisation_id)
);


create index if not exists idx_course_access_org
    on course_access(organisation_id);

create index if not exists idx_course_access_course
    on course_access(course_id);


-- ============================================================
-- 7. COURSE MODULES
-- ============================================================

create table if not exists course_modules (
    id uuid primary key default gen_random_uuid(),

    course_id uuid not null
        references learnora_courses(id)
        on delete cascade,

    title text not null,
    description text,

    order_index integer not null default 0,

    status text not null default 'published'
        check (
            status in (
                'draft',
                'published',
                'archived'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (course_id, order_index)
);


create index if not exists idx_modules_course
    on course_modules(course_id);


-- ============================================================
-- 8. LESSONS
-- ============================================================

create table if not exists learnora_lessons (
    id uuid primary key default gen_random_uuid(),

    module_id uuid not null
        references course_modules(id)
        on delete cascade,

    title text not null,
    slug text,

    description text,

    order_index integer not null default 0,

    lesson_type text not null default 'mixed'
        check (
            lesson_type in (
                'video',
                'article',
                'text',
                'practice',
                'quiz',
                'assignment',
                'project',
                'mixed'
            )
        ),

    content text,

    duration_minutes integer,

    is_preview boolean not null default false,

    status text not null default 'draft'
        check (
            status in (
                'draft',
                'published',
                'archived'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (module_id, order_index)
);


create index if not exists idx_lessons_module
    on learnora_lessons(module_id);


-- ============================================================
-- 9. LESSON RESOURCES
-- ============================================================

create table if not exists lesson_resources (
    id uuid primary key default gen_random_uuid(),

    lesson_id uuid not null
        references learnora_lessons(id)
        on delete cascade,

    title text not null,

    resource_type text not null
        check (
            resource_type in (
                'pdf',
                'document',
                'spreadsheet',
                'image',
                'link',
                'dataset',
                'other'
            )
        ),

    storage_path text,
    external_url text,

    file_size_bytes bigint,

    created_at timestamptz not null default now()
);


create index if not exists idx_lesson_resources_lesson
    on lesson_resources(lesson_id);


-- ============================================================
-- 10. VIDEO METADATA
--
-- Actual video files live in storage/provider infrastructure.
-- The database stores metadata and provider information.
-- ============================================================

create table if not exists lesson_videos (
    id uuid primary key default gen_random_uuid(),

    lesson_id uuid not null
        references learnora_lessons(id)
        on delete cascade,

    provider text not null default 'supabase'
        check (
            provider in (
                'supabase',
                'cloudflare',
                'mux',
                'bunny',
                'vimeo',
                'youtube',
                'external',
                'other'
            )
        ),

    storage_path text,
    external_video_id text,

    title text,

    duration_seconds integer,

    file_size_bytes bigint,

    mime_type text,

    thumbnail_url text,

    status text not null default 'pending'
        check (
            status in (
                'pending',
                'processing',
                'ready',
                'failed',
                'archived'
            )
        ),

    is_private boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create index if not exists idx_lesson_videos_lesson
    on lesson_videos(lesson_id);


-- ============================================================
-- 11. ENROLMENTS
-- ============================================================

create table if not exists learnora_enrolments (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    course_id uuid not null
        references learnora_courses(id)
        on delete cascade,

    organisation_id uuid not null
        references organisations(id)
        on delete cascade,

    cohort_id uuid
        references cohorts(id)
        on delete set null,

    status text not null default 'active'
        check (
            status in (
                'invited',
                'active',
                'completed',
                'withdrawn',
                'suspended'
            )
        ),

    enrolled_at timestamptz not null default now(),
    completed_at timestamptz,

    unique (user_id, course_id, organisation_id)
);


create index if not exists idx_enrolments_user
    on learnora_enrolments(user_id);

create index if not exists idx_enrolments_org
    on learnora_enrolments(organisation_id);

create index if not exists idx_enrolments_course
    on learnora_enrolments(course_id);


-- ============================================================
-- 12. LESSON PROGRESS
-- ============================================================

create table if not exists learnora_lesson_progress (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    lesson_id uuid not null
        references learnora_lessons(id)
        on delete cascade,

    enrolment_id uuid
        references learnora_enrolments(id)
        on delete cascade,

    progress_percent integer not null default 0
        check (progress_percent between 0 and 100),

    completed boolean not null default false,

    last_position_seconds integer not null default 0,

    first_started_at timestamptz,
    last_accessed_at timestamptz,
    completed_at timestamptz,

    unique (user_id, lesson_id)
);


create index if not exists idx_lesson_progress_user
    on learnora_lesson_progress(user_id);

create index if not exists idx_lesson_progress_lesson
    on learnora_lesson_progress(lesson_id);


-- ============================================================
-- 13. QUIZZES
-- ============================================================

create table if not exists quizzes (
    id uuid primary key default gen_random_uuid(),

    lesson_id uuid
        references learnora_lessons(id)
        on delete cascade,

    course_id uuid
        references learnora_courses(id)
        on delete cascade,

    title text not null,
    description text,

    passing_score numeric(5,2) default 60,

    max_attempts integer,

    is_published boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table if not exists quiz_questions (
    id uuid primary key default gen_random_uuid(),

    quiz_id uuid not null
        references quizzes(id)
        on delete cascade,

    question text not null,

    question_type text not null default 'multiple_choice'
        check (
            question_type in (
                'multiple_choice',
                'multiple_select',
                'true_false',
                'short_answer'
            )
        ),

    options jsonb not null default '[]'::jsonb,

    correct_answer jsonb,

    explanation text,

    points numeric(8,2) not null default 1,

    order_index integer not null default 0
);


create table if not exists quiz_attempts (
    id uuid primary key default gen_random_uuid(),

    quiz_id uuid not null
        references quizzes(id)
        on delete cascade,

    user_id uuid not null,

    score numeric(5,2),

    passed boolean,

    answers jsonb not null default '{}'::jsonb,

    started_at timestamptz not null default now(),
    submitted_at timestamptz
);


create index if not exists idx_quiz_attempts_user
    on quiz_attempts(user_id);

create index if not exists idx_quiz_attempts_quiz
    on quiz_attempts(quiz_id);


-- ============================================================
-- 14. ASSIGNMENTS
-- ============================================================

create table if not exists assignments (
    id uuid primary key default gen_random_uuid(),

    lesson_id uuid
        references learnora_lessons(id)
        on delete cascade,

    course_id uuid
        references learnora_courses(id)
        on delete cascade,

    title text not null,
    description text,

    instructions text,

    due_date timestamptz,

    max_score numeric(8,2),

    is_published boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table if not exists assignment_submissions (
    id uuid primary key default gen_random_uuid(),

    assignment_id uuid not null
        references assignments(id)
        on delete cascade,

    user_id uuid not null,

    submission_text text,

    file_url text,

    status text not null default 'submitted'
        check (
            status in (
                'draft',
                'submitted',
                'graded',
                'returned'
            )
        ),

    score numeric(8,2),

    feedback text,

    submitted_at timestamptz,
    graded_at timestamptz,

    graded_by uuid
);


create index if not exists idx_assignment_submissions_user
    on assignment_submissions(user_id);

create index if not exists idx_assignment_submissions_assignment
    on assignment_submissions(assignment_id);


-- ============================================================
-- 15. PROJECTS
-- ============================================================

create table if not exists projects (
    id uuid primary key default gen_random_uuid(),

    course_id uuid
        references learnora_courses(id)
        on delete cascade,

    title text not null,
    description text,

    instructions text,

    skills jsonb not null default '[]'::jsonb,

    is_published boolean not null default false,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


create table if not exists project_submissions (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null
        references projects(id)
        on delete cascade,

    user_id uuid not null,

    title text,

    description text,

    repository_url text,
    live_url text,

    submission_url text,

    status text not null default 'submitted'
        check (
            status in (
                'draft',
                'submitted',
                'reviewed',
                'approved',
                'returned'
            )
        ),

    feedback text,

    score numeric(8,2),

    submitted_at timestamptz,
    reviewed_at timestamptz,

    reviewed_by uuid
);


create index if not exists idx_project_submissions_user
    on project_submissions(user_id);


-- ============================================================
-- 16. SKILLS
-- ============================================================

create table if not exists skills (
    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    category text,

    description text,

    created_at timestamptz not null default now()
);


create table if not exists learner_skills (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    skill_id uuid not null
        references skills(id)
        on delete cascade,

    organisation_id uuid
        references organisations(id)
        on delete cascade,

    proficiency numeric(5,2) default 0
        check (proficiency between 0 and 100),

    status text not null default 'developing'
        check (
            status in (
                'not_started',
                'developing',
                'competent',
                'advanced'
            )
        ),

    updated_at timestamptz not null default now(),

    unique (user_id, skill_id, organisation_id)
);


create table if not exists skill_evidence (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    skill_id uuid not null
        references skills(id)
        on delete cascade,

    evidence_type text not null
        check (
            evidence_type in (
                'quiz',
                'assessment',
                'assignment',
                'project',
                'simulation',
                'certificate',
                'manual'
            )
        ),

    source_id uuid,

    score numeric(8,2),

    notes text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 17. CERTIFICATES
-- ============================================================

create table if not exists certificates (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    course_id uuid not null
        references learnora_courses(id)
        on delete cascade,

    organisation_id uuid
        references organisations(id)
        on delete set null,

    certificate_number text not null unique,

    issued_at timestamptz not null default now(),

    metadata jsonb not null default '{}'::jsonb
);


-- ============================================================
-- 18. BADGES
-- ============================================================

create table if not exists badges (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    description text,

    icon_url text,

    criteria jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


create table if not exists learner_badges (
    id uuid primary key default gen_random_uuid(),

    badge_id uuid not null
        references badges(id)
        on delete cascade,

    user_id uuid not null,

    awarded_at timestamptz not null default now(),

    unique (badge_id, user_id)
);


-- ============================================================
-- 19. RECOMMENDATIONS
-- ============================================================

create table if not exists learning_recommendations (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null,

    organisation_id uuid
        references organisations(id)
        on delete cascade,

    course_id uuid
        references learnora_courses(id)
        on delete cascade,

    lesson_id uuid
        references learnora_lessons(id)
        on delete cascade,

    recommendation_type text not null,

    reason text,

    source text not null default 'rules'
        check (
            source in (
                'rules',
                'ai',
                'instructor',
                'system'
            )
        ),

    priority integer not null default 0,

    status text not null default 'active'
        check (
            status in (
                'active',
                'dismissed',
                'completed',
                'expired'
            )
        ),

    created_at timestamptz not null default now()
);


-- ============================================================
-- 20. AI USAGE
-- ============================================================

create table if not exists ai_usage_logs (
    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    organisation_id uuid
        references organisations(id)
        on delete set null,

    feature text not null,

    provider text not null default 'openrouter',

    model text,

    request_status text not null default 'success'
        check (
            request_status in (
                'success',
                'failed',
                'rate_limited',
                'blocked'
            )
        ),

    latency_ms integer,

    input_tokens integer,
    output_tokens integer,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


create index if not exists idx_ai_usage_user
    on ai_usage_logs(user_id);

create index if not exists idx_ai_usage_org
    on ai_usage_logs(organisation_id);

create index if not exists idx_ai_usage_created
    on ai_usage_logs(created_at);


-- ============================================================
-- 21. PLATFORM ACTIVITY
-- ============================================================

create table if not exists learnora_activity_logs (
    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    organisation_id uuid
        references organisations(id)
        on delete set null,

    action text not null,

    entity_type text,
    entity_id uuid,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);


create index if not exists idx_activity_org
    on learnora_activity_logs(organisation_id);

create index if not exists idx_activity_user
    on learnora_activity_logs(user_id);

create index if not exists idx_activity_created
    on learnora_activity_logs(created_at);


-- ============================================================
-- 22. FEEDBACK
-- ============================================================

create table if not exists learnora_feedback (
    id uuid primary key default gen_random_uuid(),

    user_id uuid,

    organisation_id uuid
        references organisations(id)
        on delete set null,

    lesson_id uuid
        references learnora_lessons(id)
        on delete set null,

    feedback_type text not null
        check (
            feedback_type in (
                'lesson',
                'platform',
                'feature_request',
                'instructor',
                'organisation'
            )
        ),

    rating integer
        check (rating between 1 and 5),

    message text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 23. UPDATED_AT TRIGGER
-- ============================================================

create or replace function learnora_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- Apply to tables where updated_at exists.

drop trigger if exists trg_organisations_updated_at
on organisations;

create trigger trg_organisations_updated_at
before update on organisations
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_cohorts_updated_at
on cohorts;

create trigger trg_cohorts_updated_at
before update on cohorts
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_courses_updated_at
on learnora_courses;

create trigger trg_courses_updated_at
before update on learnora_courses
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_modules_updated_at
on course_modules;

create trigger trg_modules_updated_at
before update on course_modules
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_lessons_updated_at
on learnora_lessons;

create trigger trg_lessons_updated_at
before update on learnora_lessons
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_videos_updated_at
on lesson_videos;

create trigger trg_videos_updated_at
before update on lesson_videos
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_quizzes_updated_at
on quizzes;

create trigger trg_quizzes_updated_at
before update on quizzes
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_assignments_updated_at
on assignments;

create trigger trg_assignments_updated_at
before update on assignments
for each row
execute function learnora_set_updated_at();


drop trigger if exists trg_projects_updated_at
on projects;

create trigger trg_projects_updated_at
before update on projects
for each row
execute function learnora_set_updated_at();


-- ============================================================
-- 24. INITIAL ORGANISATION
--
-- This creates Witstart as the first tenant.
-- We deliberately do NOT modify existing users yet.
-- ============================================================

insert into organisations (
    name,
    slug,
    organisation_type,
    template,
    description
)
values (
    'Witstart Academy',
    'witstart',
    'academy',
    'academy',
    'Witstart Academy organisation on Learnora ME'
)
on conflict (slug) do nothing;


-- ============================================================
-- 25. STORAGE BUCKET FOR VIDEOS
--
-- Videos remain private.
-- Actual playback should use signed URLs.
-- ============================================================

insert into storage.buckets (
    id,
    name,
    public
)
values (
    'learnora-videos',
    'learnora-videos',
    false
)
on conflict (id) do nothing;


-- ============================================================
-- 26. STORAGE BUCKET FOR COURSE RESOURCES
-- ============================================================

insert into storage.buckets (
    id,
    name,
    public
)
values (
    'learnora-resources',
    'learnora-resources',
    false
)
on conflict (id) do nothing;


-- ============================================================
-- 27. BASIC RLS
--
-- We intentionally enable RLS now, but the detailed policies
-- will be added with the authentication/organisation API layer.
-- ============================================================

alter table organisations enable row level security;
alter table organisation_members enable row level security;
alter table cohorts enable row level security;
alter table cohort_members enable row level security;
alter table learnora_courses enable row level security;
alter table course_access enable row level security;
alter table course_modules enable row level security;
alter table learnora_lessons enable row level security;
alter table lesson_resources enable row level security;
alter table lesson_videos enable row level security;
alter table learnora_enrolments enable row level security;
alter table learnora_lesson_progress enable row level security;
alter table quizzes enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_attempts enable row level security;
alter table assignments enable row level security;
alter table assignment_submissions enable row level security;
alter table projects enable row level security;
alter table project_submissions enable row level security;
alter table skills enable row level security;
alter table learner_skills enable row level security;
alter table skill_evidence enable row level security;
alter table certificates enable row level security;
alter table badges enable row level security;
alter table learner_badges enable row level security;
alter table learning_recommendations enable row level security;
alter table ai_usage_logs enable row level security;
alter table learnora_activity_logs enable row level security;
alter table learnora_feedback enable row level security;


-- ============================================================
-- END OF LEARNORA V1 FOUNDATION
-- ============================================================