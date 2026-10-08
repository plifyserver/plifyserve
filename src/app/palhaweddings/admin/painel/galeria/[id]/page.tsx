'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  DEFAULT_PALHA_SITE_SETTINGS,
  newPalhaId,
  palhaAdminPrefix,
  palhaPublicPrefix,
  syncAlbumPasswordFlags,
  type PalhaAlbum,
  type PalhaGallery,
  type PalhaMediaItem,
  type PalhaSiteSettings,
  type PalhaSubAlbum,
} from '@/lib/palha/site-settings-shared'
import { isPalhaMediaFile, palhaFileKind, uploadPalhaMediaFile } from '@/lib/palha/upload-client'
import { toPalhaShareJpeg } from '@/lib/palha/share-preview'
import { preferPalhaAdminSettings, readPalhaAdminSettings, rememberPalhaAdminSettings } from '@/lib/palha/admin-settings-cache'
import { PalhaMediaSortGrid } from './PalhaMediaSortGrid'
import { PalhaSubalbumSortList } from './PalhaSubalbumSortList'
import { PalhaThemeEditor } from './PalhaThemeEditor'
import { PalhaCoverFramePicker } from './PalhaCoverFramePicker'
import { PalhaCoverMedia } from '@/app/palhaweddings/PalhaCoverMedia'
import { type PalhaAlbumTheme, type PalhaMediaFrame } from '@/lib/palha/album-theme'

async function readMediaSize(file: File) {
  return new Promise<{ width?: number; height?: number }>((resolve) => {
    const href = URL.createObjectURL(file)
    const done = (width?: number, height?: number) => {
      URL.revokeObjectURL(href)
      resolve(width && height ? { width, height } : {})
    }
    if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name)) {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => done(video.videoWidth, video.videoHeight)
      video.onerror = () => done()
      video.src = href
      return
    }
    const image = new Image()
    image.onload = () => done(image.naturalWidth, image.naturalHeight)
    image.onerror = () => done()
    image.src = href
  })
}

async function captureVideoFrame(source: File | string, time: number) {
  const href =
    typeof source === 'string'
      ? `/api/palha/site/media-proxy?url=${encodeURIComponent(source)}`
      : URL.createObjectURL(source)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.muted = true
  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const finish = (error?: Error) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeout)
        video.onloadedmetadata = null
        video.onloadeddata = null
        video.onseeked = null
        video.onerror = null
        if (error) reject(error)
        else resolve()
      }
      const timeout = window.setTimeout(() => finish(new Error('timeout')), 15000)
      const seek = () => {
        if (!Number.isFinite(video.duration) || video.videoWidth < 2) return
        const target = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.05)))
        video.currentTime = target
        if (Math.abs(video.currentTime - target) < 0.02 && video.readyState >= 2) {
          window.setTimeout(() => finish(), 80)
        }
      }
      video.onloadedmetadata = seek
      video.onloadeddata = seek
      video.onseeked = () => finish()
      video.onerror = () => finish(new Error('video'))
      video.src = href
      video.load()
    })
    const scale = Math.min(1, 1200 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) return null
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    return blob ? new File([blob], `capa-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null
  } catch {
    return null
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(href)
    video.removeAttribute('src')
    video.load()
  }
}

const ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.mp4,.webm,.mov,.m4v'

type PalhaBatchUploadItem = {
  id: string
  bytes: number
  percent: number
  done: boolean
  failed: boolean
}

function formatPalhaBytes(bytes: number) {
  const value = Math.max(0, bytes)
  const gb = 1024 ** 3
  const mb = 1024 ** 2
  if (value >= gb) {
    const amount = value / gb
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: amount >= 10 ? 1 : 2 }).format(amount)} GB`
  }
  if (value >= mb) {
    const amount = value / mb
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: amount >= 100 ? 0 : amount >= 10 ? 1 : 2 }).format(amount)} MB`
  }
  if (value >= 1024) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value / 1024)} KB`
  }
  return `${Math.round(value)} B`
}

function palhaBatchProgress(items: PalhaBatchUploadItem[]) {
  const totalBytes = items.reduce((sum, item) => sum + Math.max(1, item.bytes), 0)
  const loadedBytes = items.reduce((sum, item) => {
    const percent = item.done ? 100 : Math.min(100, Math.max(0, item.percent))
    return sum + Math.max(1, item.bytes) * (percent / 100)
  }, 0)
  const remainingBytes = Math.max(0, totalBytes - loadedBytes)
  return {
    percent: totalBytes ? Math.min(100, Math.round((loadedBytes / totalBytes) * 100)) : 0,
    finished: items.filter((item) => item.done).length,
    failed: items.filter((item) => item.failed).length,
    total: items.length,
    active: items.some((item) => !item.done),
    loadedLabel: formatPalhaBytes(loadedBytes),
    totalLabel: formatPalhaBytes(totalBytes),
    remainingLabel: formatPalhaBytes(remainingBytes),
  }
}

