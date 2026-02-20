-- =============================================
-- PARTE 1: ATUALIZAR TABELA PROFILES
-- Execute esta parte primeiro
-- =============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'usuario',
ADD COLUMN IF NOT EXISTS templates_count INTEGER DEFAULT 0;

-- Adicionar constraint separadamente (ignora se já existir)
DO $$ 
BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_account_type_check 
    CHECK (account_type IN ('admin', 'socio', 'usuario'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- PARTE 2: CRIAR TABELA TEMPLATES
-- =============================================

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- =============================================
-- PARTE 3: CRIAR TABELA TEMPLATE_IMAGES
-- =============================================

CREATE TABLE IF NOT EXISTS template_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_images_template_id ON template_images(template_id);

-- =============================================
-- PARTE 4: RLS PARA TEMPLATES
-- =============================================

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;

-- Criar novas políticas
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PARTE 5: RLS PARA TEMPLATE_IMAGES
-- =============================================

ALTER TABLE template_images ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view images of own templates" ON template_images;
DROP POLICY IF EXISTS "Users can insert images to own templates" ON template_images;
DROP POLICY IF EXISTS "Users can delete images from own templates" ON template_images;

-- Criar novas políticas
CREATE POLICY "Users can view images of own templates" ON template_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images to own templates" ON template_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images from own templates" ON template_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE templates.id = template_images.template_id 
      AND templates.user_id = auth.uid()
    )
  );

-- =============================================
-- PARTE 6: FUNÇÕES PARA CONTAGEM DE TEMPLATES
-- =============================================

CREATE OR REPLACE FUNCTION increment_templates_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET templates_count = COALESCE(templates_count, 0) + 1,
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_templates_count(user_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET templates_count = GREATEST(0, COALESCE(templates_count, 0) - 1),
      updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_templates_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_templates_count(UUID) TO authenticated;
