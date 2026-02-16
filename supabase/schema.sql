-- Docfy Database Schema
-- Execute este arquivo no SQL Editor do Supabase após criar o projeto

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de perfis de usuário (estende auth.users)
CREATE TABLE public.profiles (
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

-- Tabela de templates base (os 4 modelos)
CREATE TABLE public.template_bases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  preview_image TEXT,
  structure JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de propostas (templates editados pelo usuário)
CREATE TABLE public.proposals (
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
CREATE TABLE public.proposal_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- Índices para performance
CREATE INDEX idx_proposals_user_id ON public.proposals(user_id);
CREATE INDEX idx_proposals_slug ON public.proposals(slug);
CREATE INDEX idx_proposals_status ON public.proposals(status);
CREATE INDEX idx_proposals_created_at ON public.proposals(created_at);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário pode ler/atualizar apenas seu perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Template bases: todos podem ler
CREATE POLICY "Anyone can view template bases" ON public.template_bases
  FOR SELECT USING (true);

-- Proposals: usuário só vê/edita suas próprias
CREATE POLICY "Users can view own proposals" ON public.proposals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proposals" ON public.proposals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposals" ON public.proposals
  FOR DELETE USING (auth.uid() = user_id);

-- Proposals por slug: acesso público para visualização (apenas leitura quando status = open)
CREATE POLICY "Public can view open proposals by slug" ON public.proposals
  FOR SELECT USING (status = 'open');

-- Proposal views
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

-- Seed dos 4 templates base
INSERT INTO public.template_bases (name, slug, description, structure) VALUES
('Executive Bold', 'executive-bold', 'Design corporativo com cards em perspectiva 3D', '{"companyName":"Sua Empresa","companyPhone":"(11) 99999-9999","companyEmail":"contato@empresa.com","proposalType":"Proposta Comercial","serviceType":"Consultoria","serviceDescription":"Descrição do serviço","includes":["Item 1","Item 2","Suporte"]}'),
('Modern Gradient', 'modern-gradient', 'Gradientes vibrantes e animações suaves', '{"companyName":"Sua Empresa","companyPhone":"(11) 99999-9999","companyEmail":"contato@empresa.com","proposalType":"Proposta de Serviço","serviceType":"Design","serviceDescription":"Soluções criativas","includes":["Briefing","Revisões","Entrega PDF"]}'),
('Minimal Clean', 'minimal-clean', 'Estilo minimalista e legível', '{"companyName":"Sua Empresa","companyPhone":"(11) 99999-9999","companyEmail":"contato@empresa.com","proposalType":"Proposta","serviceType":"Desenvolvimento","serviceDescription":"Soluções tecnológicas","includes":["Análise","Desenvolvimento","Manutenção"]}'),
('Creative Showcase', 'creative-showcase', 'Galeria e efeitos visuais impactantes', '{"companyName":"Sua Empresa","companyPhone":"(11) 99999-9999","companyEmail":"contato@empresa.com","proposalType":"Proposta Criativa","serviceType":"Marketing","serviceDescription":"Estratégias que convertem","includes":["Pesquisa","Plano de ação","Métricas"]}')
ON CONFLICT (slug) DO NOTHING;
