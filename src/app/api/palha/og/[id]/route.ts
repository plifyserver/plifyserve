import { NextResponse, type NextRequest } from 'next/server'
import sharp from 'sharp'
import { palhaR2KeyFromUrl, getPalhaR2Object } from '@/lib/palha/r2'
import { palhaAlbumShareImage } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

type Context = { params: Promise<{ id: string }> }

async function sourceBytes(src: string) {
  const key = palhaR2KeyFromUrl(src)
  if (key) {
    const object = await getPalhaR2Object(key)
    const bytes = await object.Body?.transformToByteArray()
    if (!bytes?.length) return null
    return Buffer.from(bytes)
  }
  const remote = await fetch(src, { cache: 'no-store' })
  if (!remote.ok) return null
  return Buffer.from(await remote.arrayBuffer())
}

async function coverResponse(id: string) {
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  const src = palhaAlbumShareImage(album)
  if (!src) return new NextResponse(null, { status: 404 })

  const input = await sourceBytes(src)
  if (!input?.length) return new NextResponse(null, { status: 404 })

  const jpeg = await sharp(input, { failOn: 'none', sequentialRead: true })
    .rotate()
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()

  return new NextResponse(jpeg, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
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
