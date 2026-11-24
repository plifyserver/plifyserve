import { NextResponse, type NextRequest } from 'next/server'
import sharp from 'sharp'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaR2Object, isPalhaGalleryObjectKey, palhaR2KeyFromUrl } from '@/lib/palha/r2'

export const maxDuration = 30

const WIDTHS = new Set([360, 480, 640, 960, 1280, 1920])

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const source = request.nextUrl.searchParams.get('url') || ''
  const wanted = Number(request.nextUrl.searchParams.get('w') || 480)
  const width = WIDTHS.has(wanted) ? wanted : 480
  const key = palhaR2KeyFromUrl(source)
  if (!key || !isPalhaGalleryObjectKey(key)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  try {
    const object = await getPalhaR2Object(key)
    const type = (object.ContentType || '').toLowerCase()
    if (type.startsWith('video/')) {
      return NextResponse.json({ error: 'Vídeo' }, { status: 400 })
    }
    if (!object.Body) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

    const input = Buffer.from(await object.Body.transformToByteArray())
    const quality = width <= 640 ? 62 : width <= 960 ? 68 : 72
    const output = await sharp(input, { failOn: 'none', sequentialRead: true })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 2 })
      .toBuffer()

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Falha ao gerar prévia' }, { status: 502 })
  }
}
