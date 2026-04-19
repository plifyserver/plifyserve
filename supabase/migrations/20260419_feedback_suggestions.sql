-- Feedbacks & Sugestões (comunidade + votos)

create table if not exists public.feedback_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  category text not null,
  description text not null,
  likes_count int not null default 0,
  dislikes_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.feedback_suggestions(id) on delete cascade,
  user_id uuid not null,
  vote text not null check (vote in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique (suggestion_id, user_id)
);

alter table public.feedback_suggestions enable row level security;
alter table public.feedback_votes enable row level security;

-- Leitura para usuários autenticados
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='feedback_suggestions' and policyname='feedback_suggestions_select_auth'
  ) then
    create policy feedback_suggestions_select_auth
      on public.feedback_suggestions
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='feedback_suggestions' and policyname='feedback_suggestions_insert_own'
  ) then
    create policy feedback_suggestions_insert_own
      on public.feedback_suggestions
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='feedback_votes' and policyname='feedback_votes_select_auth'
  ) then
    create policy feedback_votes_select_auth
      on public.feedback_votes
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='feedback_votes' and policyname='feedback_votes_upsert_own'
  ) then
    create policy feedback_votes_upsert_own
      on public.feedback_votes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

