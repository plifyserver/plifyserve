import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import type { ClientStatus } from '@/types'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as ClientStatus | null

  const supabase = await createClient()
  let query = supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const status = (body.status as ClientStatus) || 'active'
  const validStatuses: ClientStatus[] = ['active', 'inactive', 'lead', 'archived']
  const finalStatus = validStatuses.includes(status) ? status : 'active'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: body.name ?? '',
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: finalStatus,
      company: body.company ?? null,
      notes: body.notes ?? null,
      source: body.source ?? null,
      responsible: body.responsible ?? null,
      kanban_stage: body.kanban_stage ?? 'lead',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
