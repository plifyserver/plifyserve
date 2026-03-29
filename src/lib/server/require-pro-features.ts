import type { SupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { hasUnlimitedQuotas } from '@/lib/plan-entitlements'
import { getEffectivePlanForUser } from '@/lib/server/get-effective-plan'

/** Recursos exclusivos Pro (e admin): Ads, personalização, integrações de agenda, etc. */
export async function guardProFeatures(
  supabase: SupabaseClient,
  userId: string
): Promise<NextResponse | null> {
  const plan = await getEffectivePlanForUser(supabase, userId)
  if (!hasUnlimitedQuotas(plan)) {
    return NextResponse.json(
      {
        error: 'PRO_PLAN_REQUIRED',
        message: 'Este recurso está disponível no plano Pro.',
      },
      { status: 403 }
    )
  }
  return null
}
