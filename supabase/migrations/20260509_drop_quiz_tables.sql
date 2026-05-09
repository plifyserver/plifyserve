-- Remove o schema legado do recurso Quiz (dados e RLS desaparecem com as tabelas).

drop table if exists public.quiz_responses cascade;
drop table if exists public.quiz_questions cascade;
drop table if exists public.quizzes cascade;
