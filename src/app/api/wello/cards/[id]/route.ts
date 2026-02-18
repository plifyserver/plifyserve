import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()
  const { data: card } = await supabase.from('wello_cards').select('id, board_id').eq('id', id).single()
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', card.board_id).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.due_date !== undefined) updates.due_date = body.due_date ?? null
  if (body.labels !== undefined) updates.labels = Array.isArray(body.labels) ? body.labels : []
  if (body.cover_color !== undefined) updates.cover_color = body.cover_color
  if (body.order !== undefined) updates.order = Number(body.order)
  if (body.list_id !== undefined) updates.list_id = body.list_id
  const { data, error } = await supabase.from('wello_cards').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { data: card } = await supabase.from('wello_cards').select('board_id').eq('id', id).single()
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', card.board_id).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { error } = await supabase.from('wello_cards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
