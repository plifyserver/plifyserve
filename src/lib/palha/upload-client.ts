import type { PalhaMediaKind } from '@/lib/palha/site-settings-shared'

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif)$/i

function extOf(name: string) {
  return name.split('.').pop()?.toLowerCase() || ''
}

function guessContentType(file: File) {
  if (file.type) return file.type
  const ext = extOf(file.name)
  if (ext === 'mov') return 'video/quicktime'
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4'
  if (ext === 'webm') return 'video/webm'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'heic') return 'image/heic'
  if (ext === 'heif') return 'image/heif'
  return 'application/octet-stream'
}

export function isPalhaMediaFile(file: File) {
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) return true
  return IMAGE_EXT.test(file.name) || VIDEO_EXT.test(file.name)
}

function mediaKind(file: File, contentType: string): PalhaMediaKind {
  if (contentType.startsWith('video/') || VIDEO_EXT.test(file.name)) return 'video'
  return 'image'
}

export function palhaFileKind(file: File): PalhaMediaKind {
  return mediaKind(file, guessContentType(file))
}

async function readResponseJson(res: Response) {
  const text = await res.text()
  if (!text) return {} as { url?: string; signedUrl?: string; publicUrl?: string; contentType?: string; kind?: string; error?: string }
  try {
    return JSON.parse(text) as {
      url?: string
      signedUrl?: string
      publicUrl?: string
      contentType?: string
      kind?: string
      error?: string
    }
  } catch {
    throw new Error(
      res.status === 413 || res.status === 502
        ? 'Arquivo grande demais. Tente um vídeo mais curto ou menos fotos de uma vez.'
        : 'O servidor não devolveu uma resposta válida. Tente de novo.',
    )
  }
}

function putFileWithProgress(url: string, file: File, contentType: string, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`R2 ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('cors'))
    xhr.send(file)
  })
}

async function uploadViaServer(file: File, folder: string, onProgress?: (percent: number) => void) {
  onProgress?.(12)
  const form = new FormData()
  form.set('folder', folder)
  form.set('file', file)
  const res = await fetch('/api/palha/site/media', { method: 'POST', body: form, cache: 'no-store' })
  const data = await readResponseJson(res)
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Não foi possível enviar o arquivo.')
  }
  onProgress?.(100)
  return {
    url: data.url,
    kind: (data.kind === 'video' ? 'video' : mediaKind(file, guessContentType(file))) as PalhaMediaKind,
  }
}

export async function uploadPalhaMediaFile(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
) {
  const contentType = guessContentType(file)
  try {
    const signedRes = await fetch('/api/palha/site/signed-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        folder,
        filename: file.name || 'arquivo',
        contentType,
      }),
    })
    const signed = await readResponseJson(signedRes)
    if (!signedRes.ok || !signed.signedUrl || !signed.publicUrl) {
      throw new Error(signed.error || 'signed')
    }
    onProgress?.(4)
    try {
      await putFileWithProgress(signed.signedUrl, file, signed.contentType || contentType, onProgress)
    } catch {
      const put = await fetch(signed.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': signed.contentType || contentType },
        body: file,
      })
      if (!put.ok) throw new Error(`R2 ${put.status}`)
    }
    onProgress?.(100)
    return {
      url: signed.publicUrl,
      kind: signed.kind === 'video' ? ('video' as PalhaMediaKind) : mediaKind(file, contentType),
    }
  } catch {
    return uploadViaServer(file, folder, onProgress)
  }
}
