-- Bases que já rodaram uma versão antiga de 20260419_cms_runtime_settings.sql
-- (tabela existia sem esta coluna). CREATE TABLE IF NOT EXISTS não adiciona colunas novas.

alter table public.cms_runtime_settings
  add column if not exists feedback_button_enabled boolean not null default false;

insert into public.cms_runtime_settings (id, active_version, feedback_button_enabled)
values (1, 'v1', false)
on conflict (id) do nothing;
