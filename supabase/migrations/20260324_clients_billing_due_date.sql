-- Data prevista de cobrança / vencimento (lembretes no dashboard e financeiro)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_due_date DATE DEFAULT NULL;
