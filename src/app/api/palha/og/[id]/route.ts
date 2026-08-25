import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaR2Object, palhaR2KeyFromUrl } from '@/lib/palha/r2'
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
    const bytes = await object.Body?.transformToByteArray()
    if (!bytes?.length) return new NextResponse(null, { status: 404 })
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': object.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  const remote = await fetch(src, { cache: 'no-store' })
  if (!remote.ok || !remote.body) return new NextResponse(null, { status: 404 })
  return new NextResponse(remote.body, {
    headers: {
      'Content-Type': remote.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function GET(_request: NextRequest, context: Context) {
  if (!palhaApiAllowed(_request)) return palhaApiForbidden()
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
