import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import {
  mergeWakeQuizQuestions,
  validateWakeQuizQuestionsForSave,
} from '@/lib/wakeQuizQuestions'

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || !('questions' in body)) {
    return NextResponse.json({ error: 'Envie { questions: [...] }' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('plan_type, plan, account_type')
    .eq('id', userId)
    .maybeSingle()

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })
  }

  const validated = validateWakeQuizQuestionsForSave((body as { questions: unknown }).questions, profile)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const stored = validated.questions as unknown as Record<string, unknown>[]

  const { error: upErr } = await supabase
    .from('profiles')
    .update({
      wake_quiz_questions: stored as unknown[],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ questions: mergeWakeQuizQuestions(stored) })
}
