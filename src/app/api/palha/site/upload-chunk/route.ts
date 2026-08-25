import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { appendPalhaR2Chunk } from '@/lib/palha/r2'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const form = await request.formData()
  const uploadId = String(form.get('uploadId') || '')
  const file = form.get('file')
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ error: 'Trecho não enviado' }, { status: 400 })
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'Trecho grande demais' }, { status: 400 })
  }

  try {
    const chunk = Buffer.from(await file.arrayBuffer())
    await appendPalhaR2Chunk(uploadId, chunk)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
