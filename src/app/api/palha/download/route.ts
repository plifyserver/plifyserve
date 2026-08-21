import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { createPalhaR2OriginalDownload, palhaR2KeyFromUrl } from '@/lib/palha/r2'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { collectPalhaMediaUrls } from '@/lib/palha/site-settings-shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

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

    const download = await createPalhaR2OriginalDownload(key, nameParam || key.split('/').pop() || 'arquivo')
    return NextResponse.json(download, {
      headers: { 'Cache-Control': 'private, no-store, no-transform' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível preparar o download.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
