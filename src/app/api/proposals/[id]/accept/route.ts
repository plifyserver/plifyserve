import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
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

  const { data: updated, error } = await supabase
    .from('proposals')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
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
