import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { isAlbumUnlocked, palhaAlbumLockCookie } from '@/lib/palha/album-password'
import { publicizeAlbum } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const { id } = await context.params
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  if (!album) return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 })

  const unlocked = isAlbumUnlocked(album)
  const response = NextResponse.json(
    { locked: !unlocked, album: publicizeAlbum(album, unlocked) },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
  if (!unlocked) {
    const cookie = palhaAlbumLockCookie(album.id)
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }
  return response
}
