import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { createPalhaR2PartSignedUrl } from '@/lib/palha/r2'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { uploadId?: string; partNumber?: number }
  const uploadId = String(body.uploadId || '')
  const partNumber = Number(body.partNumber)

  try {
    const signed = await createPalhaR2PartSignedUrl(uploadId, partNumber)
    return NextResponse.json(signed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
