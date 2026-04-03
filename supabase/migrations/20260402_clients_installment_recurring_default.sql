-- Corrige clientes recorrentes que ficaram com installment_count = 1 só por migração anterior,
-- o que fazia a receita/MMR aparecer apenas no primeiro mês de vencimento.
-- NULL passa a significar "mensal contínuo" na aplicação (até 360 meses no cálculo).
-- Quem precisar de exatamente 1 parcela deve informar de novo no cadastro do cliente.
UPDATE clients
SET installment_count = NULL
WHERE payment_type = 'recorrente'
  AND installment_count = 1;
