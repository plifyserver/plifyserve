import { NextRequest, NextResponse } from 'next/server'
import { handleWebhook, verifyWebhookSignature, type WebhookPayload } from '@/lib/stripe'

/**
 * Stripe Webhook Endpoint - Preparação para integração futura
 * 
 * Este endpoint receberá eventos do Stripe quando a integração for ativada.
 * Por enquanto, apenas registra os eventos recebidos.
 */
export async function POST(request: NextRequest) {
  // TODO: Ativar quando Stripe estiver configurado
  const isStripeEnabled = false

  if (!isStripeEnabled) {
    return NextResponse.json(
      { message: 'Stripe webhooks não está ativo ainda' },
      { status: 200 }
    )
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const payload = JSON.parse(body) as WebhookPayload
    const result = await handleWebhook(payload)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Stripe Webhook] Erro:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
