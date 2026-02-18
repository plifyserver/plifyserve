import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('finance_transactions').select('*').eq('id', id).eq('user_id', userId).single()
  if (error || !data) return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
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
  if (body.amount !== undefined) updates.amount = Number(body.amount)
  if (body.date !== undefined) updates.date = body.date
  if (body.category !== undefined) updates.category = body.category
  if (body.project_id !== undefined) updates.project_id = body.project_id
  if (body.project_name !== undefined) updates.project_name = body.project_name
  if (body.client_id !== undefined) updates.client_id = body.client_id
  if (body.client_name !== undefined) updates.client_name = body.client_name
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.status !== undefined) updates.status = body.status
  const supabase = await createClient()
  const { data, error } = await supabase.from('finance_transactions').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('finance_transactions').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
