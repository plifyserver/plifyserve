-- Botão de feedback: desligado por padrão até o admin ativar (CMS > Botão Feedback).
-- Ajusta instalações que já tinham default/valor true.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cms_runtime_settings'
      and column_name = 'feedback_button_enabled'
  ) then
    execute 'alter table public.cms_runtime_settings alter column feedback_button_enabled set default false';
    execute 'update public.cms_runtime_settings set feedback_button_enabled = false where id = 1';
  end if;
end $$;
