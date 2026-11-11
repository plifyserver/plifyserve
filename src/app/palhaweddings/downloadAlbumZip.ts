import { Zip, ZipPassThrough } from 'fflate'
import type { PalhaAlbum, PalhaMediaItem } from '@/lib/palha/site-settings-shared'

/** Chrome/Firefox rejeitam ArrayBufferView/Blob acima de 2 GB. Margem de segurança. */
const MAX_PART_BYTES = Math.floor(1.4 * 1024 * 1024 * 1024)
/** Vídeos acima disso não entram no ZIP: baixam por link direto, sem carregar na memória. */
const MAX_ZIP_FILE_BYTES = Math.floor(180 * 1024 * 1024)

function fileNameFromUrl(url: string, fallback: string) {
  try {
    const name = decodeURIComponent(url.split('?')[0].split('/').pop() || fallback)
    return name || fallback
  } catch {
    return fallback
  }
}

function safePart(value: string) {
  const cleaned = value.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || 'arquivo'
}

function uniquePath(used: Set<string>, path: string) {
  if (!used.has(path)) {
    used.add(path)
    return path
  }
  const dot = path.lastIndexOf('.')
  const base = dot > 0 ? path.slice(0, dot) : path
  const ext = dot > 0 ? path.slice(dot) : ''
  let n = 2
  let next = `${base}-${n}${ext}`
  while (used.has(next)) {
    n += 1
    next = `${base}-${n}${ext}`
  }
  used.add(next)
  return next
}

export function palhaAlbumZipEntries(album: PalhaAlbum) {
  const used = new Set<string>()
  const nested = album.subalbums.length > 1
  const entries: { item: PalhaMediaItem; index: number; path: string }[] = []
  for (const sub of album.subalbums) {
    const folder = nested ? `${safePart(sub.name)}/` : ''
    sub.items.forEach((item, index) => {
      if (!item.url) return
      const fallback = item.kind === 'video' ? `video-${index + 1}.mp4` : `foto-${index + 1}.jpg`
      const name = safePart(fileNameFromUrl(item.url, fallback))
      entries.push({ item, index, path: uniquePath(used, `${folder}${name}`) })
    })
  }
  return entries
}

function downloadHref(item: PalhaMediaItem, index: number, raw = false) {
  const fallback = item.kind === 'video' ? `video-${index + 1}.mp4` : `foto-${index + 1}.jpg`
  const name = fileNameFromUrl(item.url, fallback)
  const query = `url=${encodeURIComponent(item.url)}&name=${encodeURIComponent(name)}`
  return raw ? `/api/palha/download?${query}&raw=1` : `/api/palha/download?${query}`
}

async function signedDownload(item: PalhaMediaItem, index: number) {
  const metaRes = await fetch(downloadHref(item, index), { credentials: 'include', cache: 'no-store' })
  const meta = (await metaRes.json()) as {
    url?: string
    filename?: string
    contentType?: string
    bytes?: number
    error?: string
  }
  if (!metaRes.ok || !meta.url) {
    throw new Error(meta.error || 'Não foi possível preparar o download.')
  }
  return meta
}

/** Baixa pelo link assinado sem carregar o arquivo inteiro na RAM (essencial para vídeo). */
function saveByUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function fileBytes(item: PalhaMediaItem, index: number) {
  const meta = await signedDownload(item, index)
  try {
    const fileRes = await fetch(meta.url!, { cache: 'no-store' })
    if (fileRes.ok) return new Uint8Array(await fileRes.arrayBuffer())
  } catch {
    // R2 pode bloquear CORS; o proxy mesmo-domínio entra no lugar.
  }
  const rawRes = await fetch(downloadHref(item, index, true), { credentials: 'include', cache: 'no-store' })
  if (!rawRes.ok) throw new Error(meta.error || 'Não foi possível baixar um dos arquivos.')
  return new Uint8Array(await rawRes.arrayBuffer())
}

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 4000)
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

type ZipPartWriter = {
  addFile: (path: string, data: Uint8Array) => void
  finish: () => Promise<Blob>
  bytesWritten: () => number
  fileCount: () => number
}

function createZipPartWriter(): ZipPartWriter {
  const chunks: Uint8Array[] = []
  let bytesWritten = 0
  let fileCount = 0
  let failed: Error | null = null
  let ended = false

  const zip = new Zip((err, data, final) => {
    if (err) {
      failed = err instanceof Error ? err : new Error(String(err))
      return
    }
    if (data?.length) {
      chunks.push(data)
      bytesWritten += data.length
    }
    if (final) ended = true
  })

  return {
    bytesWritten: () => bytesWritten,
    fileCount: () => fileCount,
    addFile(path, data) {
      if (failed) throw failed
      if (ended) throw new Error('Parte do ZIP já foi finalizada.')
      const entry = new ZipPassThrough(path)
      zip.add(entry)
      entry.push(data, true)
      fileCount += 1
      if (failed) throw failed
    },
    async finish() {
      if (failed) throw failed
      if (!ended) {
        await new Promise<void>((resolve, reject) => {
          const previous = zip.ondata
          zip.ondata = (err, data, final) => {
            previous?.(err, data, final)
            if (err) {
              reject(err instanceof Error ? err : new Error(String(err)))
              return
            }
            if (final) resolve()
          }
          try {
            zip.end()
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)))
          }
          if (ended) resolve()
        })
      }
      if (failed) throw failed
      return new Blob(chunks as BlobPart[], { type: 'application/zip' })
    },
  }
}

