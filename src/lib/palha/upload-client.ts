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

type UploadResponse = {
  url?: string
  path?: string
  uploadId?: string
  publicUrl?: string
  contentType?: string
  kind?: string
  error?: string
  signedUrl?: string
  postUrl?: string
  postFields?: Record<string, string>
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

function invalidServerResponse(status?: number) {
  if (status && status >= 500) {
    return new Error('O servidor falhou ao receber o arquivo. Tente de novo.')
  }
  return new Error('O servidor não devolveu uma resposta válida. Tente de novo.')
}

async function readResponseJson(res: Response) {
  const text = await res.text()
  if (!text) {
    return {} as UploadResponse
  }
  try {
    return JSON.parse(text) as UploadResponse
  } catch {
    throw invalidServerResponse(res.status)
  }
}

// Sem teto de KB/MB/GB para o cliente. O servidor da Vercel só entra em
// arquivos minúsculos; o resto vai direto ao R2, inclusive em vários GB.
const DIRECT_SERVER_UPLOAD = 4 * 1024 * 1024
const CHUNK_SIZE = 3.5 * 1024 * 1024
const R2_SINGLE_PUT_MAX = 5 * 1024 * 1024 * 1024 - 32 * 1024 * 1024
const UPLOAD_REQUEST_TIMEOUT = 55_000

function postChunkWithProgress(uploadId: string, blob: Blob, onChunkProgress?: (ratio: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData()
    form.set('uploadId', uploadId)
    form.set('file', blob, 'chunk.bin')
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/palha/site/upload-chunk')
    xhr.timeout = 0
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onChunkProgress) return
      onChunkProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else {
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string }
          reject(new Error(data.error || 'Não foi possível enviar um trecho do arquivo.'))
        } catch {
          reject(invalidServerResponse(xhr.status))
        }
      }
    }
    xhr.onerror = () => reject(new Error('Falha de rede no envio do arquivo.'))
    xhr.ontimeout = () => reject(new Error('O envio de um trecho demorou demais. Tente novamente.'))
    xhr.send(form)
  })
}

async function fetchWithUploadTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  message: string,
  timeoutMs = UPLOAD_REQUEST_TIMEOUT,
) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal, credentials: 'include', cache: 'no-store' })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw new Error(message)
    throw err
  } finally {
    window.clearTimeout(timer)
  }
}

function postFileWithProgress(file: File, folder: string, onProgress?: (percent: number) => void) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const form = new FormData()
    form.set('folder', folder)
    form.set('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/palha/site/media')
    xhr.timeout = 0
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(Math.max(1, Math.min(98, Math.round(10 + (event.loaded / event.total) * 88))))
    }
    xhr.onload = () => {
      let data: UploadResponse = {}
      try {
        data = xhr.responseText ? (JSON.parse(xhr.responseText) as UploadResponse) : {}
      } catch {
        reject(invalidServerResponse(xhr.status))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data)
      else reject(new Error(data.error || 'Não foi possível enviar o arquivo.'))
    }
    xhr.onerror = () => reject(new Error('Falha de rede no envio do arquivo.'))
    xhr.ontimeout = () => reject(new Error('O envio direto para o R2 demorou demais. Tente novamente.'))
    xhr.send(form)
  })
}

function xhrProgress(xhr: XMLHttpRequest, onProgress?: (percent: number) => void) {
  xhr.upload.onprogress = (event) => {
    if (!event.lengthComputable) return
    onProgress?.(Math.max(1, Math.min(98, Math.round(8 + (event.loaded / event.total) * 90))))
  }
}

function putSignedWithProgress(signedUrl: string, file: File, contentType: string, onProgress?: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.timeout = 0
    if (contentType) xhr.setRequestHeader('Content-Type', contentType)
    xhrProgress(xhr, onProgress)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error('O armazenamento recusou o arquivo. Tente de novo.'))
    }
    xhr.onerror = () => reject(new Error('Falha de rede no envio para o armazenamento.'))
    xhr.ontimeout = () => reject(new Error('O envio para o armazenamento demorou demais. Tente novamente.'))
    xhr.send(file)
  })
}

function postSignedWithProgress(
  postUrl: string,
  fields: Record<string, string>,
  file: File,
  onProgress?: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const form = new FormData()
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value)
    }
    form.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', postUrl)
    xhr.timeout = 0
    xhrProgress(xhr, onProgress)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error('O armazenamento recusou o arquivo. Tente de novo.'))
    }
    xhr.onerror = () => reject(new Error('Falha de rede no envio para o armazenamento.'))
    xhr.ontimeout = () => reject(new Error('O envio para o armazenamento demorou demais. Tente novamente.'))
    xhr.send(form)
  })
}

async function uploadViaServer(file: File, folder: string, onProgress?: (percent: number) => void) {
  const data = await postFileWithProgress(file, folder, onProgress)
  if (!data.url) {
    throw new Error(data.error || 'Não foi possível enviar o arquivo.')
  }
  onProgress?.(100)
  return {
    url: data.url,
    kind: (data.kind === 'video' ? 'video' : mediaKind(file, guessContentType(file))) as PalhaMediaKind,
  }
}

