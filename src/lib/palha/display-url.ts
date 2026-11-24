const GRID_THUMB_WIDTHS = [360, 480, 640, 960] as const
const LIGHTBOX_THUMB_WIDTHS = [640, 960, 1280, 1920] as const

function isDirectUrl(url: string) {
  return !url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')
}

function pickWidth(widths: readonly number[], width: number) {
  return widths.find((size) => size >= width) || widths[widths.length - 1]
}

function palhaSizedSrc(url: string, width: number, widths: readonly number[]) {
  if (isDirectUrl(url)) return url
  const w = pickWidth(widths, width)
  return `/api/palha/thumb?url=${encodeURIComponent(url)}&w=${w}`
}

/** Prévia do grid: menor possível, com leve margem para retina. */
export function palhaGridImageSrc(url: string, displayWidth = 360) {
  const target = Math.min(960, Math.max(360, Math.ceil(displayWidth * 1.2)))
  return palhaSizedSrc(url, target, GRID_THUMB_WIDTHS)
}

/** Lightbox / zoom: qualidade maior. */
export function palhaLightboxImageSrc(url: string) {
  return palhaSizedSrc(url, 1600, LIGHTBOX_THUMB_WIDTHS)
}
