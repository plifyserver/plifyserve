import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert({
      user_id: userId,
      title: body.title ?? '',
      type: body.type ?? 'income',
      amount: Number(body.amount) ?? 0,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      category: body.category ?? null,
      project_id: body.project_id ?? null,
      project_name: body.project_name ?? null,
      client_id: body.client_id ?? null,
      client_name: body.client_name ?? null,
      notes: body.notes ?? null,
      status: body.status ?? 'completed',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
