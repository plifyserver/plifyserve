-- Link público do Quiz Wake: um slug por conta (copiável para partilhar o quiz).

alter table public.profiles
  add column if not exists wake_quiz_public_slug text;

create unique index if not exists profiles_wake_quiz_public_slug_uidx
  on public.profiles (wake_quiz_public_slug)
  where wake_quiz_public_slug is not null;

-- Perfis já existentes (um UUID novo por linha).
update public.profiles
set wake_quiz_public_slug = 'w-' || replace(gen_random_uuid()::text, '-', '')
where wake_quiz_public_slug is null;

