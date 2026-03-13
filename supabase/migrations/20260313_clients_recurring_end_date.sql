-- Data até quando o valor recorrente do cliente entra no MMR (após essa data não conta mais)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS recurring_end_date DATE DEFAULT NULL;
