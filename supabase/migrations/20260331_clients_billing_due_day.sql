-- Dia do mês do vencimento (1–31) para clientes recorrentes; lembretes repetem todo mês nesse dia.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_due_day SMALLINT DEFAULT NULL;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_billing_due_day_range;
ALTER TABLE clients ADD CONSTRAINT clients_billing_due_day_range
  CHECK (billing_due_day IS NULL OR (billing_due_day >= 1 AND billing_due_day <= 31));

UPDATE clients
SET billing_due_day = EXTRACT(DAY FROM billing_due_date::date)::smallint
WHERE payment_type = 'recorrente'
  AND billing_due_date IS NOT NULL
  AND billing_due_day IS NULL;
