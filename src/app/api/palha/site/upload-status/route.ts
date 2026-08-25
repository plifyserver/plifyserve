import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { isPalhaGalleryObjectKey, palhaR2ObjectExists, stampPalhaR2ContentType } from '@/lib/palha/r2'

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = (await request.json()) as { path?: string; contentType?: string }
  const path = String(body.path || '')
  const contentType = String(body.contentType || '')
  if (!isPalhaGalleryObjectKey(path)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  const exists = await palhaR2ObjectExists(path)
  if (!exists) return NextResponse.json({ ok: false }, { status: 404 })

  try {
    await stampPalhaR2ContentType(path, contentType)
  } catch {
    // O arquivo já está no R2; o tipo MIME é só um extra.
  }
  return NextResponse.json({ ok: true })
}
