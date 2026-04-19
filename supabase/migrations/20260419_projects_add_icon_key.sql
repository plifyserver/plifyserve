-- Permite escolher ícone por projeto (usado no dashboard e na listagem de projetos).
alter table if exists public.projects
add column if not exists icon_key text;

-- default leve para projetos já existentes
update public.projects
set icon_key = 'folder'
where icon_key is null;

