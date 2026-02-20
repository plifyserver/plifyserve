-- =====================================================
-- FASE 5 FIX: Correção do Sistema de Propostas
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- 1. Adicionar colunas faltantes na tabela proposals
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- 2. Criar tabela proposal_views (se não existir)
CREATE TABLE IF NOT EXISTS proposal_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar tabela notifications (se não existir)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_public_slug ON proposals(public_slug);
CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal_id ON proposal_views(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_views_viewed_at ON proposal_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 5. RLS para proposal_views
ALTER TABLE proposal_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "views_select_own" ON proposal_views;
DROP POLICY IF EXISTS "views_insert_public" ON proposal_views;

CREATE POLICY "views_select_own" ON proposal_views
FOR SELECT TO authenticated
USING (
  proposal_id IN (SELECT id FROM proposals WHERE user_id = auth.uid())
);

CREATE POLICY "views_insert_public" ON proposal_views
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 6. RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_system" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" ON notifications
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 7. Atualizar RLS da tabela proposals para permitir leitura pública por slug
DROP POLICY IF EXISTS "proposals_public_read" ON proposals;

CREATE POLICY "proposals_public_read" ON proposals
FOR SELECT TO anon
USING (public_slug IS NOT NULL AND status IN ('sent', 'viewed', 'accepted', 'open'));

-- 8. Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_proposal_slug(p_title TEXT, p_client_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  random_suffix TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := LOWER(REGEXP_REPLACE(
    COALESCE(SUBSTRING(p_title FROM 1 FOR 20), 'proposta') || '-' ||
    COALESCE(SUBSTRING(p_client_name FROM 1 FOR 15), 'cliente'),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := TRIM(BOTH '-' FROM base_slug);
  
  random_suffix := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
  final_slug := base_slug || '-' || random_suffix;
  
  WHILE EXISTS (SELECT 1 FROM proposals WHERE public_slug = final_slug) LOOP
    counter := counter + 1;
    random_suffix := SUBSTRING(MD5(RANDOM()::TEXT || counter::TEXT) FROM 1 FOR 6);
    final_slug := base_slug || '-' || random_suffix;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para registrar visualização (com proteção anti-spam)
CREATE OR REPLACE FUNCTION register_proposal_view(
  p_proposal_id UUID,
  p_ip_address TEXT,
  p_user_agent TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  last_view_time TIMESTAMPTZ;
  proposal_owner_id UUID;
  proposal_title TEXT;
  proposal_client TEXT;
BEGIN
  SELECT viewed_at INTO last_view_time
  FROM proposal_views
  WHERE proposal_id = p_proposal_id AND ip_address = p_ip_address
  ORDER BY viewed_at DESC
  LIMIT 1;
  
  IF last_view_time IS NOT NULL AND last_view_time > NOW() - INTERVAL '30 seconds' THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO proposal_views (proposal_id, ip_address, user_agent, country, city, device_type)
  VALUES (p_proposal_id, p_ip_address, p_user_agent, p_country, p_city, p_device_type);
  
  UPDATE proposals
  SET views = COALESCE(views, 0) + 1,
      status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
      updated_at = NOW()
  WHERE id = p_proposal_id
  RETURNING user_id, title, client_name INTO proposal_owner_id, proposal_title, proposal_client;
  
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    proposal_owner_id,
    'proposal_viewed',
    'Proposta visualizada',
    COALESCE(proposal_client, 'Cliente') || ' visualizou sua proposta',
    jsonb_build_object(
      'proposal_id', p_proposal_id,
      'proposal_title', proposal_title,
      'client_name', proposal_client,
      'ip_address', p_ip_address,
      'viewed_at', NOW()
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Função para aceitar proposta
CREATE OR REPLACE FUNCTION accept_proposal(p_proposal_id UUID, p_ip_address TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  proposal_owner_id UUID;
  proposal_title TEXT;
  proposal_client TEXT;
BEGIN
  UPDATE proposals
  SET status = 'accepted',
      accepted_at = NOW(),
      updated_at = NOW()
  WHERE id = p_proposal_id AND status IN ('sent', 'viewed', 'open')
  RETURNING user_id, title, client_name INTO proposal_owner_id, proposal_title, proposal_client;
  
  IF proposal_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    proposal_owner_id,
    'proposal_accepted',
    'Proposta aceita!',
    COALESCE(proposal_client, 'Cliente') || ' aceitou sua proposta!',
    jsonb_build_object(
      'proposal_id', p_proposal_id,
      'proposal_title', proposal_title,
      'client_name', proposal_client,
      'accepted_at', NOW(),
      'ip_address', p_ip_address
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Gerar public_slug para propostas existentes que não têm
UPDATE proposals
SET public_slug = slug
WHERE public_slug IS NULL AND slug IS NOT NULL;

UPDATE proposals
SET public_slug = LOWER(REGEXP_REPLACE(
  COALESCE(SUBSTRING(title FROM 1 FOR 20), 'proposta') || '-' || 
  SUBSTRING(MD5(id::TEXT) FROM 1 FOR 6),
  '[^a-z0-9]+', '-', 'g'
))
WHERE public_slug IS NULL;

-- 12. Habilitar Realtime para notifications (pode dar erro se já existir, ignorar)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 13. Grants
GRANT SELECT ON proposals TO anon;
GRANT SELECT, INSERT ON proposal_views TO anon;
GRANT SELECT, INSERT ON notifications TO anon;
GRANT ALL ON proposals TO authenticated;
GRANT ALL ON proposal_views TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION generate_proposal_slug TO authenticated;
GRANT EXECUTE ON FUNCTION register_proposal_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_proposal TO anon, authenticated;
