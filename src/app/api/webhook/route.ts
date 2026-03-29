import { handleStripeWebhookPost } from '@/lib/stripe/stripe-webhook-http'

/**
 * Endpoint público do webhook Stripe (URL de produção: https://plify360.com.br/api/webhook).
 * Comportamento idêntico a POST /api/stripe/webhook — use um dos dois no painel do Stripe.
 */
export const dynamic = 'force-dynamic'

export const POST = handleStripeWebhookPost
