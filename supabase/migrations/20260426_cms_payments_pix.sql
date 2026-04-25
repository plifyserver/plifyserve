-- CMS: função Pagamentos (PIX). Admin liga/desliga; utilizador gera QR estáticos.

alter table public.cms_runtime_settings
  add column if not exists payments_enabled boolean;

update public.cms_runtime_settings
set payments_enabled = false
where id = 1
  and payments_enabled is null;

alter table public.cms_runtime_settings
  alter column payments_enabled set default false;

alter table public.cms_runtime_settings
  alter column payments_enabled set not null;

-- Dados PIX do utilizador (uma linha por utilizador)
create table if not exists public.user_pix_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  pix_key text not null,
  holder_name text not null,
  merchant_city text not null default 'SAO PAULO',
  updated_at timestamptz not null default now()
);

alter table public.user_pix_settings enable row level security;

drop policy if exists user_pix_settings_own_select on public.user_pix_settings;
create policy user_pix_settings_own_select
  on public.user_pix_settings for select
  using (auth.uid() = user_id);

drop policy if exists user_pix_settings_own_insert on public.user_pix_settings;
create policy user_pix_settings_own_insert
  on public.user_pix_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists user_pix_settings_own_update on public.user_pix_settings;
create policy user_pix_settings_own_update
  on public.user_pix_settings for update
  using (auth.uid() = user_id);

drop policy if exists user_pix_settings_own_delete on public.user_pix_settings;
create policy user_pix_settings_own_delete
  on public.user_pix_settings for delete
  using (auth.uid() = user_id);

-- Cobranças / QR gerados
create table if not exists public.user_pix_charges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(14, 2) not null,
  bank_name text not null,
  payment_kind text not null check (payment_kind in ('single', 'reusable')),
  description text,
  br_code text not null,
  qr_data_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists user_pix_charges_user_id_created_at_idx
  on public.user_pix_charges (user_id, created_at desc);

alter table public.user_pix_charges enable row level security;

drop policy if exists user_pix_charges_own_select on public.user_pix_charges;
create policy user_pix_charges_own_select
  on public.user_pix_charges for select
  using (auth.uid() = user_id);

drop policy if exists user_pix_charges_own_insert on public.user_pix_charges;
create policy user_pix_charges_own_insert
  on public.user_pix_charges for insert
  with check (auth.uid() = user_id);

drop policy if exists user_pix_charges_own_delete on public.user_pix_charges;
create policy user_pix_charges_own_delete
  on public.user_pix_charges for delete
  using (auth.uid() = user_id);

drop trigger if exists trg_user_pix_settings_updated_at on public.user_pix_settings;
create trigger trg_user_pix_settings_updated_at
before update on public.user_pix_settings
for each row execute function public.set_updated_at();
