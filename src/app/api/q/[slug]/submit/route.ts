import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .select('id, is_published')
    .eq('slug', slug)
    .single()

  if (quizErr || !quiz || !quiz.is_published) {
    return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    lead_name?: unknown
    lead_email?: unknown
    lead_phone?: unknown
    answers?: unknown
    utm?: unknown
  }

  const payload = {
    quiz_id: quiz.id,
    lead_name: typeof body.lead_name === 'string' ? body.lead_name.trim().slice(0, 120) : null,
    lead_email: typeof body.lead_email === 'string' ? body.lead_email.trim().slice(0, 180) : null,
    lead_phone: typeof body.lead_phone === 'string' ? body.lead_phone.trim().slice(0, 40) : null,
    answers: body.answers && typeof body.answers === 'object' ? body.answers : {},
    utm: body.utm && typeof body.utm === 'object' ? body.utm : {},
    ip_address: request.headers.get('x-forwarded-for') || null,
    user_agent: request.headers.get('user-agent') || null,
  }

  const { data, error } = await supabase
    .from('quiz_responses')
    .insert(payload)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, id: data?.id })
}

