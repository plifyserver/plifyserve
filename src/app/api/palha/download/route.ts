import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaR2Object, palhaR2KeyFromUrl } from '@/lib/palha/r2'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { collectPalhaMediaUrls } from '@/lib/palha/site-settings-shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

function downloadName(raw: string, fallback: string) {
  const cleaned = raw.replace(/["\r\n\\]/g, '').trim() || fallback
  return cleaned.slice(0, 120)
}

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const src = String(request.nextUrl.searchParams.get('url') || '')
  const nameParam = String(request.nextUrl.searchParams.get('name') || '')
  const key = palhaR2KeyFromUrl(src)
  if (!key) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  try {
    const settings = await getPalhaSiteSettings()
    const allowed = [...collectPalhaMediaUrls(settings)].some((mediaUrl) => palhaR2KeyFromUrl(mediaUrl) === key)
    if (!allowed) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    const object = await getPalhaR2Object(key)
    const body = object.Body
    if (!body) {
      return NextResponse.json({ error: 'Arquivo vazio' }, { status: 404 })
    }

    const filename = downloadName(nameParam || key.split('/').pop() || '', 'arquivo')
    const ascii = filename.replace(/[^\w.\- ]+/g, '_') || 'arquivo'
    const type = object.ContentType || 'application/octet-stream'
    const headers = new Headers({
      'Content-Type': type,
      'Content-Disposition': `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Cache-Control': 'private, no-store',
    })
    if (object.ContentLength) headers.set('Content-Length', String(object.ContentLength))

    return new NextResponse(body.transformToWebStream(), { headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível baixar o arquivo.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
