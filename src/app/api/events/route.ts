import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('start_at', { ascending: true })
  if (error) {
    return NextResponse.json(
      { error: error.message === 'relation "events" does not exist' ? 'Tabela events não existe. Execute a migration 002_agenda_mindmaps no Supabase.' : error.message },
      { status: 500 }
    )
  }
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  let body: { title?: string; description?: string; location?: string; start_at?: string; end_at?: string; all_day?: boolean; color?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const title = (body.title ?? '').trim()
  if (!title) {
    return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
  }
  const startAt = body.start_at ? new Date(body.start_at).toISOString() : null
  const endAt = body.end_at ? new Date(body.end_at).toISOString() : null
  if (!startAt || !endAt) {
    return NextResponse.json({ error: 'Data de início e fim são obrigatórias' }, { status: 400 })
  }
  const supabase = await createClient()
  const color = typeof body.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(body.color) ? body.color : null
  const row = {
    user_id: userId,
    title,
    description: (body.description ?? '').trim() || null,
    location: (body.location ?? '').trim() || null,
    start_at: startAt,
    end_at: endAt,
    all_day: body.all_day ?? false,
    color,
  }
  const { data, error } = await supabase.from('events').insert(row).select().single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
