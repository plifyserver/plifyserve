import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { createPalhaSignedUpload } from '@/lib/palha/site-settings'

const ACCEPTED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
])

function kindFromName(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video'
  return 'image'
}

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = (await request.json()) as { folder?: string; filename?: string; contentType?: string }
  const filename = String(body.filename || 'arquivo')
  const contentType = String(body.contentType || '')
  const folder = String(body.folder || 'gallery').replace(/[^a-zA-Z0-9/_-]/g, '')
  if (!folder.startsWith('gallery')) {
    return NextResponse.json({ error: 'Pasta inválida' }, { status: 400 })
  }
  if (contentType && !ACCEPTED.has(contentType) && !contentType.startsWith('image/') && !contentType.startsWith('video/')) {
    return NextResponse.json({ error: 'Use imagem ou vídeo.' }, { status: 400 })
  }

  try {
    const signed = await createPalhaSignedUpload(folder, filename, contentType)
    return NextResponse.json({
      ...signed,
      kind: contentType.startsWith('video/') || kindFromName(filename) === 'video' ? 'video' : 'image',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
