const THUMB_WIDTHS = [640, 960, 1280, 1920] as const

function isDirectUrl(url: string) {
  return !url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')
}

function palhaSizedSrc(url: string, width: number) {
  if (isDirectUrl(url)) return url
  const w = THUMB_WIDTHS.find((size) => size >= width) || 1920
  return `/api/palha/thumb?url=${encodeURIComponent(url)}&w=${w}`
}

export function palhaGridImageSrc(url: string, displayWidth = 420) {
  return palhaSizedSrc(url, Math.ceil(displayWidth * 2))
}

export function palhaLightboxImageSrc(url: string) {
  return palhaSizedSrc(url, 1920)
}
