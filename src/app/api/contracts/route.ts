import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { ESSENTIAL_MONTHLY_CONTRACTS, hasUnlimitedQuotas, startOfUtcMonth } from '@/lib/plan-entitlements'
import { getEffectivePlanForUser } from '@/lib/server/get-effective-plan'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const supabase = await createClient()

  const plan = await getEffectivePlanForUser(supabase, userId)
  if (!hasUnlimitedQuotas(plan)) {
    const monthStart = startOfUtcMonth().toISOString()
    const { count, error: cErr } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart)
    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500 })
    }
    if ((count ?? 0) >= ESSENTIAL_MONTHLY_CONTRACTS) {
      return NextResponse.json(
        {
          error: 'MONTHLY_CONTRACT_LIMIT',
          message: `No Essential você pode criar até ${ESSENTIAL_MONTHLY_CONTRACTS} contratos por mês. Upgrade para o Pro para contratos ilimitados.`,
        },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      user_id: userId,
      title: body.title ?? '',
      file_url: body.file_url ?? null,
      client_id: body.client_id ?? null,
      client_name: body.client_name ?? null,
      signatories: body.signatories ?? [],
      status: body.status ?? 'draft',
      sent_at: body.sent_at ?? null,
      signed_at: body.signed_at ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
