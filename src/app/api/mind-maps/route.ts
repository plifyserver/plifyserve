import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const { data, error } = await supabase
      .from('mind_maps')
      .select('id, name, nodes, edges, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      return NextResponse.json(
        { error: error.message === 'relation "mind_maps" does not exist' ? 'Tabela mind_maps não existe. Execute a migration 002_agenda_mindmaps no Supabase.' : error.message },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('mind_maps')
    .select('id, name, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) {
    return NextResponse.json(
      { error: error.message === 'relation "mind_maps" does not exist' ? 'Tabela mind_maps não existe. Execute a migration 002_agenda_mindmaps no Supabase.' : error.message },
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
  let body: { id?: string; name?: string; nodes: unknown[]; edges: unknown[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return NextResponse.json({ error: 'nodes e edges são obrigatórios' }, { status: 400 })
  }
  const supabase = await createClient()
  const name = body.name ?? 'Mapa principal'
  const nodes = body.nodes
  const edges = body.edges
  const now = new Date().toISOString()

  if (body.id) {
    const { data, error } = await supabase
      .from('mind_maps')
      .update({ nodes, edges, name, updated_at: now })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select('id')
      .single()
    if (error) {
      return NextResponse.json(
        { error: error.message === 'relation "mind_maps" does not exist' ? 'Tabela mind_maps não existe. Execute a migration 002_agenda_mindmaps no Supabase.' : error.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ id: data.id })
  }

  const { data, error } = await supabase
    .from('mind_maps')
    .insert({ user_id: userId, name, nodes, edges })
    .select('id')
    .single()
  if (error) {
    return NextResponse.json(
      { error: error.message === 'relation "mind_maps" does not exist' ? 'Tabela mind_maps não existe. Execute a migration 002_agenda_mindmaps no Supabase.' : error.message },
      { status: 500 }
    )
  }
  return NextResponse.json({ id: data.id })
}
