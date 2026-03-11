import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get('board_id')
  if (!boardId) return NextResponse.json({ error: 'board_id é obrigatório' }, { status: 400 })
  const supabase = await createClient()
  const { data: board } = await supabase
    .from('kanban_boards')
    .select('id')
    .eq('id', boardId)
    .eq('user_id', userId)
    .single()
  if (!board) return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 })
  const { data, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('board_id', boardId)
    .order('order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const boardId = body.board_id
  const stageId = body.stage_id
  if (!boardId || !stageId) {
    return NextResponse.json({ error: 'board_id e stage_id são obrigatórios' }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: board } = await supabase
    .from('kanban_boards')
    .select('id')
    .eq('id', boardId)
    .eq('user_id', userId)
    .single()
  if (!board) return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 })
  const { data: stage } = await supabase
    .from('kanban_stages')
    .select('id')
    .eq('id', stageId)
    .eq('board_id', boardId)
    .single()
  if (!stage) return NextResponse.json({ error: 'Etapa não encontrada' }, { status: 404 })

  const { data: maxOrder } = await supabase
    .from('kanban_cards')
    .select('order')
    .eq('stage_id', stageId)
    .order('order', { ascending: false })
    .limit(1)
    .single()

  const order = (maxOrder?.order ?? -1) + 1

  const { data, error } = await supabase
    .from('kanban_cards')
    .insert({
      board_id: boardId,
      stage_id: stageId,
      title: (body.title ?? '').trim() || 'Nova tarefa',
      description: body.description ?? null,
      order,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
