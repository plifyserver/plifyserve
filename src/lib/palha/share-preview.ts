const OG_WIDTH = 1200
const OG_HEIGHT = 630

function coverDraw(image: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = OG_WIDTH
  canvas.height = OG_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const scale = Math.max(OG_WIDTH / Math.max(1, width), OG_HEIGHT / Math.max(1, height))
  const drawW = width * scale
  const drawH = height * scale
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT)
  ctx.drawImage(image, (OG_WIDTH - drawW) / 2, (OG_HEIGHT - drawH) / 2, drawW, drawH)
  return canvas
}

export async function toPalhaShareJpeg(source: File | string) {
  try {
    const blob =
      typeof source === 'string' ? await (await fetch(source, { mode: 'cors', cache: 'no-store' })).blob() : source
    const bitmap = await createImageBitmap(blob)
    const canvas = coverDraw(bitmap, bitmap.width, bitmap.height)
    bitmap.close()
    if (!canvas) return null
    const output = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (!output) return null
    return new File([output], `whatsapp-${Date.now()}.jpg`, { type: 'image/jpeg' })
  } catch {
    return null
  }
}
