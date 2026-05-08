import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id, questionId } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of ['title', 'description', 'emoji', 'kind', 'required', 'options', 'placeholder', 'order']) {
    if (body[k] !== undefined) updates[k] = body[k]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quiz_questions')
    .update(updates)
    .eq('id', questionId)
    .eq('quiz_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id, questionId } = await params
  const supabase = await createClient()
  const { error } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('id', questionId)
    .eq('quiz_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