async function uploadViaSigned(file: File, folder: string, onProgress?: (percent: number) => void) {
  const contentType = guessContentType(file)
  onProgress?.(4)
  const signedRes = await fetchWithUploadTimeout(
    '/api/palha/site/signed-upload',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folder,
        filename: file.name || 'arquivo',
        contentType,
      }),
    },
    'O servidor demorou para preparar o envio. Tente novamente.',
  )
  const signed = await readResponseJson(signedRes)
  if (!signedRes.ok || !signed.publicUrl) {
    throw new Error(signed.error || 'Não foi possível preparar o envio.')
  }

  if (signed.postUrl && signed.postFields && Object.keys(signed.postFields).length) {
    try {
      await postSignedWithProgress(signed.postUrl, signed.postFields, file, onProgress)
    } catch {
      if (!signed.signedUrl) throw new Error('O armazenamento recusou o arquivo. Tente de novo.')
      await putSignedWithProgress(signed.signedUrl, file, signed.contentType || contentType, onProgress)
    }
  } else if (signed.signedUrl) {
    await putSignedWithProgress(signed.signedUrl, file, signed.contentType || contentType, onProgress)
  } else {
    throw new Error('Não foi possível preparar o envio.')
  }

  onProgress?.(100)
  return {
    url: signed.publicUrl,
    kind: (signed.kind === 'video' ? 'video' : mediaKind(file, contentType)) as PalhaMediaKind,
  }
}

async function uploadViaChunks(file: File, folder: string, onProgress?: (percent: number) => void) {
  const contentType = guessContentType(file)
  const startedRes = await fetchWithUploadTimeout(
    '/api/palha/site/upload-init',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    throw new Error(started.error || 'Não foi possível preparar o envio do arquivo.')
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
      body: JSON.stringify({ uploadId: started.uploadId }),
    },
    'O servidor demorou para finalizar o arquivo. Tente novamente.',
  )
  const done = await readResponseJson(doneRes)
  if (!doneRes.ok || !done.publicUrl) {
    throw new Error(done.error || 'Não foi possível finalizar o envio.')
  }
  onProgress?.(100)
  return {
    url: done.publicUrl,
    kind: started.kind === 'video' || mediaKind(file, contentType) === 'video' ? ('video' as PalhaMediaKind) : mediaKind(file, contentType),
  }
}

function palhaDirectPartSize(fileSize: number) {
  const maxParts = 10_000
  const minPart = 8 * 1024 * 1024
  const maxPart = 5 * 1024 * 1024 * 1024
  return Math.min(maxPart, Math.max(minPart, Math.ceil(Math.max(1, fileSize) / maxParts)))
}

function putPartWithProgress(
  signedUrl: string,
  blob: Blob,
  onChunkProgress?: (ratio: number) => void,
) {
  return new Promise<string>((resolve, reject) => {
    const part = blob.slice(0, blob.size, 'application/octet-stream')
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.timeout = 0
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onChunkProgress) return
      onChunkProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error('O armazenamento recusou um trecho do arquivo. Tente de novo.'))
        return
      }
      const etag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag') || ''
      if (!etag) {
        reject(new Error('O armazenamento não confirmou o trecho. Tente de novo.'))
        return
      }
      resolve(etag)
    }
    xhr.onerror = () => reject(new Error('Falha de rede no envio para o armazenamento.'))
    xhr.ontimeout = () => reject(new Error('O envio para o armazenamento demorou demais. Tente novamente.'))
    xhr.send(part)
  })
}

async function uploadViaDirectParts(file: File, folder: string, onProgress?: (percent: number) => void) {
  const contentType = guessContentType(file)
  const startedRes = await fetchWithUploadTimeout(
    '/api/palha/site/upload-init',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    throw new Error(started.error || 'Não foi possível preparar o envio do arquivo.')
  }

  const partSize = palhaDirectPartSize(file.size)
  const total = Math.max(1, file.size)
  const parts: { ETag: string; PartNumber: number }[] = []
  let offset = 0
  let partNumber = 1
  while (offset < file.size) {
    const end = Math.min(offset + partSize, file.size)
    const blob = file.slice(offset, end)
    const signedRes = await fetchWithUploadTimeout(
      '/api/palha/site/upload-part',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: started.uploadId, partNumber }),
      },
      'O servidor demorou para preparar um trecho. Tente novamente.',
    )
    const signed = await readResponseJson(signedRes)
    if (!signedRes.ok || !signed.signedUrl) {
      throw new Error(signed.error || 'Não foi possível preparar um trecho do arquivo.')
    }
    const base = offset / total
    const span = (end - offset) / total
    const etag = await putPartWithProgress(signed.signedUrl, blob, (ratio) => {
      onProgress?.(Math.max(1, Math.min(96, Math.round((base + span * ratio) * 96))))
    })
    parts.push({ ETag: etag, PartNumber: partNumber })
    offset = end
    partNumber += 1
  }

  onProgress?.(97)
  const doneRes = await fetchWithUploadTimeout(
    '/api/palha/site/upload-complete',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: started.uploadId, parts }),
    },
    'O servidor demorou para finalizar o arquivo. Tente novamente.',
  )
  const done = await readResponseJson(doneRes)
  if (!doneRes.ok || !done.publicUrl) {
    throw new Error(done.error || 'Não foi possível finalizar o envio.')
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
  if (!file.size) throw new Error('Arquivo vazio.')
  if (file.size > R2_SINGLE_PUT_MAX) {
    try {
      return await uploadViaDirectParts(file, folder, onProgress)
    } catch {
      return uploadViaChunks(file, folder, onProgress)
    }
  }
  try {
    return await uploadViaSigned(file, folder, onProgress)
  } catch {
    try {
      return await uploadViaDirectParts(file, folder, onProgress)
    } catch {
      if (file.size <= DIRECT_SERVER_UPLOAD) {
        try {
          return await uploadViaServer(file, folder, onProgress)
        } catch {
          return uploadViaChunks(file, folder, onProgress)
        }
      }
      return uploadViaChunks(file, folder, onProgress)
    }
  }
}
