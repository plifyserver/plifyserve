import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { isValidWakeQuizPublicSlug } from '@/lib/wakeQuizSlug'
import {
  legacyLeadColumnsFromQuizAnswers,
  sanitizeQuizAnswersPayload,
} from '@/lib/wakeQuizQuestions'

const ALLOWED_STATUSES = new Set(['novo'])

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const trimmed = decodeURIComponent(slug || '').trim()
  if (!isValidWakeQuizPublicSlug(trimmed)) {
    return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
  if (nome.length < 2) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  const status =
    typeof body.status === 'string' && ALLOWED_STATUSES.has(body.status) ? body.status : 'novo'

  const admin = createServiceRoleClient()

  const { data: owner, error: ownerErr } = await admin
    .from('profiles')
    .select('id')
    .eq('wake_quiz_public_slug', trimmed)
    .maybeSingle()

  if (ownerErr || !owner?.id) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }

  const ownerId = owner.id as string

  const quizAnswers = sanitizeQuizAnswersPayload(body.quiz_answers)
  const legacy =
    Object.keys(quizAnswers).length > 0
      ? legacyLeadColumnsFromQuizAnswers(quizAnswers)
      : {
          perfil: typeof body.perfil === 'string' ? body.perfil : null,
          marketing_atual: typeof body.marketing_atual === 'string' ? body.marketing_atual : null,
          faturamento: typeof body.faturamento === 'string' ? body.faturamento : null,
          objetivo: typeof body.objetivo === 'string' ? body.objetivo : null,
          dificuldade: typeof body.dificuldade === 'string' ? body.dificuldade : null,
        }

  const row = {
    user_id: ownerId,
    nome,
    whatsapp: typeof body.whatsapp === 'string' ? body.whatsapp.trim() : null,
    email: typeof body.email === 'string' ? body.email.trim() : null,
    perfil: legacy.perfil,
    marketing_atual: legacy.marketing_atual,
    faturamento: legacy.faturamento,
    objetivo: legacy.objetivo,
    dificuldade: legacy.dificuldade,
    quiz_answers: quizAnswers,
    status,
    notas: null,
  }

  const { data, error } = await admin.from('wake_quiz_leads').insert(row).select('id').single()

  if (error) {
    return NextResponse.json({ error: 'Não foi possível registar o lead.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id })
}
