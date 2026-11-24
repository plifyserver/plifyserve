import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaR2Object, isPalhaGalleryObjectKey, palhaR2KeyFromUrl } from '@/lib/palha/r2'

export const runtime = 'nodejs'
export const maxDuration = 30

const WIDTHS = new Set([360, 480, 640, 960, 1280, 1920])

function fail(status: number, error: string, debug?: Record<string, unknown>) {
  return NextResponse.json(
    debug ? { error, ...debug } : { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

async function resizeWithSharp(input: Buffer, width: number) {
  const sharpMod = await import('sharp')
  const sharp = sharpMod.default || sharpMod
  const quality = width <= 640 ? 62 : width <= 960 ? 68 : 72
  const output = await sharp(input, {
    failOn: 'none',
    sequentialRead: true,
    limitInputPixels: 268402688,
    animated: false,
  })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 2 })
    .toBuffer()
  return { body: output, contentType: 'image/webp' as const }
}

async function resizeWithJimp(input: Buffer, width: number) {
  const { Jimp } = await import('jimp')
  const image = await Jimp.read(input)
  if (image.width > width) {
    image.resize({ w: width })
  }
  const quality = width <= 640 ? 70 : 78
  const body = await image.getBuffer('image/jpeg', { quality })
  return { body, contentType: 'image/jpeg' as const }
}

async function readObjectBuffer(key: string) {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const object = await getPalhaR2Object(key)
      const type = (object.ContentType || '').toLowerCase()
      if (type.startsWith('video/')) {
        return { error: 'video' as const }
      }
      if (!object.Body) {
        lastError = new Error('Sem body')
        continue
      }
      const input = Buffer.from(await object.Body.transformToByteArray())
      if (input.byteLength < 32) {
        lastError = new Error('Arquivo vazio')
        continue
      }
      return { input, type }
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()

  const source = request.nextUrl.searchParams.get('url') || ''
  const debug = request.nextUrl.searchParams.get('debug') === '1'
  const wanted = Number(request.nextUrl.searchParams.get('w') || 480)
  const width = WIDTHS.has(wanted) ? wanted : 480
  const key = palhaR2KeyFromUrl(source)
  if (!key || !isPalhaGalleryObjectKey(key)) {
    return fail(400, 'Arquivo inválido')
  }

  try {
    const loaded = await readObjectBuffer(key)
    if ('error' in loaded && loaded.error === 'video') {
      return fail(400, 'Vídeo')
    }
    if (!('input' in loaded)) {
      return fail(404, 'Arquivo não encontrado')
    }

    let result: { body: Buffer; contentType: string }
    let engine = 'sharp'
    try {
      result = await resizeWithSharp(loaded.input, width)
    } catch (sharpError) {
      engine = 'jimp'
      try {
        result = await resizeWithJimp(loaded.input, width)
      } catch (jimpError) {
        return fail(
          502,
          'Falha ao gerar prévia',
          debug
            ? {
                sharp: sharpError instanceof Error ? sharpError.message : String(sharpError),
                jimp: jimpError instanceof Error ? jimpError.message : String(jimpError),
                key,
                width,
              }
            : undefined,
        )
      }
    }

    if (!result.body?.byteLength || result.body.byteLength < 64) {
      return fail(502, 'Prévia vazia', debug ? { key, width, engine } : undefined)
    }

    return new NextResponse(new Uint8Array(result.body), {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        'X-Palha-Thumb-Engine': engine,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    const missing = /NoSuchKey|not found|404/i.test(message)
    return fail(
      missing ? 404 : 502,
      missing ? 'Arquivo não encontrado no armazenamento' : 'Falha ao gerar prévia',
      debug ? { message, key, width } : undefined,
    )
  }
}
