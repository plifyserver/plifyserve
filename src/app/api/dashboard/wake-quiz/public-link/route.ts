import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPublicBaseUrl } from '@/lib/publicBaseUrl'
import {
  generateRandomWakeQuizPublicSlug,
  isValidWakeQuizPublicSlug,
  validateWakeQuizPublicSlug,
} from '@/lib/wakeQuizSlug'

function makeSlug(): string {
  return generateRandomWakeQuizPublicSlug()
}

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: row, error } = await supabase
    .from('profiles')
    .select('wake_quiz_public_slug')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let slug = row?.wake_quiz_public_slug as string | null

  if (!slug || !isValidWakeQuizPublicSlug(slug)) {
    let lastErr = ''
    for (let attempt = 0; attempt < 8; attempt++) {
      slug = makeSlug()
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ wake_quiz_public_slug: slug, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (!updErr) break
      lastErr = updErr.message
      if (!updErr.message.includes('duplicate') && !updErr.code?.includes('23')) break
    }
    if (!slug || !isValidWakeQuizPublicSlug(slug)) {
      return NextResponse.json(
        { error: lastErr || 'Não foi possível gerar o link do quiz.' },
        { status: 500 }
      )
    }
  }

  const base = getPublicBaseUrl(request)
  const path = `/q/wake/${slug}`
  const url = base ? `${base.replace(/\/$/, '')}${path}` : null

  return NextResponse.json({ slug, url, path })
}

export async function PATCH(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const supabase = await createClient()

  const raw = typeof body.slug === 'string' ? body.slug : ''
  const wantsRandom = body.random === true

  if (wantsRandom) {
    let lastErr = ''
    let finalSlug: string | null = null
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = makeSlug()
      const { data, error } = await supabase
        .from('profiles')
        .update({ wake_quiz_public_slug: candidate, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('wake_quiz_public_slug')
        .maybeSingle()

      if (!error) {
        finalSlug = (data?.wake_quiz_public_slug as string | null) ?? candidate
        break
      }
      lastErr = error.message
      const dup =
        error.code === '23505' ||
        /duplicate|unique/i.test(error.message || '') ||
        /profiles_wake_quiz_public_slug/i.test(error.message || '')
      if (!dup) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
    if (!finalSlug) {
      return NextResponse.json(
        { error: lastErr || 'Não foi possível gerar um identificador único.' },
        { status: 500 }
      )
    }
    const base = getPublicBaseUrl(request)
    const path = `/q/wake/${finalSlug}`
    const url = base ? `${base.replace(/\/$/, '')}${path}` : null
    return NextResponse.json({ slug: finalSlug, url, path })
  }

  const parsed = validateWakeQuizPublicSlug(raw)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ wake_quiz_public_slug: parsed.slug, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('wake_quiz_public_slug')
    .maybeSingle()

  if (error) {
    const dup =
      error.code === '23505' ||
      /duplicate|unique/i.test(error.message || '') ||
      /profiles_wake_quiz_public_slug/i.test(error.message || '')
    if (dup) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este link. Escolha outro identificador.' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const slug = (data?.wake_quiz_public_slug as string | null) ?? parsed.slug
  const base = getPublicBaseUrl(request)
  const path = `/q/wake/${slug}`
  const url = base ? `${base.replace(/\/$/, '')}${path}` : null

  return NextResponse.json({ slug, url, path })
}
