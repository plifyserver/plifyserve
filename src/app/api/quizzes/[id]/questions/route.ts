import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getEffectivePlanForUser } from '@/lib/server/get-effective-plan'
import { hasUnlimitedQuotas, ESSENTIAL_MAX_QUIZ_QUESTIONS } from '@/lib/plan-entitlements'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const supabase = await createClient()

  const plan = await getEffectivePlanForUser(supabase, userId)
  const unlimited = hasUnlimitedQuotas(plan)

  if (!unlimited) {
    const { count } = await supabase
      .from('quiz_questions')
      .select('id', { head: true, count: 'exact' })
      .eq('quiz_id', id)

    if ((count ?? 0) >= ESSENTIAL_MAX_QUIZ_QUESTIONS) {
      return NextResponse.json(
        {
          error: 'LIMIT_REACHED',
          message: `No plano Essential você pode ter até ${ESSENTIAL_MAX_QUIZ_QUESTIONS} perguntas por quiz.`,
          limit: ESSENTIAL_MAX_QUIZ_QUESTIONS,
        },
        { status: 403 }
      )
    }
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const emoji = typeof body.emoji === 'string' ? body.emoji.trim().slice(0, 12) : null
  const kind = typeof body.kind === 'string' ? body.kind : 'short_text'
  const description = typeof body.description === 'string' ? body.description : null
  const required = typeof body.required === 'boolean' ? body.required : false
  const placeholder = typeof body.placeholder === 'string' ? body.placeholder : null
  const options = Array.isArray(body.options) ? body.options : []
  const order = typeof body.order === 'number' ? body.order : 0

  if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  const { data, error } = await supabase
    .from('quiz_questions')
    .insert({
      quiz_id: id,
      title,
      emoji,
      kind,
      description,
      required,
      placeholder,
      options,
      order,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

