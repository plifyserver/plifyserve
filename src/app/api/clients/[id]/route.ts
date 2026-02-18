import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import type { ClientStatus } from '@/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const validStatuses: ClientStatus[] = ['active', 'inactive', 'lead', 'archived']

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (body.name !== undefined) updates.name = body.name
  if (body.email !== undefined) updates.email = body.email
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.status !== undefined && validStatuses.includes(body.status)) updates.status = body.status
  if (body.company !== undefined) updates.company = body.company
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.source !== undefined) updates.source = body.source
  if (body.responsible !== undefined) updates.responsible = body.responsible
  if (body.kanban_stage !== undefined) updates.kanban_stage = body.kanban_stage

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
