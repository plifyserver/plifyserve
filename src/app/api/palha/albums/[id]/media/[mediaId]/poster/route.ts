import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { publicizeAlbum } from '@/lib/palha/site-settings-shared'
import { setPalhaMediaPoster } from '@/lib/palha/site-settings'

type Context = { params: Promise<{ id: string; mediaId: string }> }

export async function PUT(request: NextRequest, context: Context) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id, mediaId } = await context.params
  const body = (await request.json().catch(() => ({}))) as { url?: string; frame?: number }
  const url = String(body.url || '').trim()
  if (!url) return NextResponse.json({ error: 'Imagem de capa inválida' }, { status: 400 })

  try {
    const settings = await setPalhaMediaPoster(id, mediaId, {
      url,
      frame: Number.isFinite(Number(body.frame)) && Number(body.frame) >= 0 ? Number(body.frame) : undefined,
    })
    const album = settings.gallery.albums.find((item) => item.id === id)
    if (!album) return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 })
    return NextResponse.json({ album: publicizeAlbum(album, true) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível salvar a capa do vídeo.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

