import { getStripe } from '@/lib/stripe/stripe'
import type { CheckoutPlan } from '@/lib/stripe/stripe'

function monthlyPriceId(plan: CheckoutPlan): string {
  const id =
    plan === 'essential'
      ? process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY?.trim()
      : process.env.STRIPE_PRICE_PRO_MONTHLY?.trim()
  if (!id) {
    throw new Error(
      'Defina STRIPE_PRICE_ESSENTIAL_MONTHLY e STRIPE_PRICE_PRO_MONTHLY para alterar a assinatura.'
    )
  }
  return id
}

/**
 * Troca o preço da assinatura (upgrade/downgrade) com proration na próxima fatura.
 */
export async function changeSubscriptionPlanPrice(
  subscriptionId: string,
  targetPlan: CheckoutPlan,
  userId: string
): Promise<void> {
  const stripe = getStripe()
  const newPriceId = monthlyPriceId(targetPlan)
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const itemId = sub.items.data[0]?.id
  if (!itemId) {
    throw new Error('Assinatura Stripe sem item de preço.')
  }

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: newPriceId }],
    proration_behavior: 'create_prorations',
    metadata: {
      ...(sub.metadata ?? {}),
      supabase_user_id: userId,
      plan_type: targetPlan,
    },
  })
}
