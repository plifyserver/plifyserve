import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { startPalhaR2ChunkedUpload } from '@/lib/palha/r2'

export const maxDuration = 60

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

  try {
    const started = await startPalhaR2ChunkedUpload(folder, filename, contentType)
    return NextResponse.json({
      ...started,
      kind: contentType.startsWith('video/') ? 'video' : 'image',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
