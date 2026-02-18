import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id: listId } = await params
  const supabase = await createClient()
  const { data: list } = await supabase.from('wello_lists').select('id, board_id').eq('id', listId).single()
  if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', list.board_id).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { data, error } = await supabase.from('wello_cards').select('*').eq('list_id', listId).order('order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id: listId } = await params
  const supabase = await createClient()
  const { data: list } = await supabase.from('wello_lists').select('id, board_id').eq('id', listId).single()
  if (!list) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', list.board_id).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const body = await request.json()
  const { data, error } = await supabase
    .from('wello_cards')
    .insert({
      board_id: list.board_id,
      list_id: listId,
      title: body.title ?? 'Novo card',
      description: body.description ?? null,
      due_date: body.due_date ?? null,
      labels: Array.isArray(body.labels) ? body.labels : [],
      cover_color: body.cover_color ?? null,
      order: body.order != null ? Number(body.order) : 0,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
