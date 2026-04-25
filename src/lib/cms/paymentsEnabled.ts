import type { SupabaseClient } from '@supabase/supabase-js'

export async function getPaymentsEnabled(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase
    .from('cms_runtime_settings')
    .select('payments_enabled')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data) return false
  return data.payments_enabled === true
}
