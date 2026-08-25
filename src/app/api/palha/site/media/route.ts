import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { mediaKindFromMime } from '@/lib/palha/site-settings-shared'
import { uploadPalhaR2Object } from '@/lib/palha/r2'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  const folder = String(form.get('folder') || 'gallery').replace(/[^a-zA-Z0-9/_-]/g, '')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }
  if (!folder.startsWith('gallery')) {
    return NextResponse.json({ error: 'Pasta inválida' }, { status: 400 })
  }
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    const name = file.name.toLowerCase()
    const okExt = /\.(jpe?g|png|webp|gif|heic|heif|mp4|webm|mov|m4v)$/.test(name)
    if (!okExt) return NextResponse.json({ error: 'Use imagem ou vídeo.' }, { status: 400 })
  }

  try {
    const url = await uploadPalhaR2Object(folder, file)
    return NextResponse.json({
      url,
      kind: file.type.startsWith('video/') ? 'video' : mediaKindFromMime(file.type),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
