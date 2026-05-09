import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ALLOWED_STATUSES = new Set([
  'novo',
  'em_contato',
  'reuniao_agendada',
  'cliente',
  'perdido',
])

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const patch: Record<string, string | null> = {}

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }
    patch.status = body.status
  }
  if (body.notas !== undefined) {
    patch.notas = typeof body.notas === 'string' ? body.notas : null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })
  }

  patch.updated_at = new Date().toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wake_quiz_leads')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wake_quiz_leads')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
