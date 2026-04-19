-- CMS das Configurações: v1 = fluxo atual (foto/senha/dados no app); v2 = hub em Configurações + menu personalizável.
-- Preferências de menu (ordem e itens ativos) por utilizador.

alter table public.cms_runtime_settings
  add column if not exists settings_cms_version text;

update public.cms_runtime_settings
set settings_cms_version = 'v1'
where id = 1
  and (settings_cms_version is null or settings_cms_version not in ('v1', 'v2'));

alter table public.cms_runtime_settings
  alter column settings_cms_version set default 'v1';

alter table public.cms_runtime_settings
  alter column settings_cms_version set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cms_runtime_settings_settings_cms_version_check'
  ) then
    alter table public.cms_runtime_settings
      add constraint cms_runtime_settings_settings_cms_version_check
      check (settings_cms_version in ('v1', 'v2'));
  end if;
end $$;

alter table public.profiles
  add column if not exists dashboard_nav_config jsonb;
