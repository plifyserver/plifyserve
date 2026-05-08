import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of [
    'title',
    'slug',
    'logo_url',
    'intro_title',
    'intro_description',
    'thanks_title',
    'thanks_description',
    'thanks_badge_emoji',
    'thanks_badge_text',
    'thanks_title_top',
    'thanks_title_bottom',
    'thanks_highlights',
    'thanks_callout_title',
    'thanks_callout_text',
    'hero_badge_emoji',
    'hero_badge_text',
    'hero_title_top',
    'hero_title_bottom',
    'hero_description',
    'hero_floating_items',
    'start_button_label',
    'social_proof_text',
    'is_published',
  ]) {
    if (body[k] !== undefined) updates[k] = body[k]
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quizzes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Slug já existe. Tente outro.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { error } = await supabase.from('quizzes').delete().eq('id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

