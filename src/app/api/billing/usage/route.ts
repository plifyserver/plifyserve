import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      plan_expires_at
    `)
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const planType = profile.plan_type || 'essential'
  const templatesLimit = profile.templates_limit || 50
  const templatesCount = profile.templates_count || 0
  const isUnlimited = planType === 'pro' || planType === 'admin' || profile.templates_limit === null

  const usagePercentage = isUnlimited ? 0 : Math.min(100, (templatesCount / templatesLimit) * 100)
  const remaining = isUnlimited ? null : Math.max(0, templatesLimit - templatesCount)

  return NextResponse.json({
    planType,
    planStatus: profile.plan_status || 'active',
    templatesUsed: templatesCount,
    templatesLimit: isUnlimited ? null : templatesLimit,
    remaining,
    usagePercentage: Math.round(usagePercentage),
    isUnlimited,
    subscriptionId: profile.subscription_id,
    planStartedAt: profile.plan_started_at,
    planExpiresAt: profile.plan_expires_at,
  })
}
