import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaR2Object, isPalhaGalleryObjectKey, palhaR2KeyFromUrl } from '@/lib/palha/r2'

export const runtime = 'nodejs'
export const maxDuration = 30

const WIDTHS = new Set([360, 480, 640, 960, 1280, 1920])

function redirectToSource(source: string) {
  try {
    return NextResponse.redirect(new URL(source), 302)
  } catch {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }
}

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const source = request.nextUrl.searchParams.get('url') || ''
  const debug = request.nextUrl.searchParams.get('debug') === '1'
  const wanted = Number(request.nextUrl.searchParams.get('w') || 480)
  const width = WIDTHS.has(wanted) ? wanted : 480
  const key = palhaR2KeyFromUrl(source)
  if (!key || !isPalhaGalleryObjectKey(key)) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })
  }

  try {
    const sharpMod = await import('sharp')
    const sharp = sharpMod.default || sharpMod
    const object = await getPalhaR2Object(key)
    const type = (object.ContentType || '').toLowerCase()
    if (type.startsWith('video/')) {
      return NextResponse.json({ error: 'Vídeo' }, { status: 400 })
    }
    if (!object.Body) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })

    const input = Buffer.from(await object.Body.transformToByteArray())
    if (input.byteLength < 32) {
      return NextResponse.json({ error: 'Arquivo vazio' }, { status: 404 })
    }

    const quality = width <= 640 ? 62 : width <= 960 ? 68 : 72
    const output = await sharp(input, { failOn: 'none', sequentialRead: true, limitInputPixels: 268402688 })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 2 })
      .toBuffer()

    return new NextResponse(new Uint8Array(output), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch (error) {
    if (debug) {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      return NextResponse.json({ error: 'Falha ao gerar prévia', message, key, width }, { status: 502 })
    }
    // Se Sharp/R2 falhar, devolve a original para o álbum não ficar em branco.
    return redirectToSource(source)
  }
}
