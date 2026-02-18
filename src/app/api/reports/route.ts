import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      title: body.title ?? '',
      type: body.type ?? 'custom',
      client_id: body.client_id ?? null,
      client_name: body.client_name ?? null,
      period_start: body.period_start ?? null,
      period_end: body.period_end ?? null,
      content: body.content ?? null,
      status: body.status ?? 'draft',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
