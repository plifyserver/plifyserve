-- Entidades no estilo Base44: AppSettings, AdCampaigns, Contracts, Finance, Projects, Tasks, Reports, Kanban, Wello
-- e tabela clients + campos extras em clients e events

-- 0) Tabela clients (caso a migration 005 não tenha sido rodada)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'archived')),
  company TEXT,
  notes TEXT,
  source TEXT,
  responsible TEXT,
  kanban_stage TEXT DEFAULT 'lead',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(user_id, status);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_own" ON clients;
CREATE POLICY "clients_own" ON clients FOR ALL USING (auth.uid() = user_id);

-- 1) Clientes: adicionar colunas extras (se já existia a tabela sem elas)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS responsible TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS kanban_stage TEXT DEFAULT 'lead';

-- 2) Events (agenda): adicionar client_id, client_name, type
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'meeting' CHECK (type IN ('meeting', 'call', 'presentation', 'other'));

-- 3) AppSettings (personalização por usuário)
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name TEXT,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E293B',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  custom_domain TEXT,
  hide_branding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_own" ON app_settings FOR ALL USING (auth.uid() = user_id);

-- 4) AdCampaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'google', 'other')),
  investment DECIMAL(12,2),
  leads INT,
  conversions INT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  account_link TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ad_campaigns_user ON ad_campaigns(user_id);
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_campaigns_own" ON ad_campaigns FOR ALL USING (auth.uid() = user_id);

-- 5) Contracts (documentos/contratos)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  signatories JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'rejected')),
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_contracts_user ON contracts(user_id);
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_own" ON contracts FOR ALL USING (auth.uid() = user_id);

-- 6) FinanceTransactions
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  project_id UUID,
  project_name TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_finance_user ON finance_transactions(user_id);
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_transactions_own" ON finance_transactions FOR ALL USING (auth.uid() = user_id);

-- 7) Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed')),
  description TEXT,
  start_date DATE,
  end_date DATE,
  responsible TEXT,
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_projects_user ON projects(user_id);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_own" ON projects FOR ALL USING (auth.uid() = user_id);

-- 8) Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  responsible TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tasks_user ON tasks(user_id);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_own" ON tasks FOR ALL USING (auth.uid() = user_id);

-- 9) Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('proposals', 'projects', 'ads', 'finance', 'custom')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  period_start DATE,
  period_end DATE,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_reports_user ON reports(user_id);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_own" ON reports FOR ALL USING (auth.uid() = user_id);

-- 10) KanbanStages
CREATE TABLE IF NOT EXISTS kanban_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_kanban_stages_user ON kanban_stages(user_id);
ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kanban_stages_own" ON kanban_stages FOR ALL USING (auth.uid() = user_id);

-- 11) WelloBoards
CREATE TABLE IF NOT EXISTS wello_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  background_color TEXT DEFAULT '#3B82F6',
  background_image TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wello_boards_user ON wello_boards(user_id);
ALTER TABLE wello_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wello_boards_own" ON wello_boards FOR ALL USING (auth.uid() = user_id);

-- 12) WelloLists
CREATE TABLE IF NOT EXISTS wello_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES wello_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wello_lists_board ON wello_lists(board_id);
ALTER TABLE wello_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wello_lists_own" ON wello_lists FOR ALL USING (
  EXISTS (SELECT 1 FROM wello_boards b WHERE b.id = board_id AND b.user_id = auth.uid())
);

-- 13) WelloCards
CREATE TABLE IF NOT EXISTS wello_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES wello_boards(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES wello_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  labels JSONB DEFAULT '[]',
  cover_color TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_wello_cards_list ON wello_cards(list_id);
ALTER TABLE wello_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wello_cards_own" ON wello_cards FOR ALL USING (
  EXISTS (SELECT 1 FROM wello_boards b WHERE b.id = board_id AND b.user_id = auth.uid())
);
