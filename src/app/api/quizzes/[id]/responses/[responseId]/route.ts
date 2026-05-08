import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ALLOWED_STATUS = new Set(['waiting', 'in_progress', 'attended', 'archived'])

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id, responseId } = await params
  const body = (await request.json().catch(() => ({}))) as { status?: unknown; notes?: unknown }

  const status = typeof body.status === 'string' ? body.status : undefined
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 5000) : undefined
  if (status !== undefined && !ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) {
    updates.status = status
    if (status === 'attended') updates.handled_at = new Date().toISOString()
  }
  if (notes !== undefined) updates.notes = notes.length ? notes : null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quiz_responses')
    .update(updates)
    .eq('id', responseId)
    .eq('quiz_id', id)
    .select('id, quiz_id, submitted_at, lead_name, lead_email, lead_phone, status, handled_at, notes, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

