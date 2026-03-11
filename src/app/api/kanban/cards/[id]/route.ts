import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

async function checkCardOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cardId: string,
  userId: string
) {
  const { data: card } = await supabase
    .from('kanban_cards')
    .select('id, board_id')
    .eq('id', cardId)
    .single()
  if (!card) return null
  const { data: board } = await supabase
    .from('kanban_boards')
    .select('id')
    .eq('id', card.board_id)
    .eq('user_id', userId)
    .single()
  return board ? card : null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()
  const card = await checkCardOwnership(supabase, id, userId)
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = (body.title ?? '').trim() || 'Tarefa'
  if (body.description !== undefined) updates.description = body.description
  if (body.stage_id !== undefined) updates.stage_id = body.stage_id
  if (body.order !== undefined) updates.order = Number(body.order)
  const { data, error } = await supabase
    .from('kanban_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _r: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const card = await checkCardOwnership(supabase, id, userId)
  if (!card) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 })
  const { error } = await supabase.from('kanban_cards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
