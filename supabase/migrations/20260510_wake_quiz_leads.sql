-- Leads do quiz Wake (integração Base44-style → Supabase, por conta do usuário).

create table if not exists public.wake_quiz_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  whatsapp text,
  email text,
  perfil text,
  marketing_atual text,
  faturamento text,
  objetivo text,
  dificuldade text,
  status text not null default 'novo'
    check (status in (
      'novo',
      'em_contato',
      'reuniao_agendada',
      'cliente',
      'perdido'
    )),
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_wake_quiz_leads_user_created
  on public.wake_quiz_leads(user_id, created_at desc);

alter table public.wake_quiz_leads enable row level security;

drop policy if exists wake_quiz_leads_own_all on public.wake_quiz_leads;
create policy wake_quiz_leads_own_all
  on public.wake_quiz_leads
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
