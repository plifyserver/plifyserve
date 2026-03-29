import Stripe from 'stripe'
import { PLANS, type PlanType } from '@/services/billing'
import { PIX_ACCESS_MONTHS } from '@/lib/stripe/pix-access-months'

export { PIX_ACCESS_MONTHS }

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }
    stripeSingleton = new Stripe(key)
  }
  return stripeSingleton
}

export type CheckoutPlan = Exclude<PlanType, 'admin'>
export type CheckoutPaymentKind = 'pix' | 'card'

export interface CreatePlifyCheckoutParams {
  userId: string
  email: string
  customerId: string | null
  plan: CheckoutPlan
  paymentKind: CheckoutPaymentKind
  successUrl: string
  cancelUrl: string
}

export interface PlifyCheckoutResult {
  sessionId: string
  url: string | null
}

function monthlyPriceId(plan: CheckoutPlan): string | null {
  if (plan === 'essential') {
    return process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY?.trim() || null
  }
  return process.env.STRIPE_PRICE_PRO_MONTHLY?.trim() || null
}

function pixPriceId(plan: CheckoutPlan): string | null {
  if (plan === 'essential') {
    return process.env.STRIPE_PRICE_ESSENTIAL_PIX?.trim() || null
  }
  return process.env.STRIPE_PRICE_PRO_PIX?.trim() || null
}

export async function createPlifyCheckoutSession(
  params: CreatePlifyCheckoutParams
): Promise<PlifyCheckoutResult> {
  const stripe = getStripe()
  const meta = {
    supabase_user_id: params.userId,
    plan_type: params.plan,
    billing_kind: params.paymentKind,
  } as const

  const baseSession: Stripe.Checkout.SessionCreateParams = {
    locale: 'pt-BR',
    client_reference_id: params.userId,
    metadata: { ...meta },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  }

  if (params.customerId) {
    baseSession.customer = params.customerId
  } else {
    baseSession.customer_email = params.email
  }

  if (params.paymentKind === 'card') {
    const price = monthlyPriceId(params.plan)
    if (!price) {
      throw new Error(
        'Defina STRIPE_PRICE_ESSENTIAL_MONTHLY e STRIPE_PRICE_PRO_MONTHLY no ambiente (preços mensais no Stripe).'
      )
    }
    const session = await stripe.checkout.sessions.create({
      ...baseSession,
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      subscription_data: {
        metadata: {
          supabase_user_id: params.userId,
          plan_type: params.plan,
        },
      },
    })
    return { sessionId: session.id, url: session.url }
  }

  const planDef = PLANS[params.plan]
  const pixCents = Math.round(planDef.price * PIX_ACCESS_MONTHS * 100)
  const existingPix = pixPriceId(params.plan)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = existingPix
    ? [{ price: existingPix, quantity: 1 }]
    : [
        {
          price_data: {
            currency: 'brl',
            unit_amount: pixCents,
            product_data: {
              name:
                PIX_ACCESS_MONTHS === 1
                  ? `Plify ${planDef.name} — PIX (1 mês)`
                  : `Plify ${planDef.name} — PIX (${PIX_ACCESS_MONTHS} meses)`,
              description:
                PIX_ACCESS_MONTHS === 1
                  ? 'Pagamento único via PIX — 1 mês de acesso'
                  : `Pagamento único via PIX — ${PIX_ACCESS_MONTHS} meses de acesso`,
            },
          },
          quantity: 1,
        },
      ]

  const session = await stripe.checkout.sessions.create({
    ...baseSession,
    mode: 'payment',
    line_items: lineItems,
    payment_method_types: ['pix'],
  })

  return { sessionId: session.id, url: session.url }
}
