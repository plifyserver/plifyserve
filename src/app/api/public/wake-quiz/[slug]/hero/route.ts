import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mergeWakeQuizHero } from '@/lib/wakeQuizHero'
import { mergeWakeQuizQuestions } from '@/lib/wakeQuizQuestions'
import { isValidWakeQuizPublicSlug } from '@/lib/wakeQuizSlug'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const trimmed = decodeURIComponent(slug || '').trim()
  if (!isValidWakeQuizPublicSlug(trimmed)) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const admin = createServiceRoleClient()
  const { data: row, error } = await admin
    .from('profiles')
    .select('wake_quiz_hero, wake_quiz_logo_url, wake_quiz_questions')
    .eq('wake_quiz_public_slug', trimmed)
    .maybeSingle()

  if (error || !row) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    hero: mergeWakeQuizHero(row.wake_quiz_hero),
    logoUrl: (row.wake_quiz_logo_url as string | null) ?? null,
    questions: mergeWakeQuizQuestions(row.wake_quiz_questions),
  })
}
