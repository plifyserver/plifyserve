import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id: boardId } = await params
  const supabase = await createClient()
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', boardId).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Board não encontrado' }, { status: 404 })
  const { data, error } = await supabase.from('wello_lists').select('*').eq('board_id', boardId).order('order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id: boardId } = await params
  const supabase = await createClient()
  const { data: board } = await supabase.from('wello_boards').select('id').eq('id', boardId).eq('user_id', userId).single()
  if (!board) return NextResponse.json({ error: 'Board não encontrado' }, { status: 404 })
  const body = await request.json()
  const { data, error } = await supabase
    .from('wello_lists')
    .insert({
      board_id: boardId,
      name: body.name ?? 'Nova lista',
      order: body.order != null ? Number(body.order) : 0,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
