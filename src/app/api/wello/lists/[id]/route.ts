import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()
  const { data: list } = await supabase.from('wello_lists').select('id, board_id').eq('id', id).single()
  if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', list.board_id).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.order !== undefined) updates.order = Number(body.order)
  const { data, error } = await supabase.from('wello_lists').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { data: list } = await supabase.from('wello_lists').select('board_id').eq('id', id).single()
  if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', list.board_id).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { error } = await supabase.from('wello_lists').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
