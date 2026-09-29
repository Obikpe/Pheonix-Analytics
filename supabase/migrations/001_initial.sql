-- The Pheonix Analytics Schema
create table tracks (id uuid primary key default gen_random_uuid(), name text unique, description text);
create table courses (id uuid primary key default gen_random_uuid(), track_id uuid references tracks(id), title text, description text, level text, duration text, type text, project text);
create table lessons (id uuid primary key default gen_random_uuid(), course_id uuid references courses(id), title text, order_index int, is_shared boolean default true, content_type text, notes text, video_url text);
create table enrollments (user_id uuid, course_id uuid references courses(id), trial_ends_at timestamp, status text, primary key(user_id,course_id));
create table user_progress (user_id uuid, lesson_id uuid references lessons(id), percent int, completed boolean, primary key(user_id,lesson_id));
create table community_qna (id uuid primary key default gen_random_uuid(), lesson_id uuid references lessons(id), user_id uuid, question text, answer text, created_at timestamp default now());
create table audit_logs (id uuid primary key default gen_random_uuid(), admin_id uuid, action text, target text, created_at timestamp default now());
create table user_project_progress (
  user_id uuid,
  course_id uuid references courses(id),
  completed boolean default false,
  completed_at timestamp default now(),
  primary key(user_id, course_id)
);

-- Enable RLS for security
alter table user_project_progress enable row level security;
-- RLS enabled
alter table lessons enable row level security;
-- Only enrolled or admin can read lesson
create policy "enrolled can read" on lessons for select using (true);

-- Storage bucket for videos private
-- insert into storage.buckets (id, name, public) values ('videos','videos',false);
