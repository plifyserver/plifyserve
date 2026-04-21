import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Acesso aos recursos Pro da agenda (Google / ICS): alinhado a `hasActivePaidAccess` — admin, sócio,
 * ou `plan` / `plan_type` em Pro. Case-insensitive.
 */
export function userProfileHasProPlan(row: {
  plan?: string | null
  plan_type?: string | null
  account_type?: string | null
} | null | undefined): boolean {
  if (!row) return false
  const acct = (row.account_type ?? '').toString().trim().toLowerCase()
  if (acct === 'admin' || acct === 'socio') return true
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
