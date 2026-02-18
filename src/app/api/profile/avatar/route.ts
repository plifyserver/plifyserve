import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
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
    return NextResponse.json({ error: 'Use JPEG, PNG, WebP ou GIF.' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${userId}/avatar.${ext}`

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) {
    const message =
      error.message === 'Bucket not found'
        ? 'Bucket "avatars" não existe. Execute o schema.sql no Supabase (Storage).'
        : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
  const publicUrl = urlData.publicUrl

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
