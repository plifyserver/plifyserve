import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { finishPalhaR2ChunkedUpload } from '@/lib/palha/r2'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = (await request.json()) as { uploadId?: string }
  const uploadId = String(body.uploadId || '')

  try {
    const finished = await finishPalhaR2ChunkedUpload(uploadId)
    return NextResponse.json(finished)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
