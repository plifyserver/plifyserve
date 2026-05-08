import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

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
  const isOwner = Boolean(userId && quiz.user_id === userId)
  if (!quiz.is_published && !isOwner) return NextResponse.json({ error: 'Quiz não publicado' }, { status: 404 })

  const { data: questions, error: qErr } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, order, title, description, emoji, kind, required, options, placeholder')
    .eq('quiz_id', quiz.id)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true })

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // Branding do dono (para mostrar no topo do quiz)
  let brandName: string | null = null
  try {
    const admin = createServiceRoleClient()
    const [{ data: settings }, { data: profile }] = await Promise.all([
      admin.from('app_settings').select('app_name').eq('user_id', quiz.user_id).maybeSingle(),
      admin.from('profiles').select('company_name, full_name').eq('id', quiz.user_id).maybeSingle(),
    ])
    brandName =
      (settings?.app_name && String(settings.app_name).trim()) ||
      (profile?.company_name && String(profile.company_name).trim()) ||
      (profile?.full_name && String(profile.full_name).trim()) ||
      null
  } catch {
    brandName = null
  }

  const { user_id: _ownerId, ...publicQuiz } = quiz
  return NextResponse.json({ quiz: publicQuiz, questions: questions ?? [], isOwner, brandName })
}

