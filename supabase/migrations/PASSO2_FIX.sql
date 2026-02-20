-- PASSO 2 FIX: Verificar e recriar tabela templates
-- Execute este código

-- Primeiro, vamos verificar se a tabela existe e dropar se necessário
DROP TABLE IF EXISTS template_images CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Agora criar a tabela do zero
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice
CREATE INDEX idx_templates_user_id ON templates(user_id);
