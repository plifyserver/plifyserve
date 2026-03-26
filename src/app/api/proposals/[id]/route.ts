import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { mapProposalStatusToDb } from '@/lib/mapProposalDbStatus'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const isPublic = request.nextUrl.searchParams.get('public') === 'true'

  if (isPublic) {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .in('status', ['sent', 'viewed', 'accepted', 'open'])
      .single()

    if (error || !proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    return NextResponse.json(proposal)
  }

  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
  }

  return NextResponse.json(proposal)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (body.content !== undefined) updates.content = body.content
  if (body.client_name !== undefined) updates.client_name = body.client_name
  if (body.client_email !== undefined) updates.client_email = body.client_email
  if (body.status !== undefined) {
    updates.status = mapProposalStatusToDb(body.status)
  }
  if (body.title !== undefined) updates.title = body.title
  if (body.public_slug !== undefined) {
    updates.public_slug = body.public_slug
    updates.slug = body.public_slug
  }

  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
