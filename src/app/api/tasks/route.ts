import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const supabase = await createClient()
  let q = supabase.from('tasks').select('*').eq('user_id', userId).order('due_date', { ascending: true, nullsFirst: false })
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: body.title ?? '',
      client_id: body.client_id ?? null,
      client_name: body.client_name ?? null,
      responsible: body.responsible ?? null,
      due_date: body.due_date ?? null,
      status: body.status ?? 'pending',
      priority: body.priority ?? 'medium',
      description: body.description ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
