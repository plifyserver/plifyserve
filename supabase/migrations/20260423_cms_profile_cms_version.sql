-- CMS do perfil: v1 = sem bloco Especialização; v2 = com Especialização (tempo real com cms_runtime_settings).

alter table public.cms_runtime_settings
  add column if not exists profile_cms_version text;

update public.cms_runtime_settings
set profile_cms_version = 'v1'
where id = 1
  and (profile_cms_version is null or profile_cms_version not in ('v1', 'v2'));

alter table public.cms_runtime_settings
  alter column profile_cms_version set default 'v1';

alter table public.cms_runtime_settings
  alter column profile_cms_version set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cms_runtime_settings_profile_cms_version_check'
  ) then
    alter table public.cms_runtime_settings
      add constraint cms_runtime_settings_profile_cms_version_check
      check (profile_cms_version in ('v1', 'v2'));
  end if;
end $$;
