-- Perguntas do quiz Wake configuráveis por perfil + respostas flexíveis nos leads.

alter table public.profiles
  add column if not exists wake_quiz_questions jsonb;

alter table public.wake_quiz_leads
  add column if not exists quiz_answers jsonb not null default '{}'::jsonb;

comment on column public.profiles.wake_quiz_questions is 'Definição das perguntas (JSON). Null = defaults da app.';
comment on column public.wake_quiz_leads.quiz_answers is 'Respostas ao quiz: mapa field -> texto.';
