-- IP e navegador utilizados na assinatura (assinaturas digitais)
ALTER TABLE signature_documents ADD COLUMN IF NOT EXISTS signed_ip TEXT;
ALTER TABLE signature_documents ADD COLUMN IF NOT EXISTS signed_user_agent TEXT;
