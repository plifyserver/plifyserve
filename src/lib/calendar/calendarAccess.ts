import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Pro (campo `plan` ou `plan_type`) ou admin — mesma regra na agenda, API de calendário e `is_pro`.
 * Usa comparação case-insensitive para evitar divergência com o Postgres / painel admin.
 */
export function userProfileHasProPlan(row: {
  plan?: string | null
  plan_type?: string | null
  account_type?: string | null
} | null | undefined): boolean {
  if (!row) return false
  if (row.account_type === 'admin') return true
  const plan = (row.plan ?? '').toString().trim().toLowerCase()
  const planType = (row.plan_type ?? '').toString().trim().toLowerCase()
  return plan === 'pro' || planType === 'pro'
}

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
  return userProfileHasProPlan(data)
}
