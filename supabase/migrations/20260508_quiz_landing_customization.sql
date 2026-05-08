-- QUIZ: personalização da tela inicial (hero)

alter table public.quizzes
  add column if not exists hero_badge_emoji text,
  add column if not exists hero_badge_text text,
  add column if not exists hero_title_top text,
  add column if not exists hero_title_bottom text,
  add column if not exists hero_description text,
  add column if not exists hero_floating_items jsonb not null default '[]'::jsonb,
  add column if not exists start_button_label text,
  add column if not exists social_proof_text text;

