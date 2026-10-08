import { NextResponse, type NextRequest } from 'next/server'
import { palhaR2KeyFromUrl, getPalhaR2Object } from '@/lib/palha/r2'
import { palhaAlbumShareImage } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

type Context = { params: Promise<{ id: string }> }

async function coverResponse(id: string) {
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  const src = palhaAlbumShareImage(album)
  if (!src) return new NextResponse(null, { status: 404 })

  const key = palhaR2KeyFromUrl(src)
  if (key) {
    const object = await getPalhaR2Object(key)
    if (!object.Body) return new NextResponse(null, { status: 404 })
    const headers = new Headers({
      'Content-Type': object.ContentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    })
    if (object.ContentLength !== undefined) headers.set('Content-Length', String(object.ContentLength))
    return new NextResponse(object.Body.transformToWebStream(), { headers })
  }

  const remote = await fetch(src, { cache: 'no-store' })
  if (!remote.ok || !remote.body) return new NextResponse(null, { status: 404 })
  return new NextResponse(remote.body, {
    headers: {
      'Content-Type': remote.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params
    return await coverResponse(id)
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}

export async function HEAD(request: NextRequest, context: Context) {
  const response = await GET(request, context)
  return new NextResponse(null, { status: response.status, headers: response.headers })
}
