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
    .select('plan_type, plan_status, templates_limit, templates_count')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const planType = profile.plan_type || 'essential'
  const templatesLimit = profile.templates_limit
  const templatesCount = profile.templates_count || 0

  const isUnlimited = planType === 'pro' || planType === 'admin' || templatesLimit === null
  const canCreate = isUnlimited || templatesCount < (templatesLimit || 50)

  return NextResponse.json({
    canCreate,
    currentCount: templatesCount,
    maxLimit: templatesLimit,
    planType,
    planStatus: profile.plan_status || 'active',
    isUnlimited,
    reason: canCreate ? 'OK' : 'LIMIT_REACHED',
  })
}
