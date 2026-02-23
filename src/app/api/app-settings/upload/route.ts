import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

const ACCEPTED_LOGO = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ACCEPTED_FAVICON = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/gif']
const MAX_MB = 2

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = (formData.get('type') as string) || 'logo' // 'logo' | 'favicon'

  if (!file) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }
  const accepted = type === 'favicon' ? ACCEPTED_FAVICON : ACCEPTED_LOGO
  if (!accepted.includes(file.type)) {
    return NextResponse.json(
      { error: type === 'favicon' ? 'Use ICO, PNG, SVG ou GIF.' : 'Use JPEG, PNG, WebP, GIF ou SVG.' },
      { status: 400 }
    )
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || (type === 'favicon' ? 'ico' : 'png')
  const path = `${userId}/settings/${type}.${ext}`

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) {
    const message =
      error.message === 'Bucket not found'
        ? 'Bucket "avatars" não existe. Configure o Storage no Supabase.'
        : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}
