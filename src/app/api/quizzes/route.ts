import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { generateQuizSlug } from '@/lib/generateQuizSlug'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { title?: unknown; slug?: unknown }
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  const preferredSlug = typeof body.slug === 'string' ? body.slug.trim() : ''
  const slug = preferredSlug.length > 0 ? preferredSlug : generateQuizSlug(title)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('quizzes')
    .insert({
      user_id: userId,
      title,
      slug,
      is_published: false,
    })
    .select()
    .single()

  if (error) {
    // unique constraint (slug)
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'Slug já existe. Tente outro.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

