import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile'
  if (/tablet/i.test(userAgent)) return 'tablet'
  return 'desktop'
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar proposta pelo slug
  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .select('id')
    .eq('public_slug', slug)
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // Capturar dados do request
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const deviceType = getDeviceType(userAgent)

  // Chamar função do Supabase para registrar visualização
  const { data, error } = await supabase.rpc('register_proposal_view', {
    p_proposal_id: proposal.id,
    p_ip_address: ip,
    p_user_agent: userAgent,
    p_device_type: deviceType,
  })

  if (error) {
    console.error('Error registering view:', error)
    return NextResponse.json({ registered: false })
  }

  return NextResponse.json({ registered: data })
}
