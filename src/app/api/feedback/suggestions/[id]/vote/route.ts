import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'

type RouteCtx = { params: Promise<{ id: string }> }

type Vote = 'like' | 'dislike' | 'none'

function normalizeVote(v: unknown): Vote {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : ''
  if (s === 'like' || s === 'dislike' || s === 'none') return s
  return 'none'
}

export async function POST(request: NextRequest, ctx: RouteCtx) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await ctx.params
  let body: { vote?: Vote }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const nextVote = normalizeVote(body.vote)
  const svc = createServiceRoleClient()

  const { data: suggestion, error: sErr } = await svc
    .from('feedback_suggestions')
    .select('id, likes_count, dislikes_count')
    .eq('id', id)
    .maybeSingle()

  if (sErr || !suggestion) return NextResponse.json({ error: 'Sugestão não encontrada' }, { status: 404 })

  const { data: existing } = await svc
    .from('feedback_votes')
    .select('id, vote')
    .eq('suggestion_id', id)
    .eq('user_id', userId)
    .maybeSingle()

  const prevVote = (existing as { vote?: Vote } | null)?.vote === 'like' || (existing as { vote?: Vote } | null)?.vote === 'dislike'
    ? ((existing as { vote: Vote }).vote)
    : 'none'

  let likes = Number(suggestion.likes_count ?? 0) || 0
  let dislikes = Number(suggestion.dislikes_count ?? 0) || 0

  const dec = (v: Vote) => {
    if (v === 'like') likes = Math.max(0, likes - 1)
    if (v === 'dislike') dislikes = Math.max(0, dislikes - 1)
  }
  const inc = (v: Vote) => {
    if (v === 'like') likes += 1
    if (v === 'dislike') dislikes += 1
  }

  // Ajusta contadores
  dec(prevVote)
  if (nextVote !== 'none') inc(nextVote)

  // Persiste voto
  if (nextVote === 'none') {
    if (existing?.id) {
      await svc.from('feedback_votes').delete().eq('id', (existing as { id: string }).id)
    }
  } else {
    await svc.from('feedback_votes').upsert(
      { suggestion_id: id, user_id: userId, vote: nextVote },
      { onConflict: 'suggestion_id,user_id' }
    )
  }

  // Atualiza contadores na sugestão
  await svc
    .from('feedback_suggestions')
    .update({ likes_count: likes, dislikes_count: dislikes })
    .eq('id', id)

  return NextResponse.json({ success: true, likes_count: likes, dislikes_count: dislikes, vote: nextVote })
}

