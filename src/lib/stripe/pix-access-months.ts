/**
 * Meses de acesso após pagamento único via PIX (valor cobrado = preço mensal do plano × meses).
 * No servidor use STRIPE_PIX_ACCESS_MONTHS; no cliente use NEXT_PUBLIC_STRIPE_PIX_ACCESS_MONTHS (mesmo valor).
 */
export const PIX_ACCESS_MONTHS = Number(
  process.env.STRIPE_PIX_ACCESS_MONTHS ||
    process.env.NEXT_PUBLIC_STRIPE_PIX_ACCESS_MONTHS ||
    1
)
