-- =============================================
-- EXECUTE ESTE ARQUIVO AGORA
-- (depois de ter executado o storage)
-- =============================================

-- PARTE 1: Atualizar tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'usuario',
ADD COLUMN IF NOT EXISTS templates_count INTEGER DEFAULT 0;

-- PARTE 2: Criar tabela templates (se não existir)
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

-- PARTE 3: Criar índice
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- PARTE 4: Criar tabela template_images
CREATE TABLE IF NOT EXISTS template_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_images_template_id ON template_images(template_id);

-- PARTE 5: Habilitar RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_images ENABLE ROW LEVEL SECURITY;

-- PARTE 6: Remover políticas antigas (ignorar erros)
DROP POLICY IF EXISTS "Users can view own templates" ON templates;
DROP POLICY IF EXISTS "Users can insert own templates" ON templates;
DROP POLICY IF EXISTS "Users can update own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON templates;
DROP POLICY IF EXISTS "Users can view images of own templates" ON template_images;
DROP POLICY IF EXISTS "Users can insert images to own templates" ON template_images;
DROP POLICY IF EXISTS "Users can delete images from own templates" ON template_images;

-- PARTE 7: Criar políticas para templates
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- PARTE 8: Criar políticas para template_images
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

-- PARTE 9: Criar funções
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

-- PARTE 10: Permissões
GRANT EXECUTE ON FUNCTION increment_templates_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_templates_count(UUID) TO authenticated;
