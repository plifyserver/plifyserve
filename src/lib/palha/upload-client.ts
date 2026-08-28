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
  if (!text) {
    return {} as {
      url?: string
      path?: string
      uploadId?: string
      publicUrl?: string
      contentType?: string
      kind?: string
      error?: string
    }
  }
  try {
    return JSON.parse(text) as {
      url?: string
      path?: string
      uploadId?: string
      publicUrl?: string
      contentType?: string
      kind?: string
      error?: string
    }
  } catch {
    throw new Error('O servidor não devolveu uma resposta válida. Tente de novo.')
  }
}

const SMALL_SERVER_UPLOAD = 3.5 * 1024 * 1024
const CHUNK_SIZE = 3.5 * 1024 * 1024
const UPLOAD_REQUEST_TIMEOUT = 55_000

function postChunkWithProgress(uploadId: string, blob: Blob, onChunkProgress?: (ratio: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData()
    form.set('uploadId', uploadId)
    form.set('file', blob, 'chunk.bin')
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/palha/site/upload-chunk')
    xhr.timeout = UPLOAD_REQUEST_TIMEOUT
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onChunkProgress) return
      onChunkProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else {
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string }
          reject(new Error(data.error || 'Não foi possível enviar um trecho do vídeo.'))
        } catch {
          reject(new Error('Não foi possível enviar um trecho do vídeo.'))
        }
      }
    }
    xhr.onerror = () => reject(new Error('Falha de rede no envio do vídeo.'))
    xhr.ontimeout = () => reject(new Error('O envio de um trecho demorou demais. Tente novamente.'))
    xhr.send(form)
  })
}

async function fetchWithUploadTimeout(input: RequestInfo | URL, init: RequestInit, message: string) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), UPLOAD_REQUEST_TIMEOUT)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw new Error(message)
    throw err
  } finally {
    window.clearTimeout(timer)
  }
}

async function uploadViaServer(file: File, folder: string, onProgress?: (percent: number) => void) {
  onProgress?.(12)
  const form = new FormData()
  form.set('folder', folder)
  form.set('file', file)
  const res = await fetchWithUploadTimeout(
    '/api/palha/site/media',
    { method: 'POST', body: form, cache: 'no-store' },
    'O envio do arquivo demorou demais. Tente novamente.',
  )
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

async function uploadViaChunks(file: File, folder: string, onProgress?: (percent: number) => void) {
  const contentType = guessContentType(file)
  const startedRes = await fetchWithUploadTimeout(
    '/api/palha/site/upload-init',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        folder,
        filename: file.name || 'arquivo',
        contentType,
      }),
    },
    'O servidor demorou para preparar o envio. Tente novamente.',
  )
  const started = await readResponseJson(startedRes)
  if (!startedRes.ok || !started.uploadId || !started.publicUrl) {
    throw new Error(started.error || 'Não foi possível preparar o envio do vídeo.')
  }

  const total = Math.max(1, file.size)
  let offset = 0
  while (offset < file.size) {
    const end = Math.min(offset + CHUNK_SIZE, file.size)
    const blob = file.slice(offset, end)
    const base = offset / total
    const span = (end - offset) / total
    await postChunkWithProgress(started.uploadId, blob, (ratio) => {
      onProgress?.(Math.max(1, Math.min(96, Math.round((base + span * ratio) * 96))))
    })
    offset = end
  }

  onProgress?.(97)
  const doneRes = await fetchWithUploadTimeout(
    '/api/palha/site/upload-complete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ uploadId: started.uploadId }),
    },
    'O servidor demorou para finalizar o vídeo. Tente novamente.',
  )
  const done = await readResponseJson(doneRes)
  if (!doneRes.ok || !done.publicUrl) {
    throw new Error(done.error || 'Não foi possível finalizar o envio do vídeo.')
  }
  onProgress?.(100)
  return {
    url: done.publicUrl,
    kind: started.kind === 'video' || mediaKind(file, contentType) === 'video' ? ('video' as PalhaMediaKind) : mediaKind(file, contentType),
  }
}

export async function uploadPalhaMediaFile(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void,
) {
  if (file.size <= SMALL_SERVER_UPLOAD) {
    return uploadViaServer(file, folder, onProgress)
  }
  return uploadViaChunks(file, folder, onProgress)
}
