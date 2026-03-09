-- Adiciona tipo de pagamento ao cliente: recorrente (mensal) ou pontual (único)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'pontual' CHECK (payment_type IN ('recorrente', 'pontual'));
