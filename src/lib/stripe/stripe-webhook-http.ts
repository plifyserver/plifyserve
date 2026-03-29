import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/stripe'
import { processStripeEvent } from '@/lib/stripe/stripe-webhooks'

/**
 * Handler HTTP compartilhado entre POST /api/stripe/webhook e POST /api/webhook
 * (URL canônica de produção: https://plify360.com.br/api/webhook).
 */
export async function handleStripeWebhookPost(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado')
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Cabeçalho stripe-signature ausente' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[Stripe Webhook] Assinatura inválida:', err)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  try {
    const result = await processStripeEvent(event)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[Stripe Webhook] Erro ao processar:', err)
    return NextResponse.json({ error: 'Falha ao processar evento' }, { status: 500 })
  }
}
