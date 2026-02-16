import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposal, error: fetchErr } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  if (proposal.status !== 'open') {
    return NextResponse.json({ error: 'Proposta já foi processada' }, { status: 400 })
  }

  let updatePayload: Record<string, unknown> = {
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.selectedPlan && typeof body.selectedPlan === 'object') {
      updatePayload.content = { ...(proposal.content as object), acceptedPlan: body.selectedPlan }
      const planPrice = body.selectedPlan.price
      if (typeof planPrice === 'number' && !Number.isNaN(planPrice)) {
        updatePayload.proposal_value = planPrice
      }
    }
  } catch {
    // body vazio ou inválido: mantém content como está
  }

  const { data: updated, error } = await supabase
    .from('proposals')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Registrar evento
  await supabase.from('proposal_events').insert({
    proposal_id: id,
    event_type: 'accept',
  })

  return NextResponse.json(updated)
}
