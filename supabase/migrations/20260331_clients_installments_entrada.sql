-- Parcelas (recorrente) e entrada (valor único no mês do cadastro)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS installment_count INTEGER DEFAULT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS down_payment NUMERIC(12, 2) DEFAULT NULL;

UPDATE clients
SET installment_count = 1
WHERE payment_type = 'recorrente' AND installment_count IS NULL;
