import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { ESSENTIAL_MAX_MIND_MAPS, hasUnlimitedQuotas } from '@/lib/plan-entitlements'
import { getEffectivePlanForUser } from '@/lib/server/get-effective-plan'

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

  if (!body.id) {
    const plan = await getEffectivePlanForUser(supabase, userId)
    if (!hasUnlimitedQuotas(plan)) {
      const { count, error: cErr } = await supabase
        .from('mind_maps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (cErr) {
        return NextResponse.json(
          {
            error:
              cErr.message === 'relation "mind_maps" does not exist'
                ? 'Tabela mind_maps não existe. Execute a migration 002_agenda_mindmaps no Supabase.'
                : cErr.message,
          },
          { status: 500 }
        )
      }
      if ((count ?? 0) >= ESSENTIAL_MAX_MIND_MAPS) {
        return NextResponse.json(
          {
            error: 'MIND_MAP_LIMIT',
            message: `No Essential você pode ter até ${ESSENTIAL_MAX_MIND_MAPS} mapas mentais. Upgrade para o Pro para mapas ilimitados.`,
          },
          { status: 403 }
        )
      }
    }
  }

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
