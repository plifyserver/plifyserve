-- Personalização da tela inicial do Quiz Wake (logo + textos + estilo do badge).

alter table public.profiles
  add column if not exists wake_quiz_logo_url text;

alter table public.profiles
  add column if not exists wake_quiz_hero jsonb not null default '{}'::jsonb;