function isVideoEntry(item: PalhaMediaItem) {
  return item.kind === 'video' || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(item.url)
}

export async function downloadPalhaAlbumZip(
  album: PalhaAlbum,
  onProgress?: (done: number, total: number, label?: string) => void,
) {
  const entries = palhaAlbumZipEntries(album)
  if (!entries.length) throw new Error('Este álbum ainda não tem mídia.')

  const images = entries.filter((entry) => !isVideoEntry(entry.item))
  const videos = entries.filter((entry) => isVideoEntry(entry.item))
  const total = entries.length
  let done = 0

  const baseName = safePart(album.name || 'album')
  let partIndex = 1
  let writer = createZipPartWriter()
  let partsSaved = 0
  const multiLikely = images.length > 80

  async function saveCurrentPart() {
    if (writer.fileCount() === 0) return
    const blob = await writer.finish()
    if (blob.size <= 0) return
    partsSaved += 1
    const filename =
      multiLikely || partsSaved > 1 || partIndex > 1 || videos.length > 0
        ? `${baseName}-fotos-parte-${partIndex}.zip`
        : `${baseName}.zip`
    onProgress?.(done, total, `Salvando ${filename}…`)
    saveBlob(blob, filename)
    partIndex += 1
    writer = createZipPartWriter()
    await wait(800)
  }

  for (const entry of images) {
    onProgress?.(done, total, `Baixando foto ${done + 1} de ${total}…`)
    const bytes = await fileBytes(entry.item, entry.index)

    if (bytes.byteLength > MAX_ZIP_FILE_BYTES || bytes.byteLength > MAX_PART_BYTES) {
      await saveCurrentPart()
      const meta = await signedDownload(entry.item, entry.index)
      onProgress?.(done, total, `Salvando arquivo grande…`)
      saveByUrl(meta.url!, safePart(entry.path.split('/').pop() || entry.path))
      done += 1
      await wait(600)
      continue
    }

    const projected = writer.bytesWritten() + bytes.byteLength + 128 * 1024
    if (writer.fileCount() > 0 && projected > MAX_PART_BYTES) {
      await saveCurrentPart()
    }

    writer.addFile(entry.path, bytes)
    done += 1
  }

  onProgress?.(done, total, images.length ? 'Finalizando fotos…' : 'Preparando vídeos…')
  await saveCurrentPart()

  for (let i = 0; i < videos.length; i += 1) {
    const entry = videos[i]
    onProgress?.(done, total, `Baixando vídeo ${i + 1} de ${videos.length}…`)
    const meta = await signedDownload(entry.item, entry.index)
    const filename = meta.filename || safePart(entry.path.split('/').pop() || `video-${i + 1}.mp4`)
    // Link assinado: o navegador baixa o vídeo sem ArrayBuffer na página.
    saveByUrl(meta.url!, filename)
    done += 1
    partsSaved += 1
    await wait(900)
  }

  if (partsSaved === 0 && images.length === 0 && videos.length === 0) {
    throw new Error('Não foi possível montar o download do álbum.')
  }
  if (partsSaved === 0 && images.length > 0) {
    throw new Error('Não foi possível montar o download do álbum.')
  }
}

/** Download individual (foto/vídeo) sem estourar memória em arquivos grandes. */
export async function downloadPalhaMediaFile(item: PalhaMediaItem, index: number) {
  const meta = await signedDownload(item, index)
  const fallback = item.kind === 'video' ? `video-${index + 1}.mp4` : `foto-${index + 1}.jpg`
  const filename = meta.filename || fileNameFromUrl(item.url, fallback)

  // Vídeos e arquivos grandes: baixar direto pelo R2, sem Blob na memória.
  const knownBytes = typeof meta.bytes === 'number' ? meta.bytes : 0
  if (isVideoEntry(item) || knownBytes > MAX_ZIP_FILE_BYTES) {
    saveByUrl(meta.url!, filename)
    return
  }

  try {
    const fileRes = await fetch(meta.url!, { cache: 'no-store' })
    if (!fileRes.ok) throw new Error('download')
    const buffer = await fileRes.arrayBuffer()
    if (buffer.byteLength > MAX_PART_BYTES) {
      saveByUrl(meta.url!, filename)
      return
    }
    const type = meta.contentType || fileRes.headers.get('content-type') || 'application/octet-stream'
    // Evita passar um único ArrayBufferView gigante para Blob/File.
    const blob = new Blob([new Uint8Array(buffer)], { type })
    saveBlob(blob, filename)
  } catch {
    saveByUrl(meta.url!, filename)
  }
}
