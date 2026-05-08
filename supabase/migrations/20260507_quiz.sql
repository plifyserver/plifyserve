-- QUIZ: quizzes, perguntas e respostas (leads)

-- =========================
-- 1) Quizzes (por usuário)
-- =========================
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null,
  logo_url text,
  intro_title text,
  intro_description text,
  thanks_title text,
  thanks_description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create index if not exists idx_quizzes_user_id on public.quizzes(user_id);
create index if not exists idx_quizzes_slug on public.quizzes(slug);

alter table public.quizzes enable row level security;

drop policy if exists quizzes_own_all on public.quizzes;
create policy quizzes_own_all
  on public.quizzes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists quizzes_public_select on public.quizzes;
create policy quizzes_public_select
  on public.quizzes
  for select
  using (is_published = true);

-- =========================
-- 2) Perguntas do quiz
-- =========================
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  "order" int not null default 0,
  title text not null,
  description text,
  kind text not null check (kind in ('select', 'short_text', 'long_text')),
  required boolean not null default false,
  options jsonb not null default '[]'::jsonb,
  placeholder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_quiz_questions_quiz on public.quiz_questions(quiz_id);

alter table public.quiz_questions enable row level security;

drop policy if exists quiz_questions_own_all on public.quiz_questions;
create policy quiz_questions_own_all
  on public.quiz_questions
  for all
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.user_id = auth.uid()
    )
  );

drop policy if exists quiz_questions_public_select on public.quiz_questions;
create policy quiz_questions_public_select
  on public.quiz_questions
  for select
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.is_published = true
    )
  );

-- =========================
-- 3) Respostas do quiz (leads)
-- =========================
create table if not exists public.quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  lead_name text,
  lead_email text,
  lead_phone text,
  answers jsonb not null default '{}'::jsonb,
  utm jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text
);

create index if not exists idx_quiz_responses_quiz on public.quiz_responses(quiz_id, submitted_at desc);

alter table public.quiz_responses enable row level security;

drop policy if exists quiz_responses_owner_select on public.quiz_responses;
create policy quiz_responses_owner_select
  on public.quiz_responses
  for select
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.user_id = auth.uid()
    )
  );

drop policy if exists quiz_responses_public_insert on public.quiz_responses;
create policy quiz_responses_public_insert
  on public.quiz_responses
  for insert
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.is_published = true
    )
  );

