-- =============================================================================
-- Promover contas a administrador (acesso ao SaaS sem assinatura Stripe)
-- =============================================================================
--
-- Pré-requisito: as pessoas já devem ter criado conta no app (existem em
-- auth.users e em public.profiles com o mesmo id).
--
-- Como usar:
-- 1. Substitua os dois e-mails abaixo pelos reais (mantenha aspas simples).
-- 2. No Supabase: Dashboard → SQL Editor → cole o script → Run.
--
-- Efeito: account_type = admin, plano admin, templates ilimitados, gate de
-- billing liberado (ver src/lib/billing-access.ts).
--
-- Depois disso, quem já é admin pode promover outros em /admin/users.
--
-- =============================================================================

UPDATE public.profiles AS p
SET
  account_type = 'admin',
  plan_type = 'admin',
  templates_limit = NULL,
  plan_status = 'active',
  updated_at = now()
FROM auth.users AS u
WHERE u.id = p.id
  AND lower(trim(u.email::text)) IN (
    lower(trim('primeiro@email.com')),
    lower(trim('segundo@email.com'))
  );
