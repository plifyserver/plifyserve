import type { SupabaseClient } from '@supabase/supabase-js'

/** Alinhado à agenda: Pro ou admin da conta. */
export async function userCanUseCalendarIntegrations(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('plan, plan_type, account_type')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return false
  if (data.account_type === 'admin') return true
  return data.plan === 'pro' || data.plan_type === 'pro'
}
