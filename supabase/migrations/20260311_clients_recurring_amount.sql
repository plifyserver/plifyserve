-- Valor mensal fixo (R$) para clientes recorrentes
ALTER TABLE clients ADD COLUMN IF NOT EXISTS recurring_amount NUMERIC(12,2) DEFAULT NULL;
