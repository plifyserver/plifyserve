import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import {
  legacyLeadColumnsFromQuizAnswers,
  sanitizeQuizAnswersPayload,
} from '@/lib/wakeQuizQuestions'

const ALLOWED_STATUSES = new Set([
  'novo',
  'em_contato',
  'reuniao_agendada',
  'cliente',
  'perdido',
])

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wake_quiz_leads')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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
    user_id: userId,
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
    notas: typeof body.notas === 'string' ? body.notas : null,
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('wake_quiz_leads').insert(row).select('*').single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
