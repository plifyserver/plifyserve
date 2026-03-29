import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPlifyCheckoutSession, type CheckoutPlan } from '@/lib/stripe/stripe'

const VALID_PLANS: CheckoutPlan[] = ['essential', 'pro']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const plan = body.plan as CheckoutPlan
    const paymentKind = body.paymentKind as 'card' | 'pix'

    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }
    if (paymentKind !== 'card') {
      return NextResponse.json(
        { error: 'No momento aceitamos apenas pagamento com cartão de crédito.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_id, plan_type, plan_status, plan_expires_at')
      .eq('id', user.id)
      .single()

    const now = Date.now()
    const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at).getTime() : 0
    const pixWindowActive =
      !profile?.subscription_id &&
      profile?.plan_status === 'active' &&
      expiresAt > now
    const samePlan = (profile?.plan_type as string) === plan

    const hasActiveCardSubscription =
      !!profile?.subscription_id && profile.plan_status !== 'cancelled'

    if (hasActiveCardSubscription) {
      return NextResponse.json(
        {
          error:
            'Você já tem assinatura no cartão. Para mudar de plano (upgrade ou downgrade com ajuste proporcional), use "Alterar plano da assinatura" nesta página.',
        },
        { status: 409 }
      )
    }

    if (samePlan && pixWindowActive) {
      return NextResponse.json(
        {
          error:
            'Este plano já está ativo até o fim do período pago. Você pode escolher outro plano ou aguardar a renovação.',
        },
        { status: 409 }
      )
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/checkout?plan=${plan}&canceled=1`

    const { url, sessionId } = await createPlifyCheckoutSession({
      userId: user.id,
      email: user.email,
      customerId: profile?.stripe_customer_id ?? null,
      plan,
      paymentKind,
      successUrl,
      cancelUrl,
    })

    if (!url) {
      return NextResponse.json({ error: 'Falha ao criar sessão de checkout' }, { status: 500 })
    }

    return NextResponse.json({ url, sessionId })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro no checkout'
    console.error('[Stripe checkout]', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
