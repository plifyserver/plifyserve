import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const MAX_BOARDS_PER_USER = 5

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('kanban_boards')
    .select('*')
    .eq('user_id', userId)
    .order('order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const name = (body.name ?? '').trim() || 'Novo Kanban'
  const supabase = await createClient()

  const { count } = await supabase
    .from('kanban_boards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  if ((count ?? 0) >= MAX_BOARDS_PER_USER) {
    return NextResponse.json(
      { error: `Você pode criar no máximo ${MAX_BOARDS_PER_USER} Kanbans.` },
      { status: 400 }
    )
  }

  const { data: maxOrder } = await supabase
    .from('kanban_boards')
    .select('order')
    .eq('user_id', userId)
    .order('order', { ascending: false })
    .limit(1)
    .single()

  const order = (maxOrder?.order ?? -1) + 1

  const { data, error } = await supabase
    .from('kanban_boards')
    .insert({
      user_id: userId,
      name,
      order,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
