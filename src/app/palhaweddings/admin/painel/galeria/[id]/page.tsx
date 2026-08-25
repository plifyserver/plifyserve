'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  DEFAULT_PALHA_SITE_SETTINGS,
  newPalhaId,
  palhaAdminPrefix,
  palhaPublicPrefix,
  type PalhaAlbum,
  type PalhaGallery,
  type PalhaMediaItem,
  type PalhaSiteSettings,
  type PalhaSubAlbum,
} from '@/lib/palha/site-settings-shared'
import { isPalhaMediaFile, palhaFileKind, uploadPalhaMediaFile } from '@/lib/palha/upload-client'
import { preferPalhaAdminSettings, readPalhaAdminSettings, rememberPalhaAdminSettings } from '@/lib/palha/admin-settings-cache'
import { PalhaMediaSortGrid } from './PalhaMediaSortGrid'
import { PalhaSubalbumSortList } from './PalhaSubalbumSortList'
import { PalhaThemeEditor } from './PalhaThemeEditor'
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

const ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.heic,.heif,.mp4,.webm,.mov,.m4v'

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
  const [dragging, setDragging] = useState(false)
  const [subName, setSubName] = useState('')
  const [askSub, setAskSub] = useState(false)
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
  const persistTimer = useRef<number | null>(null)
  const dirtyRef = useRef(false)
  const appendLock = useRef(Promise.resolve())
  settingsRef.current = settings

  const album = useMemo(
    () => settings.gallery.albums.find((item) => item.id === albumId) ?? null,
    [settings.gallery.albums, albumId],
  )
  const selected = album?.subalbums.find((sub) => sub.id === selectedId) ?? album?.subalbums[0] ?? null

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
      rememberPalhaAdminSettings(settingsRef.current)
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
    return persistGallery()
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

    const updateCard = (id: string, patch: { percent?: number; error?: string }) => {
      setPendingUploads((current) => current.map((card) => (card.id === id ? { ...card, ...patch } : card)))
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
          }))
        } catch (err) {
          const raw = err instanceof Error ? err.message : 'Falha no envio.'
          updateCard(job.id, {
            percent: 0,
            error: /did not match the expected pattern/i.test(raw)
              ? 'Este ficheiro não foi aceite. No Mac, use JPEG, PNG, MP4 ou MOV.'
              : raw,
          })
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
    setUploading('Enviando capa…')
    try {
      const uploaded = await uploadPalhaMediaFile(file, `gallery/${album.id}/cover`)
      await patchAlbum({ ...album, coverUrl: uploaded.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar a capa.')
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
    const href = `${origin}${palhaPublicPrefix(pathname)}/albuns/${albumId}`
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
      setSettings((current) => {
        const currentAlbum = current.gallery.albums.find((item) => item.id === album.id) ?? album
        const gallery = updateAlbum(current.gallery, album.id, {
          ...currentAlbum,
          passwordProtected: protectedAlbum,
        })
        const next = { ...current, gallery }
        settingsRef.current = next
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
          <label className="palha-album-cover">
            {album.coverUrl ? <img src={album.coverUrl} alt="" /> : <span className="palha-album-cover-empty">Capa do álbum</span>}
            <span className="palha-album-cover-overlay">Trocar capa</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                void changeCover(e.target.files?.[0])
                e.currentTarget.value = ''
              }}
            />
          </label>

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
            {selected?.items.length ? (
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
                  onReorder={reorderMedia}
                  onRemove={(id) => void removeMedia(id)}
                  onDismissPending={(id) => {
                    setPendingUploads((current) => {
                      const card = current.find((item) => item.id === id)
                      if (card) URL.revokeObjectURL(card.preview)
                      return current.filter((item) => item.id !== id)
                    })
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
    </main>
  )
}
