import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasActivePaidAccess } from '@/lib/billing-access'
import {
  ESSENTIAL_MAX_CLIENTS,
  ESSENTIAL_MAX_KANBAN_BOARDS,
  ESSENTIAL_MAX_MIND_MAPS,
  ESSENTIAL_MONTHLY_CONTRACTS,
  ESSENTIAL_MONTHLY_PROPOSALS,
  hasUnlimitedQuotas,
  resolveEffectivePlan,
  startOfUtcMonth,
} from '@/lib/plan-entitlements'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      plan_type,
      plan_status,
      templates_limit,
      templates_count,
      subscription_id,
      plan_started_at,
      plan_expires_at,
      account_type
    `)
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const planType = profile.plan_type || 'essential'
  const templatesCount = profile.templates_count || 0
  const isUnlimited = planType === 'pro' || planType === 'admin' || profile.templates_limit === null
  const cappedLimit = profile.templates_limit ?? 10
  const templatesLimit = isUnlimited ? null : cappedLimit

  const usagePercentage = isUnlimited ? 0 : Math.min(100, (templatesCount / (templatesLimit ?? 1)) * 100)
  const remaining = isUnlimited ? null : Math.max(0, (templatesLimit ?? 0) - templatesCount)

  const hasAccess = hasActivePaidAccess({
    account_type: profile.account_type,
    subscription_id: profile.subscription_id,
    plan_status: profile.plan_status,
    plan_expires_at: profile.plan_expires_at,
  })

  const eff = resolveEffectivePlan(profile)
  const quotasUnlimited = hasUnlimitedQuotas(eff)

  let quotas:
    | {
        clients: { used: number; limit: number }
        proposalsThisMonth: { used: number; limit: number }
        contractsThisMonth: { used: number; limit: number }
        mindMaps: { used: number; limit: number }
        kanbanBoards: { used: number; limit: number }
      }
    | undefined

  if (!quotasUnlimited) {
    const monthStart = startOfUtcMonth().toISOString()
    const uid = user.id

    const [clientsR, proposalsR, contractsR, mindR, kanbR] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('created_at', monthStart),
      supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gte('created_at', monthStart),
      supabase.from('mind_maps').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('kanban_boards').select('*', { count: 'exact', head: true }).eq('user_id', uid),
    ])

    quotas = {
      clients: { used: clientsR.count ?? 0, limit: ESSENTIAL_MAX_CLIENTS },
      proposalsThisMonth: { used: proposalsR.count ?? 0, limit: ESSENTIAL_MONTHLY_PROPOSALS },
      contractsThisMonth: { used: contractsR.count ?? 0, limit: ESSENTIAL_MONTHLY_CONTRACTS },
      mindMaps: { used: mindR.error ? 0 : mindR.count ?? 0, limit: ESSENTIAL_MAX_MIND_MAPS },
      kanbanBoards: { used: kanbR.count ?? 0, limit: ESSENTIAL_MAX_KANBAN_BOARDS },
    }
  }

  return NextResponse.json({
    planType,
    planStatus: profile.plan_status || 'active',
    templatesUsed: templatesCount,
    templatesLimit: isUnlimited ? null : templatesLimit,
    remaining,
    usagePercentage: Math.round(usagePercentage),
    isUnlimited,
    quotas,
    subscriptionId: profile.subscription_id,
    planStartedAt: profile.plan_started_at,
    planExpiresAt: profile.plan_expires_at,
    hasActivePaidAccess: hasAccess,
    accountType: profile.account_type ?? null,
  })
}
