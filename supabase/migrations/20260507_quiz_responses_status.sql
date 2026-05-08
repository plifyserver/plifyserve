-- QUIZ: status de atendimento para leads/respostas

alter table public.quiz_responses
  add column if not exists status text not null default 'waiting',
  add column if not exists handled_at timestamptz,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quiz_responses_status_check'
  ) then
    alter table public.quiz_responses
      add constraint quiz_responses_status_check
      check (status in ('waiting', 'in_progress', 'attended', 'archived'));
  end if;
end $$;

-- Permitir que o dono do quiz atualize status/anotações
drop policy if exists quiz_responses_owner_update on public.quiz_responses;
create policy quiz_responses_owner_update
  on public.quiz_responses
  for update
  using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.user_id = auth.uid()
    )
  );

