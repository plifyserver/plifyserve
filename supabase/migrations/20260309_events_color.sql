-- Adiciona coluna color aos eventos para personalização da cor no calendário
ALTER TABLE events ADD COLUMN IF NOT EXISTS color TEXT;
