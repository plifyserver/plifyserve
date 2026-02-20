-- PASSO 3: Criar tabela template_images
-- Execute APENAS este código

CREATE TABLE IF NOT EXISTS template_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_images_template_id ON template_images(template_id);
