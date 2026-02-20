/**
 * Stripe Integration - Preparação para integração futura
 * 
 * Este arquivo contém a estrutura base para integração com Stripe.
 * A implementação real será feita quando o Stripe for ativado.
 */

// TODO: Adicionar Stripe SDK quando for implementar
// import Stripe from 'stripe'

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

export interface CreateCheckoutSessionParams {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}

export interface CheckoutSession {
  id: string
  url: string
  customerId: string
}

export interface StripeCustomer {
  id: string
  email: string
  name?: string
}

export interface StripeSubscription {
  id: string
  status: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

// TODO: Implementar quando ativar Stripe
export async function createCheckoutSession(
  _params: CreateCheckoutSessionParams
): Promise<CheckoutSession | null> {
  console.log('[Stripe] createCheckoutSession - não implementado ainda')
  
  // TODO: Implementar lógica real
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const session = await stripe.checkout.sessions.create({
  //   customer_email: params.customerEmail,
  //   line_items: [{ price: params.priceId, quantity: 1 }],
  //   mode: 'subscription',
  //   success_url: params.successUrl,
  //   cancel_url: params.cancelUrl,
  //   metadata: { userId: params.userId },
  // })
  
  return null
}

// TODO: Implementar quando ativar Stripe
export async function createCustomer(
  _email: string,
  _name?: string
): Promise<StripeCustomer | null> {
  console.log('[Stripe] createCustomer - não implementado ainda')
  
  // TODO: Implementar lógica real
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const customer = await stripe.customers.create({ email, name })
  
  return null
}

// TODO: Implementar quando ativar Stripe
export async function getSubscription(
  _subscriptionId: string
): Promise<StripeSubscription | null> {
  console.log('[Stripe] getSubscription - não implementado ainda')
  
  // TODO: Implementar lógica real
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
  return null
}

// TODO: Implementar quando ativar Stripe
export async function cancelSubscription(
  _subscriptionId: string
): Promise<boolean> {
  console.log('[Stripe] cancelSubscription - não implementado ainda')
  
  // TODO: Implementar lógica real
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // await stripe.subscriptions.cancel(subscriptionId)
  
  return false
}

// TODO: Implementar quando ativar Stripe
export async function createBillingPortalSession(
  _customerId: string,
  _returnUrl: string
): Promise<string | null> {
  console.log('[Stripe] createBillingPortalSession - não implementado ainda')
  
  // TODO: Implementar lógica real
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const session = await stripe.billingPortal.sessions.create({
  //   customer: customerId,
  //   return_url: returnUrl,
  // })
  
  return null
}

export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
} as const
