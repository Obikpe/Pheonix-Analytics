create table if not exists public.learnora_discussions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.learnora_courses(id) on delete cascade,
  lesson_id uuid references public.learnora_lessons(id) on delete set null,
  organisation_id uuid references public.organisations(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'question',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learnora_discussions_category_check check (category in ('question','discussion','announcement')),
  constraint learnora_discussions_status_check check (status in ('open','closed','hidden'))
);

create index if not exists learnora_discussions_course_created_idx
  on public.learnora_discussions(course_id, created_at desc);
create index if not exists learnora_discussions_org_created_idx
  on public.learnora_discussions(organisation_id, created_at desc);

create table if not exists public.learnora_discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.learnora_discussions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  is_answer boolean not null default false,
  status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learnora_discussion_replies_status_check check (status in ('visible','hidden'))
);

create index if not exists learnora_discussion_replies_discussion_created_idx
  on public.learnora_discussion_replies(discussion_id, created_at);

alter table public.learnora_discussions enable row level security;
alter table public.learnora_discussion_replies enable row level security;