function updateAlbum(gallery: PalhaGallery, albumId: string, patch: PalhaAlbum): PalhaGallery {
  return {
    ...gallery,
    albums: gallery.albums.map((album) => (album.id === albumId ? patch : album)),
  }
}

export default function PalhaAlbumStudioPage() {
  const params = useParams<{ id: string }>()
  const pathname = usePathname()
  const prefix = palhaAdminPrefix(pathname)
  const albumId = String(params.id || '')

  const [settings, setSettings] = useState<PalhaSiteSettings>(DEFAULT_PALHA_SITE_SETTINGS)
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const [pendingUploads, setPendingUploads] = useState<
    { id: string; preview: string; kind: PalhaMediaItem['kind']; percent: number; error?: string }[]
  >([])
  const [batchUploads, setBatchUploads] = useState<PalhaBatchUploadItem[]>([])
  const batchProgress = useMemo(() => palhaBatchProgress(batchUploads), [batchUploads])
  const [dragging, setDragging] = useState(false)
  const [subName, setSubName] = useState('')
  const [askSub, setAskSub] = useState(false)
  const [coverPicker, setCoverPicker] = useState(false)
  const [sharePicker, setSharePicker] = useState(false)
  const [coverDraft, setCoverDraft] = useState<{ url: string; file?: File; posterUrl?: string; time?: number } | null>(null)
  const [videoFrameItem, setVideoFrameItem] = useState<PalhaMediaItem | null>(null)
  const [tab, setTab] = useState<'midia' | 'apresentacao'>('midia')
  const [copied, setCopied] = useState(false)
  const [accessOpen, setAccessOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [albumPassword, setAlbumPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const settingsRef = useRef(settings)
  const saveGen = useRef(0)
  const passwordGen = useRef(0)
  const persistTimer = useRef<number | null>(null)
  const dirtyRef = useRef(false)
  const appendLock = useRef(Promise.resolve())
  settingsRef.current = settings

  const album = useMemo(
    () => settings.gallery.albums.find((item) => item.id === albumId) ?? null,
    [settings.gallery.albums, albumId],
  )
  const selected = album?.subalbums.find((sub) => sub.id === selectedId) ?? album?.subalbums[0] ?? null
  const albumMedia = useMemo(() => {
    if (!album) return []
    return album.subalbums.flatMap((sub) => sub.items).filter((item) => item.url)
  }, [album])

  useEffect(() => {
    let cancelled = false
    const cached = readPalhaAdminSettings()
    const cachedAlbum = cached?.gallery.albums.find((item) => item.id === albumId)
    if (cached && cachedAlbum) {
      setSettings(cached)
      setSelectedId(cachedAlbum.subalbums[0]?.id || '')
      setLoaded(true)
    }

    async function load() {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        try {
          const res = await fetch('/api/palha/site', { cache: 'no-store' })
          const data = (await res.json()) as PalhaSiteSettings
          if (cancelled) return
          if (dirtyRef.current) {
            setLoaded(true)
            return
          }
          const next = preferPalhaAdminSettings(data, albumId)
          const found = next.gallery.albums.find((item) => item.id === albumId)
          if (found) {
            setSettings(next)
            setSelectedId(found.subalbums[0]?.id || '')
            setLoaded(true)
            return
          }
          if (attempt === 7) {
            setLoaded(true)
            setError('Álbum não encontrado.')
            return
          }
        } catch {
          if (attempt === 7 && !cancelled) {
            setError('Não foi possível carregar o álbum.')
            setLoaded(true)
            return
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 280 * (attempt + 1)))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [albumId])

  async function persistGallery(okMessage = 'Álbum atualizado.') {
    const gen = ++saveGen.current
    const passwordAt = passwordGen.current
    const next = settingsRef.current
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/palha/site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(next),
      })
      const data = (await res.json()) as PalhaSiteSettings & { error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar.')
      if (gen !== saveGen.current) return data
      const synced =
        passwordAt === passwordGen.current
          ? syncAlbumPasswordFlags(settingsRef.current, data)
          : settingsRef.current
      settingsRef.current = synced
      setSettings(synced)
      rememberPalhaAdminSettings(synced)
      setMessage(okMessage)
      return data
    } catch (err) {
      if (gen === saveGen.current) {
        setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
      }
      throw err
    } finally {
      if (gen === saveGen.current) setSaving(false)
    }
  }

  function schedulePersist(okMessage = 'Álbum atualizado.') {
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      void persistGallery(okMessage)
    }, 700)
  }

  function patchAlbumFields(patch: Partial<PalhaAlbum>) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum) return
    dirtyRef.current = true
    saveGen.current += 1
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, { ...currentAlbum, ...patch })
    settingsRef.current = { ...settingsRef.current, gallery }
    setSettings(settingsRef.current)
    schedulePersist()
  }

  function patchAlbum(nextAlbum: PalhaAlbum) {
    dirtyRef.current = true
    saveGen.current += 1
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, nextAlbum)
    settingsRef.current = { ...settingsRef.current, gallery }
    setSettings(settingsRef.current)
    return persistGallery().then((saved) => {
      if (saved && 'gallery' in saved) {
        settingsRef.current = saved
        setSettings(saved)
      }
      return saved
    })
  }

  async function saveAlbumCover(cover: {
    url: string
    kind: 'image' | 'video'
    posterUrl?: string
    frame?: number
  }) {
    if (!album) throw new Error('Álbum não encontrado')
    const res = await fetch(`/api/palha/albums/${album.id}/cover`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(cover),
    })
    const data = (await res.json()) as { album?: PalhaAlbum; error?: string }
    if (!res.ok || !data.album) throw new Error(data.error || 'Não foi possível salvar a capa.')
    setSettings((current) => {
      const next = { ...current, gallery: updateAlbum(current.gallery, album.id, data.album as PalhaAlbum) }
      settingsRef.current = next
      rememberPalhaAdminSettings(next)
      return next
    })
    setMessage('Capa do álbum salva.')
    return data.album
  }

  function saveTheme(theme: PalhaAlbumTheme) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum) return
    dirtyRef.current = true
    saveGen.current += 1
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, { ...currentAlbum, theme })
    settingsRef.current = { ...settingsRef.current, gallery }
    setSettings(settingsRef.current)
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      void persistGallery('Apresentação salva no link público.')
    }, 250)
  }

  useEffect(() => {
    if (!batchUploads.length || batchUploads.some((item) => !item.done)) return
    const timer = window.setTimeout(() => setBatchUploads([]), 1800)
    return () => window.clearTimeout(timer)
  }, [batchUploads])

  async function addFiles(files: FileList | File[]) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    const currentSelected =
      currentAlbum?.subalbums.find((sub) => sub.id === selectedId) ?? currentAlbum?.subalbums[0]
    if (!currentAlbum || !currentSelected) return
    const list = Array.from(files).filter(isPalhaMediaFile)
    if (!list.length) return
    setError('')
    const batch = list.map((file) => ({
      id: newPalhaId('up'),
      file,
      preview: URL.createObjectURL(file),
      kind: palhaFileKind(file),
      percent: 0,
    }))
    setPendingUploads((current) => [
      ...current,
      ...batch.map(({ id, preview, kind, percent }) => ({ id, preview, kind, percent })),
    ])
    setBatchUploads((current) => [
      ...(current.some((item) => !item.done) ? current : []),
      ...batch.map((job) => ({
        id: job.id,
        bytes: job.file.size,
        percent: 0,
        done: false,
        failed: false,
      })),
    ])

    const updateCard = (id: string, patch: { percent?: number; error?: string }) => {
      setPendingUploads((current) => current.map((card) => (card.id === id ? { ...card, ...patch } : card)))
      if (typeof patch.percent === 'number') {
        const percent = patch.percent
        setBatchUploads((current) =>
          current.map((item) => (item.id === id && !item.done ? { ...item, percent } : item)),
        )
      }
    }
    const finishBatchItem = (id: string, failed: boolean) => {
      setBatchUploads((current) =>
        current.map((item) => (item.id === id ? { ...item, percent: 100, done: true, failed } : item)),
      )
    }
    const dropCard = (id: string, preview: string) => {
      URL.revokeObjectURL(preview)
      setPendingUploads((current) => current.filter((card) => card.id !== id))
    }

    let nextIndex = 0
    const workers = Array.from({ length: Math.min(3, batch.length) }, async () => {
      while (nextIndex < batch.length) {
        const job = batch[nextIndex]
        nextIndex += 1
        try {
          const uploaded = await uploadPalhaMediaFile(
            job.file,
            `gallery/${currentAlbum.id}/${currentSelected.id}`,
            (percent) => updateCard(job.id, { percent }),
          )
          const size = await readMediaSize(job.file)
          let posterUrl = ''
          if (uploaded.kind === 'video') {
            const poster = await captureVideoFrame(job.file, 0.12)
            if (poster) {
              try {
                const posterUpload = await uploadPalhaMediaFile(poster, `gallery/${currentAlbum.id}/posters`)
                posterUrl = posterUpload.url
              } catch {
                // A mídia continua válida mesmo sem miniatura.
              }
            }
          }
          await (appendLock.current = appendLock.current.then(async () => {
            const live = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
            if (!live) throw new Error('Álbum não encontrado')
            await patchAlbum({
              ...live,
              coverUrl: live.coverUrl || (uploaded.kind === 'image' ? uploaded.url : live.coverUrl),
              subalbums: live.subalbums.map((sub) =>
                sub.id === currentSelected.id
                  ? {
                      ...sub,
                      items: [
                        ...sub.items,
                        {
                          id: newPalhaId('media'),
                          url: uploaded.url,
                          kind: uploaded.kind,
                          posterUrl: posterUrl || undefined,
                          posterFrame: posterUrl ? 0.12 : undefined,
                          caption: '',
                          frame: 'auto',
                          width: size.width,
                          height: size.height,
                        },
                      ],
                    }
                  : sub,
              ),
            })
            dropCard(job.id, job.preview)
            finishBatchItem(job.id, false)
          }))
        } catch (err) {
          const raw = err instanceof Error ? err.message : 'Falha no envio.'
          updateCard(job.id, {
            percent: 0,
            error: /did not match the expected pattern/i.test(raw)
              ? 'Este ficheiro não foi aceite. No Mac, use JPEG, PNG, MP4 ou MOV.'
              : raw,
          })
          finishBatchItem(job.id, true)
        }
      }
    })
    await Promise.all(workers)
    setPendingUploads((current) => {
      if (!current.some((card) => card.error)) {
        setMessage(`${list.length} arquivo${list.length === 1 ? '' : 's'} adicionado${list.length === 1 ? '' : 's'}.`)
      }
      return current
    })
  }

  async function changeCover(file: File | undefined) {
    if (!album || !file) return
    if (palhaFileKind(file) === 'video') {
      setCoverPicker(false)
      setCoverDraft({ url: URL.createObjectURL(file), file })
      return
    }
    setUploading('Enviando capa…')
    try {
      const uploaded = await uploadPalhaMediaFile(file, `gallery/${album.id}/cover`)
      await saveAlbumCover({ url: uploaded.url, kind: 'image' })
      setCoverPicker(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a capa.')
    } finally {
      setUploading('')
    }
  }

  function pickCoverFromAlbum(item: PalhaMediaItem) {
    if (!item.url) return
    if (item.kind === 'video') {
      setCoverPicker(false)
      setCoverDraft({
        url: item.url,
        posterUrl: item.posterUrl,
        time: item.url === album?.coverUrl ? album.coverFrame || 0.12 : 0.12,
      })
      return
    }
    void pickCoverImage(item.url)
  }

  async function persistShareImage(url: string) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum || !url) return
    await patchAlbum({ ...currentAlbum, shareImageUrl: url })
    setSharePicker(false)
    setMessage('Foto do link salva. Copie o link de novo e envie no WhatsApp.')
  }

  async function saveShareImage(url: string) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum || !url) return
    setUploading('Preparando prévia do WhatsApp…')
    try {
      const preview = await toPalhaShareJpeg(url)
      const shareUrl = preview
        ? (await uploadPalhaMediaFile(preview, `gallery/${currentAlbum.id}/share`)).url
        : url
      await persistShareImage(shareUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a foto do link.')
    } finally {
      setUploading('')
    }
  }

  async function uploadShareImage(file: File | undefined) {
    if (!album || !file) return
    if (palhaFileKind(file) !== 'image') {
      setError('A prévia do link precisa ser uma foto, não um vídeo.')
      return
    }
    setUploading('Enviando foto do link…')
    try {
      const preview = (await toPalhaShareJpeg(file)) || file
      const uploaded = await uploadPalhaMediaFile(preview, `gallery/${album.id}/share`)
      await persistShareImage(uploaded.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a foto do link.')
    } finally {
      setUploading('')
    }
  }

  async function pickCoverImage(url: string) {
    if (!album || !url) return
    setUploading('Atualizando capa…')
    try {
      await saveAlbumCover({ url, kind: 'image' })
      setCoverPicker(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar a capa.')
    } finally {
      setUploading('')
    }
  }

  async function confirmCoverFrame(time: number) {
    if (!album || !coverDraft) return
    setUploading('Preparando capa do vídeo…')
    try {
      let videoUrl = coverDraft.url
      setUploading('Gerando imagem do frame…')
      const poster = await captureVideoFrame(coverDraft.file || coverDraft.url, time)
      if (!poster) throw new Error('Não foi possível criar a foto deste frame. Escolha outro momento do vídeo.')

      if (coverDraft.file) {
        setUploading('Enviando vídeo da capa…')
        const uploaded = await uploadPalhaMediaFile(coverDraft.file, `gallery/${album.id}/cover`, (percent) => {
          setUploading(`Enviando vídeo da capa (${percent}%)…`)
        })
        videoUrl = uploaded.url
        setUploading('Enviando imagem do frame…')
        const posterUpload = await uploadPalhaMediaFile(poster, `gallery/${album.id}/cover`, (percent) => {
          setUploading(`Enviando imagem do frame (${percent}%)…`)
        })
        await saveAlbumCover({
          url: videoUrl,
          kind: 'video',
          posterUrl: posterUpload.url,
          frame: Math.round(time * 10) / 10,
        })
        if (coverDraft.file) URL.revokeObjectURL(coverDraft.url)
        setCoverDraft(null)
        setMessage('Capa do vídeo salva.')
        return
      }
      setUploading('Enviando imagem da capa…')
      const posterUpload = await uploadPalhaMediaFile(poster, `gallery/${album.id}/cover`)
      await saveAlbumCover({
        url: videoUrl,
        kind: 'video',
        posterUrl: posterUpload.url,
        frame: Math.round(time * 10) / 10,
      })
      if (coverDraft.file) URL.revokeObjectURL(coverDraft.url)
      setCoverDraft(null)
      setMessage('Capa do vídeo salva.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao definir a capa do vídeo.')
    } finally {
      setUploading('')
    }
  }

  function discardCoverDraft() {
    if (coverDraft?.file) URL.revokeObjectURL(coverDraft.url)
    setCoverDraft(null)
  }

  async function confirmVideoFrame(time: number) {
    if (!album || !selected || !videoFrameItem) return
    setUploading('Salvando capa do vídeo…')
    try {
      const poster = await captureVideoFrame(videoFrameItem.url, time)
      if (!poster) throw new Error('Não foi possível criar a imagem deste frame. Tente outro momento do vídeo.')
      const uploaded = await uploadPalhaMediaFile(poster, `gallery/${album.id}/posters`)
      const res = await fetch(
        `/api/palha/albums/${album.id}/media/${encodeURIComponent(videoFrameItem.id)}/poster`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            url: uploaded.url,
            frame: Math.round(time * 10) / 10,
          }),
        },
      )
      const data = (await res.json()) as { album?: PalhaAlbum; error?: string }
      if (!res.ok || !data.album) {
        throw new Error(data.error || 'A imagem foi enviada, mas não foi salva no vídeo.')
      }
      setSettings((current) => {
        const next = { ...current, gallery: updateAlbum(current.gallery, album.id, data.album as PalhaAlbum) }
        settingsRef.current = next
        rememberPalhaAdminSettings(next)
        return next
      })
      setMessage('Capa do vídeo salva.')
      setVideoFrameItem(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar a capa do vídeo.')
    } finally {
      setUploading('')
    }
  }

  async function addSubalbum() {
    if (!album || !subName.trim()) return
    const sub: PalhaSubAlbum = { id: newPalhaId('sub'), name: subName.trim(), items: [] }
    await patchAlbum({ ...album, subalbums: [...album.subalbums, sub] })
    setSelectedId(sub.id)
    setSubName('')
    setAskSub(false)
  }

  async function removeSubalbum(id: string) {
    if (!album || album.subalbums.length < 2) return
    if (!window.confirm('Remover este subálbum? As mídias dele saem da página.')) return
    const subalbums = album.subalbums.filter((sub) => sub.id !== id)
    await patchAlbum({ ...album, subalbums })
    if (selectedId === id) setSelectedId(subalbums[0].id)
  }

  function reorderSubalbums(from: number, to: number) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum || from === to) return
    const subalbums = currentAlbum.subalbums.slice()
    const [moved] = subalbums.splice(from, 1)
    subalbums.splice(to, 0, moved)
    void patchAlbum({ ...currentAlbum, subalbums })
  }

  function patchSelectedItems(items: PalhaMediaItem[], okMessage = 'Álbum atualizado.') {
    if (!album || !selected) return
    const nextAlbum = {
      ...album,
      subalbums: album.subalbums.map((sub) => (sub.id === selected.id ? { ...sub, items } : sub)),
    }
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, nextAlbum)
    settingsRef.current = { ...settingsRef.current, gallery }
    setSettings(settingsRef.current)
    dirtyRef.current = true
    saveGen.current += 1
    schedulePersist(okMessage)
  }

  function reorderMedia(from: number, to: number) {
    if (!selected || from === to) return
    const items = selected.items.slice()
    const [moved] = items.splice(from, 1)
    items.splice(to, 0, moved)
    patchSelectedItems(items, 'Ordem salva.')
  }

  function setItemFrame(id: string, frame: PalhaMediaFrame) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum) return
    const nextAlbum = {
      ...currentAlbum,
      subalbums: currentAlbum.subalbums.map((sub) => ({
        ...sub,
        items: sub.items.map((item) => (item.id === id ? { ...item, frame } : item)),
      })),
    }
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, nextAlbum)
    settingsRef.current = { ...settingsRef.current, gallery }
    setSettings(settingsRef.current)
    dirtyRef.current = true
    saveGen.current += 1
    schedulePersist('Enquadramento salvo.')
  }

  async function removeMedia(id: string) {
    if (!album || !selected) return
    await patchAlbum({
      ...album,
      subalbums: album.subalbums.map((sub) =>
        sub.id === selected.id ? { ...sub, items: sub.items.filter((item) => item.id !== id) } : sub,
      ),
    })
  }

  async function copyPublicLink() {
    const origin = window.location.origin
    const livePrefix = window.location.pathname.startsWith('/palhaweddings') ? '/palhaweddings' : palhaPublicPrefix(pathname)
    const href = `${origin}${livePrefix}/albuns/${albumId}`
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copie o link do álbum:', href)
    }
  }

  async function saveAlbumPassword(remove = false) {
    if (!album) return
    const nextPassword = remove ? '' : albumPassword.trim()
    if (!remove && nextPassword.length < 4) {
      setError('A senha precisa ter pelo menos 4 caracteres.')
      return
    }
    setSavingPassword(true)
    setError('')
    try {
      const res = await fetch(`/api/palha/albums/${album.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ password: nextPassword }),
      })
      const data = (await res.json()) as { album?: PalhaAlbum; error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar a senha.')
      const protectedAlbum = Boolean(data.album?.passwordProtected)
      passwordGen.current += 1
      setSettings((current) => {
        const currentAlbum = current.gallery.albums.find((item) => item.id === album.id) ?? album
        const gallery = updateAlbum(current.gallery, album.id, {
          ...currentAlbum,
          passwordProtected: protectedAlbum,
        })
        const next = { ...current, gallery }
        settingsRef.current = next
        rememberPalhaAdminSettings(next)
        return next
      })
      setAlbumPassword('')
      setAccessOpen(false)
      setMessage(protectedAlbum ? 'Senha do link público atualizada.' : 'Senha removida. O álbum ficou público.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (!loaded) {
    return (
      <main className="palha-admin-page">
        <p className="palha-copy">Carregando álbum…</p>
      </main>
    )
  }

  if (!album) {
    return (
      <main className="palha-admin-page">
        <p className="palha-copy">{error || 'Álbum não encontrado.'}</p>
        <Link href={`${prefix}/painel/galeria`} className="palha-btn">
          Voltar à galeria
        </Link>
      </main>
    )
  }

  return (
    <main className={`palha-admin-page palha-album-page${tab === 'apresentacao' ? ' is-apresentacao' : ''}`}>
      <div className="palha-album-top">
        <Link href={`${prefix}/painel/galeria`} className="palha-admin-back">
          Coleções
        </Link>
        <div className="palha-album-meta">
          <input
            className="palha-album-name"
            value={album.name}
            onChange={(e) => patchAlbumFields({ name: e.target.value })}
            onBlur={() => void persistGallery()}
          />
          <label className="palha-album-date">
            Data
            <input
              type="date"
              value={album.eventDate}
              onChange={(e) => patchAlbumFields({ eventDate: e.target.value })}
              onBlur={() => void persistGallery()}
            />
          </label>
        </div>
        <label className="palha-album-summary-field">
          Texto na listagem de álbuns
          <textarea
            rows={4}
            value={album.summary || ''}
            placeholder="Texto que aparece ao lado da capa na página Álbuns…"
            onChange={(e) => patchAlbumFields({ summary: e.target.value })}
            onBlur={() => void persistGallery()}
          />
        </label>
      </div>

      <div className="palha-album-tools">
        <button type="button" className="palha-album-tool" onClick={() => void copyPublicLink()}>
          {copied ? 'Link copiado' : 'Copiar link'}
        </button>
        <button
          type="button"
          className={`palha-album-tool${accessOpen ? ' is-on' : ''}`}
          onClick={() => setAccessOpen((open) => !open)}
        >
          {album.passwordProtected ? 'Senha ativa' : 'Senha'}
        </button>
      </div>

      {accessOpen ? (
        <form
          className="palha-album-access"
          onSubmit={(e) => {
            e.preventDefault()
            void saveAlbumPassword()
          }}
        >
          <input
            type="password"
            value={albumPassword}
            onChange={(e) => setAlbumPassword(e.target.value)}
            placeholder={album.passwordProtected ? 'Nova senha' : 'Definir senha'}
            autoComplete="new-password"
            autoFocus
          />
          <button type="submit" className="palha-album-tool is-strong" disabled={savingPassword}>
            {savingPassword ? 'Salvando…' : 'Salvar'}
          </button>
          {album.passwordProtected ? (
            <button type="button" className="palha-album-tool" disabled={savingPassword} onClick={() => void saveAlbumPassword(true)}>
              Remover
            </button>
          ) : null}
        </form>
      ) : null}

      <nav className="palha-album-tabs">
        <button type="button" className={tab === 'midia' ? 'is-current' : undefined} onClick={() => setTab('midia')}>
          Mídia
        </button>
        <button
          type="button"
          className={tab === 'apresentacao' ? 'is-current' : undefined}
          onClick={() => setTab('apresentacao')}
        >
          Apresentação
        </button>
      </nav>

      {tab === 'apresentacao' && album ? (
        <div className="palha-theme-stage">
          {error || message || saving ? (
            <p className={`palha-album-status${error ? ' is-error' : ''}`}>
              {error || (saving ? 'Salvando…' : message)}
            </p>
          ) : null}
          <PalhaThemeEditor album={album} onChange={saveTheme} onFrameChange={setItemFrame} />
        </div>
      ) : null}

      {tab === 'midia' ? (
        <section className="palha-album-studio">
        <aside className="palha-album-side">
          <div className="palha-album-side-covers">
          <button type="button" className="palha-album-cover" onClick={() => setCoverPicker(true)}>
            {album.coverUrl ? (
              <PalhaCoverMedia
                url={album.coverUrl}
                kind={album.coverKind}
                posterUrl={album.coverPosterUrl}
                className="palha-album-cover-media"
              />
            ) : (
              <span className="palha-album-cover-empty">Capa do álbum</span>
            )}
            <span className="palha-album-cover-overlay">Trocar capa</span>
          </button>
          <button type="button" className="palha-album-cover is-share" onClick={() => setSharePicker(true)}>
            {album.shareImageUrl ? (
              <img src={album.shareImageUrl} alt="" className="palha-album-cover-media" />
            ) : (
              <span className="palha-album-cover-empty">Foto do link</span>
            )}
            <span className="palha-album-cover-overlay">Prévia do WhatsApp</span>
          </button>
          </div>

          <div className="palha-album-subhead">
            <span>Galerias</span>
            <button type="button" className="palha-album-add-link" onClick={() => setAskSub(true)}>
              + Nova
            </button>
          </div>
          <PalhaSubalbumSortList
            items={album.subalbums}
            selectedId={selected?.id || ''}
            onSelect={setSelectedId}
            onReorder={reorderSubalbums}
            onRemove={(id) => void removeSubalbum(id)}
          />
        </aside>

        <div className="palha-album-main">
          <div className="palha-album-main-head">
          <header className="palha-album-main-bar">
            <input
              className="palha-album-sub-title"
              value={selected?.name || ''}
              onChange={(e) => {
                if (!selected) return
                const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === album.id)
                if (!currentAlbum) return
                dirtyRef.current = true
                saveGen.current += 1
                const gallery = updateAlbum(settingsRef.current.gallery, album.id, {
                  ...currentAlbum,
                  subalbums: currentAlbum.subalbums.map((sub) =>
                    sub.id === selected.id ? { ...sub, name: e.target.value } : sub,
                  ),
                })
                settingsRef.current = { ...settingsRef.current, gallery }
                setSettings(settingsRef.current)
              }}
              onBlur={() => void persistGallery()}
            />
            {selected?.items.length || pendingUploads.length ? (
              <label className="palha-album-tool palha-album-add-media">
                Adicionar
                <input
                  type="file"
                  accept={ACCEPT}
                  multiple
                  disabled={Boolean(uploading)}
                  onChange={(e) => {
                    if (e.target.files) void addFiles(e.target.files)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            ) : null}
          </header>
          {batchUploads.length ? (
            <div className="palha-batch-upload" role="status" aria-live="polite">
              <div className="palha-batch-upload-copy">
                <strong>{batchProgress.percent}%</strong>
                <span>
                  {batchProgress.active
                    ? `Enviando ${batchProgress.finished} de ${batchProgress.total} arquivo${batchProgress.total === 1 ? '' : 's'}`
                    : batchProgress.failed
                      ? `${batchProgress.total - batchProgress.failed} enviado${batchProgress.total - batchProgress.failed === 1 ? '' : 's'} · ${batchProgress.failed} falharam`
                      : `${batchProgress.total} arquivo${batchProgress.total === 1 ? '' : 's'} enviado${batchProgress.total === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="palha-batch-upload-size">
                <span>
                  {batchProgress.loadedLabel} de {batchProgress.totalLabel}
                </span>
                <span>
                  {batchProgress.active ? `Faltam ${batchProgress.remainingLabel}` : `${batchProgress.totalLabel} no total`}
                </span>
              </div>
              <div className="palha-batch-upload-track" aria-hidden="true">
                <div className="palha-batch-upload-fill" style={{ width: `${batchProgress.percent}%` }} />
              </div>
            </div>
          ) : null}
          </div>

          <div
            className={`palha-album-drop${dragging ? ' is-over' : ''}`}
            onDragOver={(e) => {
              if (![...e.dataTransfer.types].includes('Files')) return
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              if (![...e.dataTransfer.types].includes('Files')) return
              e.preventDefault()
              setDragging(false)
              void addFiles(e.dataTransfer.files)
            }}
          >
            {selected?.items.length || pendingUploads.length ? (
              <>
                <p className="palha-album-order-hint">
                  Arraste uma foto e solte em cima do lugar onde ela deve ficar. As outras não saem do lugar até você soltar.
                </p>
                <PalhaMediaSortGrid
                  items={selected?.items || []}
                  pending={pendingUploads}
                  accept={ACCEPT}
                  onAdd={(files) => void addFiles(files)}
                  onReorder={reorderMedia}
                  onRemove={(id) => void removeMedia(id)}
                  onPickVideoFrame={setVideoFrameItem}
                  onDismissPending={(id) => {
                    setPendingUploads((current) => {
                      const card = current.find((item) => item.id === id)
                      if (card) URL.revokeObjectURL(card.preview)
                      return current.filter((item) => item.id !== id)
                    })
                    setBatchUploads((current) =>
                      current.map((item) => (item.id === id ? { ...item, percent: 100, done: true, failed: true } : item)),
                    )
                  }}
                />
              </>
            ) : (
              <label className="palha-album-empty">
                <svg viewBox="0 0 64 52" width="56" height="46" aria-hidden="true">
                  <rect x="4" y="14" width="56" height="34" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M4 20h56" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M20 14v-4h12l3 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
                <p>Arraste fotos e vídeos, ou clique para escolher</p>
                <span>JPEG, PNG, WebP, MP4 ou MOV</span>
                <input
                  type="file"
                  accept={ACCEPT}
                  multiple
                  disabled={Boolean(uploading)}
                  onChange={(e) => {
                    if (e.target.files) void addFiles(e.target.files)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            )}
          </div>

          {(uploading || saving || error || message) ? (
            <p className={`palha-album-status${error ? ' is-error' : ''}`}>
              {error || uploading || (saving ? 'Salvando…' : message)}
            </p>
          ) : null}
        </div>
        </section>
      ) : null}

      {askSub ? (
        <div className="palha-modal-backdrop" onClick={() => setAskSub(false)}>
          <form
            className="palha-modal palha-admin-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              void addSubalbum()
            }}
          >
            <h2 className="palha-label">Novo subálbum</h2>
            <label>
              Nome
              <input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="Entrada, dança, comidas…"
                autoFocus
              />
            </label>
            <div className="palha-modal-actions">
              <button type="button" className="palha-btn" onClick={() => setAskSub(false)}>
                Cancelar
              </button>
              <button type="submit" className="palha-btn">
                Adicionar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {sharePicker ? (
        <div className="palha-modal-backdrop" onClick={() => !uploading && setSharePicker(false)}>
          <div className="palha-modal palha-cover-picker" onClick={(e) => e.stopPropagation()}>
            <h2 className="palha-label">Foto do link</h2>
            <p className="palha-copy">
              Esta foto aparece na prévia quando o link do álbum é enviado no WhatsApp. Não precisa ser a capa.
            </p>
            <label className="palha-btn palha-cover-picker-upload">
              Enviar do computador
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
                disabled={Boolean(uploading)}
                onChange={(e) => {
                  void uploadShareImage(e.target.files?.[0])
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <h3>Fotos do álbum</h3>
            {albumMedia.some((media) => media.kind === 'image') ? (
              <div className="palha-cover-picker-grid">
                {albumMedia
                  .filter((media) => media.kind === 'image')
                  .map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      className={media.url === album.shareImageUrl ? 'is-current' : undefined}
                      disabled={Boolean(uploading)}
                      onClick={() => void saveShareImage(media.url)}
                    >
                      <PalhaCoverMedia url={media.url} kind="image" className="palha-cover-picker-media" />
                    </button>
                  ))}
              </div>
            ) : (
              <p className="palha-copy">Ainda não há fotos neste álbum. Envie uma do computador ou adicione mídia primeiro.</p>
            )}
            {uploading ? <p className="palha-copy">{uploading}</p> : null}
            <div className="palha-modal-actions">
              <button type="button" className="palha-btn" disabled={Boolean(uploading)} onClick={() => setSharePicker(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {coverPicker ? (
        <div className="palha-modal-backdrop" onClick={() => !uploading && setCoverPicker(false)}>
          <div className="palha-modal palha-cover-picker" onClick={(e) => e.stopPropagation()}>
            <h2 className="palha-label">Capa do álbum</h2>
            <label className="palha-btn palha-cover-picker-upload">
              Enviar do computador
              <input
                type="file"
                accept={ACCEPT}
                disabled={Boolean(uploading)}
                onChange={(e) => {
                  void changeCover(e.target.files?.[0])
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <h3>Fotos e vídeos do álbum</h3>
            {albumMedia.length ? (
              <div className="palha-cover-picker-grid">
                {albumMedia.map((media) => (
                  <button
                    key={media.id}
                    type="button"
                    className={media.url === album.coverUrl ? 'is-current' : undefined}
                    disabled={Boolean(uploading)}
                    onClick={() => pickCoverFromAlbum(media)}
                  >
                    <PalhaCoverMedia
                      url={media.url}
                      kind={media.kind}
                      posterUrl={media.posterUrl}
                      className="palha-cover-picker-media"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="palha-copy">
                Ainda não há fotos neste álbum. Envie uma do computador ou adicione mídia primeiro.
              </p>
            )}
            {uploading ? <p className="palha-copy">{uploading}</p> : null}
            <div className="palha-modal-actions">
              <button type="button" className="palha-btn" disabled={Boolean(uploading)} onClick={() => setCoverPicker(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {coverDraft ? (
        <div className="palha-modal-backdrop" onClick={() => !uploading && discardCoverDraft()}>
          <div className="palha-modal palha-cover-picker" onClick={(e) => e.stopPropagation()}>
            <PalhaCoverFramePicker
              src={coverDraft.url}
              posterUrl={coverDraft.posterUrl}
              initialTime={coverDraft.time}
              onCancel={discardCoverDraft}
              onConfirm={(time) => void confirmCoverFrame(time)}
            />
            {uploading ? <p className="palha-copy">{uploading}</p> : null}
          </div>
        </div>
      ) : null}

      {videoFrameItem ? (
        <div className="palha-modal-backdrop" onClick={() => !uploading && setVideoFrameItem(null)}>
          <div className="palha-modal palha-cover-picker" onClick={(e) => e.stopPropagation()}>
            <PalhaCoverFramePicker
              src={videoFrameItem.url}
              posterUrl={videoFrameItem.posterUrl}
              initialTime={videoFrameItem.posterFrame}
              onCancel={() => setVideoFrameItem(null)}
              onConfirm={(time) => void confirmVideoFrame(time)}
            />
            {uploading ? <p className="palha-copy">{uploading}</p> : null}
          </div>
        </div>
      ) : null}
    </main>
  )
}
