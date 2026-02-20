-- PASSO 1: Atualizar tabela profiles
-- Execute APENAS este código primeiro

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'usuario',
ADD COLUMN IF NOT EXISTS templates_count INTEGER DEFAULT 0;
