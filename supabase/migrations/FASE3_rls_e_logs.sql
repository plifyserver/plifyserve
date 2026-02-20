-- =============================================
-- FASE 3: RLS COMPLETO + ACTIVITY LOGS
-- Execute este arquivo no Supabase SQL Editor
-- =============================================

-- =============================================
-- PARTE 1: RLS PARA PROFILES (com suporte admin)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Usuário pode ver próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuário pode atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin pode ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Admin pode atualizar todos os perfis
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- =============================================
-- PARTE 2: RLS PARA TEMPLATES (com suporte admin)
-- =============================================

-- Remover e recriar políticas
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON templates;
DROP POLICY IF EXISTS "Admins can delete all templates" ON templates;

-- Usuário pode ver próprios templates
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

-- Usuário pode criar templates com seu user_id
CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode atualizar próprios templates
CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuário pode deletar próprios templates
CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- Admin pode ver todos os templates
CREATE POLICY "Admins can view all templates" ON templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Admin pode deletar qualquer template
CREATE POLICY "Admins can delete all templates" ON templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- =============================================
-- PARTE 3: RLS PARA TEMPLATE_IMAGES (com suporte admin)
-- =============================================

-- Remover e recriar políticas
DROP POLICY IF EXISTS "Users can view images of own templates" ON template_images;
DROP POLICY IF EXISTS "Users can insert images to own templates" ON template_images;
DROP POLICY IF EXISTS "Users can delete images from own templates" ON template_images;
DROP POLICY IF EXISTS "Admins can view all images" ON template_images;
DROP POLICY IF EXISTS "Admins can delete all images" ON template_images;

-- Usuário pode ver imagens dos próprios templates
CREATE POLICY "Users can view images of own templates" ON template_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

-- Usuário pode inserir imagens nos próprios templates
CREATE POLICY "Users can insert images to own templates" ON template_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

-- Usuário pode deletar imagens dos próprios templates
CREATE POLICY "Users can delete images from own templates" ON template_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

-- Admin pode ver todas as imagens
CREATE POLICY "Admins can view all images" ON template_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Admin pode deletar qualquer imagem
CREATE POLICY "Admins can delete all images" ON template_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- =============================================
-- PARTE 4: CRIAR TABELA ACTIVITY_LOGS
-- =============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

-- RLS para activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver próprios logs
CREATE POLICY "Users can view own logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Admin pode ver todos os logs
CREATE POLICY "Admins can view all logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- =============================================
-- PARTE 5: ADICIONAR CAMPO banned EM PROFILES
-- =============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- =============================================
-- PARTE 6: ÍNDICES PARA OTIMIZAÇÃO
-- =============================================

-- Índices na tabela profiles
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índices na tabela templates
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public) WHERE is_public = true;

-- =============================================
-- PARTE 7: FUNÇÃO PARA REGISTRAR LOGS
-- =============================================

CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_activity(UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;

-- =============================================
-- PARTE 8: FUNÇÃO PARA VERIFICAR LIMITE DE TEMPLATES
-- =============================================

CREATE OR REPLACE FUNCTION check_template_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  user_account_type TEXT;
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Buscar plano e tipo de conta do usuário
  SELECT plan, account_type, templates_count 
  INTO user_plan, user_account_type, current_count
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Admin não tem limite
  IF user_account_type = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Pro não tem limite
  IF user_plan = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  -- Definir limite baseado no plano
  IF user_plan = 'essential' THEN
    max_limit := 50;
  ELSE
    max_limit := 10; -- free
  END IF;
  
  -- Verificar se está dentro do limite
  RETURN COALESCE(current_count, 0) < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_template_limit(UUID) TO authenticated;
