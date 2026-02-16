-- Plify: Schema inicial para SaaS leve
-- Rodar no SQL Editor do Supabase

-- Habilitar extensão uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- profiles (1:1 com auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  edits_remaining INT NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- subscriptions (controle de assinatura - futuro Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- facebook_accounts (tokens Meta Ads)
CREATE TABLE facebook_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  ad_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ad_snapshots (cache de métricas Meta)
CREATE TABLE ad_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id TEXT NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ad_account_id, date_start, date_end)
);

-- templates (templates de proposta)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  structure JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- proposals (propostas do usuário)
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_base_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'ignored')),
  content JSONB NOT NULL DEFAULT '{}',
  color_palette TEXT NOT NULL DEFAULT 'default',
  confirm_button_text TEXT NOT NULL DEFAULT 'CONFIRMAR PROPOSTA',
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  proposal_value DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

-- proposal_events (eventos de visualização/aceite)
CREATE TABLE proposal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'accept')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- company_pages (mini-site da empresa)
CREATE TABLE company_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  slogan TEXT,
  about_text TEXT,
  logo_url TEXT,
  images JSONB DEFAULT '[]',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_pages ENABLE ROW LEVEL SECURITY;

-- profiles: leitura/escrita autenticado
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- company_pages: público leitura por slug (via função)
CREATE POLICY "company_pages_select_own" ON company_pages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "company_pages_all" ON company_pages FOR ALL USING (auth.uid() = user_id);
-- Permissão de leitura pública para /empresa/[slug]
CREATE POLICY "company_pages_public_read" ON company_pages FOR SELECT USING (true);

-- proposals: dono pode tudo; leitura pública por slug via API
CREATE POLICY "proposals_own" ON proposals FOR ALL USING (auth.uid() = user_id);

-- proposal_events: dono da proposta pode inserir
CREATE POLICY "proposal_events_insert" ON proposal_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proposals p WHERE p.id = proposal_id));

-- subscriptions, facebook_accounts, ad_snapshots: somente dono
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "facebook_accounts_own" ON facebook_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ad_snapshots_own" ON ad_snapshots FOR ALL USING (auth.uid() = user_id);

-- templates: leitura pública (são fixos do sistema)
CREATE POLICY "templates_select_all" ON templates FOR SELECT USING (true);

-- Função para criar profile automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
