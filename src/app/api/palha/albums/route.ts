import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { publicizeAlbum, publicizeSiteSettings } from '@/lib/palha/site-settings-shared'
import { createPalhaAlbumRecord } from '@/lib/palha/site-settings'

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    name?: string
    eventDate?: string
    password?: string
  }
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Digite o nome do álbum.' }, { status: 400 })

  try {
    const { settings, album } = await createPalhaAlbumRecord({
      name,
      eventDate: String(body.eventDate || ''),
      password: String(body.password || ''),
    })
    return NextResponse.json({
      album: publicizeAlbum(album, true),
      settings: publicizeSiteSettings(settings, [], true),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível criar a coleção.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
