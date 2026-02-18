-- Docfy Database Schema
-- Execute este arquivo no SQL Editor do Supabase após criar o projeto

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuário (estende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  edits_remaining INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de templates base
CREATE TABLE IF NOT EXISTS public.template_bases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  preview_image TEXT,
  structure JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de propostas (templates editados pelo usuário)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_base_id UUID REFERENCES public.template_bases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'ignored')),
  content JSONB NOT NULL,
  color_palette TEXT DEFAULT 'default',
  confirm_button_text TEXT DEFAULT 'CONFIRMAR PROPOSTA',
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  proposal_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Tabela de acessos às propostas (para tracking)
CREATE TABLE IF NOT EXISTS public.proposal_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_slug ON public.proposals(slug);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário pode ler/atualizar apenas seu perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Template bases: todos podem ler
DROP POLICY IF EXISTS "Anyone can view template bases" ON public.template_bases;
CREATE POLICY "Anyone can view template bases" ON public.template_bases
  FOR SELECT USING (true);

-- Proposals: usuário só vê/edita suas próprias
DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposals;
CREATE POLICY "Users can view own proposals" ON public.proposals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own proposals" ON public.proposals;
CREATE POLICY "Users can insert own proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;
CREATE POLICY "Users can update own proposals" ON public.proposals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;
CREATE POLICY "Users can delete own proposals" ON public.proposals
  FOR DELETE USING (auth.uid() = user_id);

-- Proposals por slug: acesso público para visualização (apenas leitura quando status = open)
DROP POLICY IF EXISTS "Public can view open proposals by slug" ON public.proposals;
CREATE POLICY "Public can view open proposals by slug" ON public.proposals
  FOR SELECT USING (status = 'open');

-- Proposal views
DROP POLICY IF EXISTS "Anyone can insert proposal views" ON public.proposal_views;
CREATE POLICY "Anyone can insert proposal views" ON public.proposal_views
  FOR INSERT WITH CHECK (true);

-- Função para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil no signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed: 1 template base
INSERT INTO public.template_bases (name, slug, description, structure) VALUES
('Executive Bold', 'executive-bold', 'Design corporativo com cards em perspectiva 3D', '{"companyName":"Sua Empresa","companyPhone":"(11) 99999-9999","companyEmail":"contato@empresa.com","proposalType":"Proposta Comercial","serviceType":"Consultoria","serviceDescription":"Descrição do serviço","includes":["Item 1","Item 2","Suporte"]}')
ON CONFLICT (slug) DO NOTHING;

-- ========== Storage (buckets) – necessário para upload de fotos, logo e galeria ==========
-- Se aparecer "Bucket not found" ao enviar foto do produto/galeria/logo, execute este bloco no SQL Editor do Supabase.
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-assets', 'proposal-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para proposal-assets (galeria, foto do produto, logo da proposta)
DROP POLICY IF EXISTS "proposal_assets_upload_own" ON storage.objects;
CREATE POLICY "proposal_assets_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'proposal-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "proposal_assets_public_read" ON storage.objects;
CREATE POLICY "proposal_assets_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'proposal-assets');

DROP POLICY IF EXISTS "proposal_assets_update_own" ON storage.objects;
CREATE POLICY "proposal_assets_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'proposal-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "proposal_assets_delete_own" ON storage.objects;
CREATE POLICY "proposal_assets_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'proposal-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Políticas para avatars (logo da empresa no perfil / configurações)
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ========== Assinaturas digitais ==========
CREATE TABLE IF NOT EXISTS public.signature_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_whatsapp TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed')),
  signature_data_url TEXT,
  signed_at TIMESTAMPTZ,
  signed_client_at TEXT,
  signed_latitude DECIMAL(10, 7),
  signed_longitude DECIMAL(10, 7),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signature_documents_user_id ON public.signature_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_signature_documents_slug ON public.signature_documents(slug);
CREATE INDEX IF NOT EXISTS idx_signature_documents_status ON public.signature_documents(status);

ALTER TABLE public.signature_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own signature documents" ON public.signature_documents;
CREATE POLICY "Users can view own signature documents" ON public.signature_documents
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own signature documents" ON public.signature_documents;
CREATE POLICY "Users can insert own signature documents" ON public.signature_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own signature documents" ON public.signature_documents;
CREATE POLICY "Users can update own signature documents" ON public.signature_documents
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own signature documents" ON public.signature_documents;
CREATE POLICY "Users can delete own signature documents" ON public.signature_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Público pode ler por slug (para página de assinatura)
DROP POLICY IF EXISTS "Public can view signature doc by slug" ON public.signature_documents;
CREATE POLICY "Public can view signature doc by slug" ON public.signature_documents
  FOR SELECT USING (true);

-- Atualização por slug é feita via API (service role); anon não atualiza direto.

-- Bucket para PDFs de assinatura
INSERT INTO storage.buckets (id, name, public)
VALUES ('signature-docs', 'signature-docs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "signature_docs_upload_own" ON storage.objects;
CREATE POLICY "signature_docs_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'signature-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "signature_docs_public_read" ON storage.objects;
CREATE POLICY "signature_docs_public_read" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'signature-docs');

-- Migração: se a tabela já existia sem local/horário do assinante, adicione as colunas
ALTER TABLE public.signature_documents ADD COLUMN IF NOT EXISTS signed_client_at TEXT;
ALTER TABLE public.signature_documents ADD COLUMN IF NOT EXISTS signed_latitude DECIMAL(10, 7);
ALTER TABLE public.signature_documents ADD COLUMN IF NOT EXISTS signed_longitude DECIMAL(10, 7);
