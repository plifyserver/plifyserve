/**
 * Acesso ao painel SaaS: assinatura Stripe ativa OU período pré-pago (ex.: PIX) válido.
 * Admin e sócio entram sempre. Desligue o gate com BILLING_GATE_DISABLED=true (ex.: dev local).
 */

export type BillingGateProfile = {
  account_type?: string | null
  subscription_id?: string | null
  plan_status?: string | null
  plan_expires_at?: string | null
}

export function hasActivePaidAccess(profile: BillingGateProfile | null | undefined): boolean {
  if (process.env.BILLING_GATE_DISABLED === 'true') {
    return true
  }
  if (!profile) return false
  if (profile.account_type === 'admin' || profile.account_type === 'socio') {
    return true
  }

  const canceled = profile.plan_status === 'cancelled'
  if (canceled) return false

  const subId = profile.subscription_id?.trim()
  if (subId) {
    return true
  }

  const exp = profile.plan_expires_at ? new Date(profile.plan_expires_at).getTime() : 0
  if (exp > Date.now()) {
    return true
  }

  return false
}
