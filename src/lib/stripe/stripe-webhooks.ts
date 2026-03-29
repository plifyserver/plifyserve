import type Stripe from 'stripe'
import { getStripe } from './stripe'
import { PIX_ACCESS_MONTHS } from '@/lib/stripe/pix-access-months'
import { createServiceRoleClient } from '@/lib/supabase/server'

function subscriptionPeriodEndUnix(sub: Stripe.Subscription): number {
  const first = sub.items?.data?.[0]
  if (first?.current_period_end) return first.current_period_end
  return sub.billing_cycle_anchor
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export async function processStripeEvent(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
    default:
      return { success: true, message: `Evento ignorado: ${event.type}` }
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<{ success: boolean; message: string }> {
  const userId = session.metadata?.supabase_user_id
  const planType = session.metadata?.plan_type as 'essential' | 'pro' | undefined
  if (!userId || !planType) {
    return { success: false, message: 'Metadata ausente na sessão' }
  }

  const supabase = createServiceRoleClient()
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

  if (session.mode === 'subscription') {
    const subId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    if (!subId) {
      return { success: false, message: 'Assinatura não encontrada na sessão' }
    }
    const stripe = getStripe()
    const sub = await stripe.subscriptions.retrieve(subId)
    const periodEnd = new Date(subscriptionPeriodEndUnix(sub) * 1000).toISOString()

    const { error } = await supabase
      .from('profiles')
      .update({
        plan_type: planType,
        plan: planType === 'pro' ? 'pro' : 'free',
        templates_limit: planType === 'pro' ? null : 10,
        plan_status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subId,
        subscription_id: subId,
        plan_started_at: new Date().toISOString(),
        plan_expires_at: periodEnd,
        payment_provider: 'stripe',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('[Stripe webhook] profiles update:', error)
      return { success: false, message: error.message }
    }
    return { success: true, message: 'Assinatura ativada' }
  }

  if (session.mode === 'payment') {
    const expires = addMonths(new Date(), PIX_ACCESS_MONTHS).toISOString()
    const { error } = await supabase
      .from('profiles')
      .update({
        plan_type: planType,
        plan: planType === 'pro' ? 'pro' : 'free',
        templates_limit: planType === 'pro' ? null : 10,
        plan_status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        subscription_id: null,
        plan_started_at: new Date().toISOString(),
        plan_expires_at: expires,
        payment_provider: 'stripe',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('[Stripe webhook] profiles update (PIX):', error)
      return { success: false, message: error.message }
    }
    return { success: true, message: 'Pagamento PIX registrado' }
  }

  return { success: true, message: 'Modo de sessão não tratado' }
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription
): Promise<{ success: boolean; message: string }> {
  const userId = sub.metadata?.supabase_user_id
  if (!userId) {
    return { success: true, message: 'Subscription sem user id' }
  }

  const periodEnd = new Date(subscriptionPeriodEndUnix(sub) * 1000).toISOString()
  let planStatus: 'active' | 'inactive' | 'trial' | 'cancelled' = 'active'
  if (sub.status === 'past_due' || sub.status === 'unpaid') planStatus = 'inactive'
  if (sub.status === 'canceled') planStatus = 'cancelled'

  const metaPlan = sub.metadata?.plan_type as 'essential' | 'pro' | undefined

  const supabase = createServiceRoleClient()
  const patch: Record<string, unknown> = {
    plan_status: planStatus,
    plan_expires_at: periodEnd,
    updated_at: new Date().toISOString(),
  }
  if (metaPlan === 'essential' || metaPlan === 'pro') {
    patch.plan_type = metaPlan
    patch.plan = metaPlan === 'pro' ? 'pro' : 'free'
    patch.templates_limit = metaPlan === 'pro' ? null : 10
  }

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)

  if (error) {
    console.error('[Stripe webhook] subscription updated:', error)
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Assinatura sincronizada' }
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription
): Promise<{ success: boolean; message: string }> {
  const userId = sub.metadata?.supabase_user_id
  if (!userId) {
    return { success: true, message: 'Subscription sem user id' }
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      plan_type: 'essential',
      plan: 'free',
      templates_limit: 10,
      plan_status: 'cancelled',
      stripe_subscription_id: null,
      subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[Stripe webhook] subscription deleted:', error)
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Assinatura cancelada no perfil' }
}
