-- =============================================
-- FIX: Recursão infinita nas políticas de profiles
-- Execute no SQL Editor do Supabase
-- =============================================
-- Causa: as políticas "Admins can view/update all profiles" fazem
-- SELECT em profiles, o que dispara RLS de novo → recursão.
-- Solução: função SECURITY DEFINER que lê profiles sem passar por RLS.
-- =============================================

-- Função que verifica se o usuário atual é admin (não dispara RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND account_type = 'admin'
  );
$$;

-- Remover políticas que causam recursão
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Recriar usando a função (sem SELECT direto em profiles na policy)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());
