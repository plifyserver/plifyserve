import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { sendFeedbackSuggestionEmail } from '@/lib/mail/sendFeedbackSuggestionEmail'

const CATEGORIES = [
  'Nova funcionalidade',
  'Erros / Bugs',
  'Melhoria de interface',
  'Performance',
  'Outros',
] as const

type Category = (typeof CATEGORIES)[number]

function normalizeCategory(v: unknown): Category {
  const s = typeof v === 'string' ? v.trim() : ''
  return (CATEGORIES as readonly string[]).includes(s) ? (s as Category) : 'Outros'
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('feedback_suggestions')
    .select('id, title, category, description, likes_count, dislikes_count, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: { title?: string; category?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const title = String(body.title ?? '').trim()
  const description = String(body.description ?? '').trim()
  const category = normalizeCategory(body.category)

  if (title.length < 3) return NextResponse.json({ error: 'Título muito curto' }, { status: 400 })
  if (description.length < 10) return NextResponse.json({ error: 'Descrição muito curta' }, { status: 400 })

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('feedback_suggestions')
    .insert({
      user_id: userId,
      title,
      category,
      description,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await sendFeedbackSuggestionEmail({
      title,
      category,
      description,
      fromUserEmail: (profile as { email?: string | null } | null)?.email ?? null,
      fromUserName: (profile as { full_name?: string | null } | null)?.full_name ?? null,
    })
  } catch {
    // Mesmo se email falhar, mantemos a sugestão registrada.
  }

  return NextResponse.json({ success: true, id: data.id })
}

