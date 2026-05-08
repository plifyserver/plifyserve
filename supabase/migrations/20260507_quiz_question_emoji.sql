-- QUIZ: emoji por pergunta (para UI estilo Base44)

alter table public.quiz_questions
  add column if not exists emoji text;

