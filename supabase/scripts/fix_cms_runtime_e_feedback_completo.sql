-- =============================================================================
-- Correção completa e idempotente: CMS runtime + botão feedback + sugestões
-- Rode no SQL Editor do Supabase (ou psql). Seguro para executar mais de uma vez.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) cms_runtime_settings (tabela antiga sem feedback_button_enabled)
-- ---------------------------------------------------------------------------
-- Tabela base sem a coluna opcional: quem já tem tabela completa só ignora o CREATE.
create table if not exists public.cms_runtime_settings (
  id int primary key,
  active_version text not null default 'v1' check (active_version in ('v1', 'v2')),
  updated_at timestamptz not null default now()
);

alter table public.cms_runtime_settings
  add column if not exists feedback_button_enabled boolean not null default false;

alter table public.cms_runtime_settings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cms_runtime_settings'
      and policyname = 'cms_runtime_settings_read_all'
  ) then
    create policy cms_runtime_settings_read_all
      on public.cms_runtime_settings
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

insert into public.cms_runtime_settings (id, active_version, feedback_button_enabled)
values (1, 'v1', false)
on conflict (id) do nothing;

-- Realtime (evita erro se a tabela já estiver na publicação)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'cms_runtime_settings'
    ) then
      execute 'alter publication supabase_realtime add table public.cms_runtime_settings';
    end if;
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cms_runtime_settings_updated_at on public.cms_runtime_settings;
create trigger trg_cms_runtime_settings_updated_at
before update on public.cms_runtime_settings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Feedbacks & Sugestões (tabelas + RLS)
-- ---------------------------------------------------------------------------
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

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback_suggestions' and policyname = 'feedback_suggestions_select_auth'
  ) then
    create policy feedback_suggestions_select_auth
      on public.feedback_suggestions
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback_suggestions' and policyname = 'feedback_suggestions_insert_own'
  ) then
    create policy feedback_suggestions_insert_own
      on public.feedback_suggestions
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback_votes' and policyname = 'feedback_votes_select_auth'
  ) then
    create policy feedback_votes_select_auth
      on public.feedback_votes
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'feedback_votes' and policyname = 'feedback_votes_upsert_own'
  ) then
    create policy feedback_votes_upsert_own
      on public.feedback_votes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;
