import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { mergeWakeQuizHero } from '@/lib/wakeQuizHero'
import {
  hasUnlimitedQuotas,
  maxQuizQuestionsForPlan,
  mergeWakeQuizQuestions,
  resolveEffectivePlan,
} from '@/lib/wakeQuizQuestions'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('wake_quiz_hero, wake_quiz_logo_url, wake_quiz_questions, plan_type, plan, account_type')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const hero = mergeWakeQuizHero(data?.wake_quiz_hero)
  const logoUrl = (data?.wake_quiz_logo_url as string | null) ?? null
  const questions = mergeWakeQuizQuestions(data?.wake_quiz_questions)
  const planLike = {
    plan_type: data?.plan_type,
    plan: data?.plan,
    account_type: data?.account_type,
  }
  const quizPlan = {
    maxQuestions: maxQuizQuestionsForPlan(planLike),
    unlimited: hasUnlimitedQuotas(resolveEffectivePlan(planLike)),
  }

  return NextResponse.json({ hero, logoUrl, questions, quizPlan })
}

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

  if (!body || typeof body !== 'object' || !('hero' in body)) {
    return NextResponse.json({ error: 'Envie { hero: {...} }' }, { status: 400 })
  }

  const merged = mergeWakeQuizHero((body as { hero: unknown }).hero)

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      wake_quiz_hero: merged as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: row } = await supabase
    .from('profiles')
    .select('wake_quiz_logo_url')
    .eq('id', userId)
    .maybeSingle()

  return NextResponse.json({
    hero: merged,
    logoUrl: (row?.wake_quiz_logo_url as string | null) ?? null,
  })
}
