import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { palhaAlbumUnlockCookie, verifyPalhaAlbumPassword } from '@/lib/palha/album-password'
import { publicizeAlbum } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'

type Context = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: Context) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const { id } = await context.params
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  if (!album) return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 })
  if (!album.passwordHash) {
    return NextResponse.json({ locked: false, album: publicizeAlbum(album, true) })
  }

  const body = (await request.json().catch(() => ({}))) as { password?: string }
  const password = String(body.password || '')
  const ok = await verifyPalhaAlbumPassword(password, album.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }

  const cookie = palhaAlbumUnlockCookie(album)
  const response = NextResponse.json({ locked: false, album: publicizeAlbum(album, true) })
  response.cookies.set(cookie.name, cookie.value, cookie.options)
  return response
}
