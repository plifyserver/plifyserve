-- QUIZ: personalização da tela de obrigado (resultado)

alter table public.quizzes
  add column if not exists thanks_badge_emoji text,
  add column if not exists thanks_badge_text text,
  add column if not exists thanks_title_top text,
  add column if not exists thanks_title_bottom text,
  add column if not exists thanks_highlights jsonb not null default '[]'::jsonb,
  add column if not exists thanks_callout_title text,
  add column if not exists thanks_callout_text text;

