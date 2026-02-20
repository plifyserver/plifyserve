-- =====================================================
-- FASE 4: Sistema de Contratos Completo
-- Execute este arquivo no SQL Editor do Supabase
-- =====================================================

-- 1. Criar bucket para contratos (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas do bucket contracts
DROP POLICY IF EXISTS "contracts_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "contracts_read_policy" ON storage.objects;
DROP POLICY IF EXISTS "contracts_delete_policy" ON storage.objects;

CREATE POLICY "contracts_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "contracts_read_policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'contracts');

CREATE POLICY "contracts_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'contracts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Atualizar tabela contracts (adicionar campos se não existirem)
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- 4. Criar tabela contract_signatures
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  cpf TEXT,
  birth_date DATE,
  signature_image TEXT,
  ip_address TEXT,
  location JSONB,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_expires_at ON contracts(expires_at);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);

-- 6. RLS para contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contracts_select_own" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_own" ON contracts;
DROP POLICY IF EXISTS "contracts_update_own" ON contracts;
DROP POLICY IF EXISTS "contracts_delete_own" ON contracts;
DROP POLICY IF EXISTS "contracts_public_read" ON contracts;

CREATE POLICY "contracts_select_own" ON contracts
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "contracts_insert_own" ON contracts
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "contracts_update_own" ON contracts
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "contracts_delete_own" ON contracts
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Permitir leitura pública para página de assinatura (por ID específico)
CREATE POLICY "contracts_public_read" ON contracts
FOR SELECT TO anon
USING (true);

-- 7. RLS para contract_signatures
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signatures_select" ON contract_signatures;
DROP POLICY IF EXISTS "signatures_insert" ON contract_signatures;

-- Usuário autenticado pode ver assinaturas dos seus contratos
CREATE POLICY "signatures_select" ON contract_signatures
FOR SELECT TO authenticated
USING (
  contract_id IN (
    SELECT id FROM contracts WHERE user_id = auth.uid()
  )
);

-- Qualquer pessoa pode inserir assinatura (para página pública)
CREATE POLICY "signatures_insert" ON contract_signatures
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 8. Função para verificar e atualizar contratos expirados
CREATE OR REPLACE FUNCTION check_expired_contracts()
RETURNS void AS $$
BEGIN
  UPDATE contracts
  SET status = 'expired'
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND status NOT IN ('signed', 'expired');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para criar contrato com expiração automática (5 dias)
CREATE OR REPLACE FUNCTION create_contract_with_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL AND NEW.status != 'draft' THEN
    NEW.expires_at := NOW() + INTERVAL '5 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contract_expiration_trigger ON contracts;
CREATE TRIGGER contract_expiration_trigger
BEFORE INSERT OR UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION create_contract_with_expiration();

-- 10. Grant permissions
GRANT SELECT ON contracts TO anon;
GRANT SELECT, INSERT ON contract_signatures TO anon;
GRANT ALL ON contracts TO authenticated;
GRANT ALL ON contract_signatures TO authenticated;
