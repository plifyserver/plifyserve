import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { changeSubscriptionPlanPrice } from '@/lib/stripe/subscription-change'
import type { CheckoutPlan } from '@/lib/stripe/stripe'

const VALID: CheckoutPlan[] = ['essential', 'pro']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const targetPlan = body.targetPlan as CheckoutPlan

    if (!VALID.includes(targetPlan)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('subscription_id, plan_type')
      .eq('id', user.id)
      .single()

    if (pErr || !profile?.subscription_id) {
      return NextResponse.json(
        {
          error:
            'Você não tem assinatura ativa no cartão. Escolha um plano e pague com cartão ou PIX no checkout.',
        },
        { status: 400 }
      )
    }

    const current = profile.plan_type as string
    if (current === targetPlan) {
      return NextResponse.json({ error: 'Você já está neste plano.' }, { status: 400 })
    }

    await changeSubscriptionPlanPrice(profile.subscription_id, targetPlan, user.id)

    const { error: uErr } = await supabase
      .from('profiles')
      .update({
        plan_type: targetPlan,
        plan: targetPlan === 'pro' ? 'pro' : 'free',
        templates_limit: targetPlan === 'pro' ? null : 10,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (uErr) {
      console.error('[change-plan] profile update:', uErr)
    }

    return NextResponse.json({
      success: true,
      message:
        targetPlan === 'pro'
          ? 'Upgrade aplicado. A diferença proporcional será cobrada na fatura do Stripe (proration).'
          : 'Downgrade aplicado. Créditos proporcionais podem aparecer na próxima fatura.',
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro ao alterar plano'
    console.error('[change-plan]', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
