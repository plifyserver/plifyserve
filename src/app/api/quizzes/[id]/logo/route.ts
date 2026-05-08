import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_MB = 2

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: quizId } = await params
  const supabase = await createClient()

  const { data: row, error: qerr } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('user_id', userId)
    .maybeSingle()

  if (qerr || !row) return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: 'Use JPEG, PNG, WebP, GIF ou SVG.' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const objectPath = `${userId}/quizzes/${quizId}/logo.${ext}`

  const { data: up, error: upErr } = await supabase.storage.from('avatars').upload(objectPath, file, {
    upsert: true,
  })

  if (upErr) {
    const message =
      upErr.message === 'Bucket not found'
        ? 'Bucket "avatars" não existe. Configure o Storage no Supabase.'
        : upErr.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(up.path)

  const now = new Date().toISOString()
  // Evita cache da logo antiga (URL pode ser a mesma após upsert)
  const version = Date.now()
  const logoUrl = `${publicUrl}${publicUrl.includes('?') ? '&' : '?'}v=${version}`
  const { data: quiz, error: updErr } = await supabase
    .from('quizzes')
    .update({ logo_url: logoUrl, updated_at: now })
    .eq('id', quizId)
    .eq('user_id', userId)
    .select()
    .single()

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json({ url: logoUrl, quiz })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: quizId } = await params
  const supabase = await createClient()

  const { data: row, error: qerr } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('user_id', userId)
    .maybeSingle()

  if (qerr || !row) return NextResponse.json({ error: 'Quiz não encontrado' }, { status: 404 })

  const folderPath = `${userId}/quizzes/${quizId}`
  const { data: files } = await supabase.storage.from('avatars').list(folderPath)
  const paths = (files ?? []).map((f) => `${folderPath}/${f.name}`)
  if (paths.length) await supabase.storage.from('avatars').remove(paths)

  const now = new Date().toISOString()
  const { data: quiz, error: updErr } = await supabase
    .from('quizzes')
    .update({ logo_url: null, updated_at: now })
    .eq('id', quizId)
    .eq('user_id', userId)
    .select()
    .single()

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json({ url: null, quiz })
}
