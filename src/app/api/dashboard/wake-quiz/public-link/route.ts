import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPublicBaseUrl } from '@/lib/publicBaseUrl'
import { isValidWakeQuizPublicSlug } from '@/lib/wakeQuizSlug'

function makeSlug(): string {
  const hex = crypto.randomUUID().replace(/-/g, '')
  return `w-${hex}`
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
        .update({ wake_quiz_public_slug: slug })
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
