-- Sidebar style runtime flag: default (atual) / clean (novo visual tipo CMS).
-- Usado no frontend via /api/cms/runtime e alternado apenas por admin.

alter table public.cms_runtime_settings
  add column if not exists sidebar_style text;

update public.cms_runtime_settings
set sidebar_style = 'default'
where id = 1
  and (sidebar_style is null or sidebar_style not in ('default', 'clean'));

alter table public.cms_runtime_settings
  alter column sidebar_style set default 'default';

alter table public.cms_runtime_settings
  alter column sidebar_style set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cms_runtime_settings_sidebar_style_check'
  ) then
    alter table public.cms_runtime_settings
      add constraint cms_runtime_settings_sidebar_style_check
      check (sidebar_style in ('default', 'clean'));
  end if;
end $$;

