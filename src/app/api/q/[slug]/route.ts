import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

type QuizRow = {
  id: string
  user_id: string
  is_published: boolean
  title: string
  slug: string
  logo_url: string | null
  intro_title: string | null
  intro_description: string | null
  thanks_title: string | null
  thanks_description: string | null
  thanks_badge_emoji: string | null
  thanks_badge_text: string | null
  thanks_title_top: string | null
  thanks_title_bottom: string | null
  thanks_highlights: unknown
  thanks_callout_title: string | null
  thanks_callout_text: string | null
  hero_badge_emoji: string | null
  hero_badge_text: string | null
  hero_title_top: string | null
  hero_title_bottom: string | null
  hero_description: string | null
  hero_floating_items: unknown
  start_button_label: string | null
  social_proof_text: string | null
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id ?? null

  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .select(
      [
        'id',
        'user_id',
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
      ].join(', ')
    )
    .eq('slug', slug)
    .single()

  if (quizErr || !quiz) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }
  const quizRow = quiz as unknown as QuizRow
  const isOwner = Boolean(userId && quizRow.user_id === userId)
  if (!quizRow.is_published && !isOwner) return NextResponse.json({ error: 'Quiz não publicado' }, { status: 404 })

  const { data: questions, error: qErr } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, order, title, description, emoji, kind, required, options, placeholder')
    .eq('quiz_id', quizRow.id)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true })

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // Branding do dono (para mostrar no topo do quiz)
  let brandName: string | null = null
  try {
    const admin = createServiceRoleClient()
    const [{ data: settings }, { data: profile }] = await Promise.all([
      admin.from('app_settings').select('app_name').eq('user_id', quizRow.user_id).maybeSingle(),
      admin.from('profiles').select('company_name, full_name').eq('id', quizRow.user_id).maybeSingle(),
    ])
    brandName =
      (settings?.app_name && String(settings.app_name).trim()) ||
      (profile?.company_name && String(profile.company_name).trim()) ||
      (profile?.full_name && String(profile.full_name).trim()) ||
      null
  } catch {
    brandName = null
  }

  const { user_id: _ownerId, ...publicQuiz } = quizRow
  return NextResponse.json({ quiz: publicQuiz, questions: questions ?? [], isOwner, brandName })
}

