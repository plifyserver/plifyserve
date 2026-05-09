import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_MB = 2

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: 'Use JPEG, PNG, WebP, GIF ou SVG.' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/wake-quiz/logo.${ext}`

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })

  if (error) {
    const message =
      error.message === 'Bucket not found'
        ? 'Configure o bucket de storage no Supabase.'
        : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
  const logoUrl = urlData.publicUrl

  const { error: updErr } = await supabase
    .from('profiles')
    .update({ wake_quiz_logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ logoUrl })
}

export async function DELETE() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()

  const prefix = `${userId}/wake-quiz`
  const { data: listed } = await supabase.storage.from('avatars').list(prefix)
  if (listed?.length) {
    await supabase.storage.from('avatars').remove(listed.map((f) => `${prefix}/${f.name}`))
  }

  await supabase
    .from('profiles')
    .update({ wake_quiz_logo_url: null, updated_at: new Date().toISOString() })
    .eq('id', userId)

  return NextResponse.json({ logoUrl: null })
}
