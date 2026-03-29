import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveEffectivePlan, type EffectivePlan } from '@/lib/plan-entitlements'

export async function getEffectivePlanForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<EffectivePlan> {
  const { data } = await supabase
    .from('profiles')
    .select('plan_type, plan, account_type')
    .eq('id', userId)
    .single()
  return resolveEffectivePlan(data)
}
