-- Perfil: especialização (áreas clicáveis + campos livres)

alter table public.profiles
  add column if not exists practice_areas text[] not null default '{}';

alter table public.profiles
  add column if not exists practice_area_extra text;

alter table public.profiles
  add column if not exists specialties text;

alter table public.profiles
  add column if not exists niches text;
