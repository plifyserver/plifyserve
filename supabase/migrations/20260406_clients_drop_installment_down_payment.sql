-- Remove parcelas limitadas e entrada; recorrente passa a ser só valor de parcela + dia de vencimento
ALTER TABLE clients DROP COLUMN IF EXISTS installment_count;
ALTER TABLE clients DROP COLUMN IF EXISTS down_payment;
