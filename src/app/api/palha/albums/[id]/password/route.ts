import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { publicizeAlbum } from '@/lib/palha/site-settings-shared'
import { setPalhaAlbumPassword } from '@/lib/palha/site-settings'

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: Context) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as { password?: string }
  const password = String(body.password ?? '')
  if (password && password.trim().length < 4) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 4 caracteres.' }, { status: 400 })
  }

  try {
    const settings = await setPalhaAlbumPassword(id, password)
    const album = settings.gallery.albums.find((item) => item.id === id)
    if (!album) return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 })
    return NextResponse.json({ album: publicizeAlbum(album, true) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível salvar a senha.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
