import { zipSync } from 'fflate'
import type { PalhaAlbum, PalhaMediaItem } from '@/lib/palha/site-settings-shared'

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

async function fileBytes(item: PalhaMediaItem, index: number) {
  const metaRes = await fetch(downloadHref(item, index), { credentials: 'include', cache: 'no-store' })
  const meta = (await metaRes.json()) as { url?: string; error?: string }
  if (metaRes.ok && meta.url) {
    try {
      const fileRes = await fetch(meta.url, { cache: 'no-store' })
      if (fileRes.ok) return new Uint8Array(await fileRes.arrayBuffer())
    } catch {
      // R2 pode bloquear CORS; o proxy mesmo-domínio entra no lugar.
    }
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

export async function downloadPalhaAlbumZip(
  album: PalhaAlbum,
  onProgress?: (done: number, total: number) => void,
) {
  const entries = palhaAlbumZipEntries(album)
  if (!entries.length) throw new Error('Este álbum ainda não tem mídia.')

  const files: Record<string, Uint8Array> = {}
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i]
    onProgress?.(i, entries.length)
    files[entry.path] = await fileBytes(entry.item, entry.index)
  }
  onProgress?.(entries.length, entries.length)

  const zipped = zipSync(files, { level: 0 })
  const copy = new Uint8Array(zipped.byteLength)
  copy.set(zipped)
  const blob = new Blob([copy], { type: 'application/zip' })
  const filename = `${safePart(album.name || 'album')}.zip`
  const file = new File([blob], filename, { type: 'application/zip' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }

  saveBlob(blob, filename)
}
