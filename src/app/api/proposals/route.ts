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
  
  const publicSlug = body.public_slug || generateProposalSlug(body.title || 'proposta', body.client_name || 'cliente')
  const now = new Date().toISOString()
  // Compatível com constraint (open, accepted, ignored): draft/sent -> open, accepted -> accepted
  const rawStatus = body.status || 'draft'
  const dbStatus = rawStatus === 'accepted' ? 'accepted' : 'open'

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

  return NextResponse.json(data)
}
