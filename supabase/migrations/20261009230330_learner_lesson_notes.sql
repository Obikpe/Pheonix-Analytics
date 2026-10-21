create table if not exists public.learner_lesson_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.learnora_courses(id) on delete cascade,
  lesson_id uuid not null references public.learnora_lessons(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_lesson_notes_user_lesson_unique unique (user_id, lesson_id)
);

create index if not exists learner_lesson_notes_user_course_idx
  on public.learner_lesson_notes(user_id, course_id);

alter table public.learner_lesson_notes enable row level security;
