import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/admin/require-admin'

type ProfileRow = {
  account_type?: string | null
  subscription_id?: string | null
  plan_status?: string | null
  plan_expires_at?: string | null
  plan_type?: string | null
  plan?: string | null
  banned?: boolean | null
}

/** Acesso pago conforme dados no perfil (ignora BILLING_GATE_DISABLED). */
function hasPaidAccessFromProfile(p: ProfileRow): boolean {
  if (p.account_type === 'admin' || p.account_type === 'socio') return true
  if (p.plan_status === 'cancelled') return false
  if (p.subscription_id?.trim()) return true
  const exp = p.plan_expires_at ? new Date(p.plan_expires_at).getTime() : 0
  return exp > Date.now()
}

export async function GET() {
  const admin = await requireAdminSession()
  if (!admin.ok) return admin.response

  const svc = createServiceRoleClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [profilesRes, proposalsRes, logsRes] = await Promise.all([
    svc
      .from('profiles')
      .select(
        'account_type, subscription_id, plan_status, plan_expires_at, plan_type, plan, banned'
      ),
    svc.from('proposals').select('id', { count: 'exact', head: true }),
    svc.from('activity_logs').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ])

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
  }

  const rows = (profilesRes.data || []) as ProfileRow[]

  let totalUsers = rows.length
  let bannedUsers = 0
  let adminUsers = 0
  let proPaying = 0
  let essentialPaying = 0
  let noPaidAccess = 0

  for (const r of rows) {
    if (r.banned) {
      bannedUsers++
      continue
    }

    if (r.account_type === 'admin') {
      adminUsers++
      continue
    }
    const access = hasPaidAccessFromProfile(r)
    const isProTier = r.plan_type === 'pro' || r.plan === 'pro'

    if (!access) {
      noPaidAccess++
      continue
    }

    if (isProTier) {
      proPaying++
    } else {
      essentialPaying++
    }
  }

  return NextResponse.json({
    totalUsers,
    bannedUsers,
    adminUsers,
    proPaying,
    essentialPaying,
    noPaidAccess,
    proposalsCount: proposalsRes.count ?? 0,
    logsLast24h: logsRes.count ?? 0,
  })
}
