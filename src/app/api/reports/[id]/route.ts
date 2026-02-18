import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('reports').select('*').eq('id', id).eq('user_id', userId).single()
  if (error || !data) return NextResponse.json({ error: 'Relatório não encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updates.title = body.title
  if (body.type !== undefined) updates.type = body.type
  if (body.client_id !== undefined) updates.client_id = body.client_id
  if (body.client_name !== undefined) updates.client_name = body.client_name
  if (body.period_start !== undefined) updates.period_start = body.period_start
  if (body.period_end !== undefined) updates.period_end = body.period_end
  if (body.content !== undefined) updates.content = body.content
  if (body.status !== undefined) updates.status = body.status
  const supabase = await createClient()
  const { data, error } = await supabase.from('reports').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('reports').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
