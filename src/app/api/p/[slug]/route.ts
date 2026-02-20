import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar proposta pelo slug público
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      id,
      title,
      client_name,
      client_email,
      content,
      status,
      color_palette,
      confirm_button_text,
      views,
      created_at,
      accepted_at
    `)
    .eq('public_slug', slug)
    .in('status', ['sent', 'viewed', 'accepted'])
    .single()

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  // Buscar dados do usuário dono da proposta para logo/nome da empresa
  const { data: owner } = await supabase
    .from('proposals')
    .select('user_id')
    .eq('id', proposal.id)
    .single()

  let companyInfo = null
  if (owner?.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, company_name, company_logo')
      .eq('id', owner.user_id)
      .single()
    
    companyInfo = profile
  }

  return NextResponse.json({
    ...proposal,
    company: companyInfo,
  })
}
