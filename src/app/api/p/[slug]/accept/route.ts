import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar proposta pelo slug
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id, status')
    .eq('public_slug', slug)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  if (proposal.status === 'accepted') {
    return NextResponse.json({ error: 'Proposta já foi aceita' }, { status: 400 })
  }

  if (proposal.status === 'draft') {
    return NextResponse.json({ error: 'Proposta ainda não foi enviada' }, { status: 400 })
  }

  // Capturar IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'

  // Chamar função do Supabase para aceitar proposta
  const { data, error } = await supabase.rpc('accept_proposal', {
    p_proposal_id: proposal.id,
    p_ip_address: ip,
  })

  if (error) {
    console.error('Error accepting proposal:', error)
    return NextResponse.json({ error: 'Erro ao aceitar proposta' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Não foi possível aceitar a proposta' }, { status: 400 })
  }

  return NextResponse.json({ success: true, status: 'accepted' })
}
