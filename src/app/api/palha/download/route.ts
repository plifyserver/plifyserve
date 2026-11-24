import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import {
  createPalhaR2OriginalDownload,
  getPalhaR2Object,
  isPalhaGalleryObjectKey,
  palhaR2KeyFromUrl,
} from '@/lib/palha/r2'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const src = String(request.nextUrl.searchParams.get('url') || '')
  const nameParam = String(request.nextUrl.searchParams.get('name') || '')
  const key = palhaR2KeyFromUrl(src)
  // Mesma regra do thumb: chave gallery/ válida. Evita carregar o JSON inteiro do site
  // a cada foto (813×) — isso gerava 500 sob carga no “Baixar todas”.
  if (!key || !isPalhaGalleryObjectKey(key)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  try {
    if (request.nextUrl.searchParams.get('raw') === '1') {
      const object = await getPalhaR2Object(key)
      const bytes = await object.Body?.transformToByteArray()
      if (!bytes?.length) {
        return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
      }
      // Proxy só para arquivos pequenos; o cliente deve preferir URL assinada.
      if (bytes.byteLength > 12 * 1024 * 1024) {
        return NextResponse.json({ error: 'Arquivo grande demais para proxy' }, { status: 413 })
      }
      const ascii = (nameParam || key.split('/').pop() || 'arquivo').replace(/[^\w.\- ]+/g, '_')
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          'Content-Type': object.ContentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${ascii}"`,
          'Cache-Control': 'private, no-store, no-transform',
        },
      })
    }

    const download = await createPalhaR2OriginalDownload(key, nameParam || key.split('/').pop() || 'arquivo')
    return NextResponse.json(download, {
      headers: { 'Cache-Control': 'private, no-store, no-transform' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível preparar o download.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
