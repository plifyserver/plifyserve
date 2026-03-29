import { handleStripeWebhookPost } from '@/lib/stripe/stripe-webhook-http'

export const dynamic = 'force-dynamic'

export const POST = handleStripeWebhookPost
