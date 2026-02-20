import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { generateProposalSlug } from '@/lib/generateProposalSlug'

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
  
  // Gerar slug único
  const publicSlug = body.public_slug || generateProposalSlug(body.title || 'proposta', body.client_name || 'cliente')
  
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      user_id: userId,
      template_base_id: body.template_base_id ?? null,
      title: body.title,
      slug: body.slug,
      public_slug: publicSlug,
      status: body.status || 'draft',
      content: body.content ?? {},
      color_palette: body.color_palette || 'default',
      confirm_button_text: body.confirm_button_text || 'CONFIRMAR PROPOSTA',
      client_name: body.client_name ?? null,
      client_email: body.client_email ?? null,
      client_phone: body.client_phone ?? null,
      proposal_value: body.proposal_value ?? null,
      views: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
