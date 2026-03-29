import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { generateProposalSlug } from '@/lib/generateProposalSlug'
import { mapProposalStatusToDb } from '@/lib/mapProposalDbStatus'
import { ESSENTIAL_MONTHLY_PROPOSALS, hasUnlimitedQuotas, startOfUtcMonth } from '@/lib/plan-entitlements'
import { getEffectivePlanForUser } from '@/lib/server/get-effective-plan'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = await createClient()

  const plan = await getEffectivePlanForUser(supabase, userId)
  if (!hasUnlimitedQuotas(plan)) {
    const monthStart = startOfUtcMonth().toISOString()
    const { count, error: cErr } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart)
    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500 })
    }
    if ((count ?? 0) >= ESSENTIAL_MONTHLY_PROPOSALS) {
      return NextResponse.json(
        {
          error: 'MONTHLY_PROPOSAL_LIMIT',
          message: `No Essential você pode criar até ${ESSENTIAL_MONTHLY_PROPOSALS} propostas por mês. Upgrade para o Pro para propostas ilimitadas.`,
        },
        { status: 403 }
      )
    }
  }

  const publicSlug = body.public_slug || generateProposalSlug(body.title || 'proposta', body.client_name || 'cliente')
  const now = new Date().toISOString()
  const dbStatus = mapProposalStatusToDb(body.status)

  const row: Record<string, unknown> = {
    user_id: userId,
    title: body.title || 'Proposta',
    slug: publicSlug,
    client_name: body.client_name ?? null,
    client_email: body.client_email ?? null,
    content: body.content ?? {},
    status: dbStatus,
    public_slug: publicSlug,
    views: 0,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('proposals')
    .insert(row)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try {
    await supabase.rpc('log_activity', {
      p_user_id: userId,
      p_action: 'proposal_create',
      p_resource_type: 'proposal',
      p_resource_id: data.id,
      p_metadata: { title: (data as { title?: string }).title ?? null },
    })
  } catch {
    /* log opcional */
  }

  return NextResponse.json(data)
}
