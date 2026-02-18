import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('ad_campaigns').select('*').eq('id', id).eq('user_id', userId).single()
  if (error || !data) return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name
  if (body.platform !== undefined) updates.platform = body.platform
  if (body.investment !== undefined) updates.investment = body.investment != null ? Number(body.investment) : null
  if (body.leads !== undefined) updates.leads = body.leads != null ? Number(body.leads) : null
  if (body.conversions !== undefined) updates.conversions = body.conversions != null ? Number(body.conversions) : null
  if (body.start_date !== undefined) updates.start_date = body.start_date || null
  if (body.end_date !== undefined) updates.end_date = body.end_date || null
  if (body.status !== undefined) updates.status = body.status
  if (body.account_link !== undefined) updates.account_link = body.account_link ?? null
  const supabase = await createClient()
  const { data, error } = await supabase.from('ad_campaigns').update(updates).eq('id', id).eq('user_id', userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('ad_campaigns').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
