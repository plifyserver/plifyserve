-- Runtime switch para versão do CMS (v1/v2).
-- Mantém ambos os dashboards disponíveis e permite alternância em tempo real via Realtime.

create table if not exists public.cms_runtime_settings (
  id int primary key,
  active_version text not null default 'v1' check (active_version in ('v1', 'v2')),
  feedback_button_enabled boolean not null default false,
  profile_cms_version text not null default 'v1' check (profile_cms_version in ('v1', 'v2')),
  updated_at timestamptz not null default now()
);

alter table public.cms_runtime_settings enable row level security;

-- Leitura liberada para permitir que o frontend descubra a versão ativa.
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

-- Garante linha singleton
insert into public.cms_runtime_settings (id, active_version, feedback_button_enabled, profile_cms_version)
values (1, 'v1', false, 'v1')
on conflict (id) do nothing;

-- Realtime (só adiciona se ainda não estiver na publicação — evita erro 42710 ao reexecutar o script)
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

-- updated_at automático em updates
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

