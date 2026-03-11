-- Kanban: usuário cria até 5 boards; cada board tem até 15 etapas (stages) e cards que podem ser arrastados

-- 1) Tabela de boards (máx. 5 por usuário)
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_kanban_boards_user ON kanban_boards(user_id);
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kanban_boards_own" ON kanban_boards FOR ALL USING (auth.uid() = user_id);

-- 2) Stages passam a pertencer a um board (máx. 15 por board)
ALTER TABLE kanban_stages ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_kanban_stages_board ON kanban_stages(board_id);

-- 3) Cards dentro de um board/etapa (usuário digita e arrasta)
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES kanban_stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_kanban_cards_board ON kanban_cards(board_id);
CREATE INDEX idx_kanban_cards_stage ON kanban_cards(stage_id);
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kanban_cards_own" ON kanban_cards FOR ALL USING (
  EXISTS (SELECT 1 FROM kanban_boards b WHERE b.id = board_id AND b.user_id = auth.uid())
);
