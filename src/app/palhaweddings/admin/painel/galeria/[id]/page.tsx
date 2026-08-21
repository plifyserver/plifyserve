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
import { uploadPalhaMediaFile } from '@/lib/palha/upload-client'
import { PalhaThemeEditor } from './PalhaThemeEditor'
import type { PalhaAlbumTheme } from '@/lib/palha/album-theme'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/heic,video/mp4,video/webm,video/quicktime'

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
  settingsRef.current = settings

  const album = useMemo(
    () => settings.gallery.albums.find((item) => item.id === albumId) ?? null,
    [settings.gallery.albums, albumId],
  )
  const selected = album?.subalbums.find((sub) => sub.id === selectedId) ?? album?.subalbums[0] ?? null

  useEffect(() => {
    fetch('/api/palha/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: PalhaSiteSettings) => {
        setSettings(data)
        const found = data.gallery.albums.find((item) => item.id === albumId)
        setSelectedId(found?.subalbums[0]?.id || '')
        setLoaded(true)
      })
      .catch(() => {
        setError('Não foi possível carregar o álbum.')
        setLoaded(true)
      })
  }, [albumId])

  async function persistGallery(gallery: PalhaGallery, okMessage = 'Álbum atualizado.') {
    const gen = ++saveGen.current
    const next = { ...settingsRef.current, gallery }
    settingsRef.current = next
    setSettings(next)
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
      settingsRef.current = data
      setSettings(data)
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

  function patchAlbum(nextAlbum: PalhaAlbum) {
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, nextAlbum)
    return persistGallery(gallery)
  }

  function saveTheme(theme: PalhaAlbumTheme) {
    const currentAlbum = settingsRef.current.gallery.albums.find((item) => item.id === albumId)
    if (!currentAlbum) return
    const gallery = updateAlbum(settingsRef.current.gallery, albumId, { ...currentAlbum, theme })
    settingsRef.current = { ...settingsRef.current, gallery }
    setSettings(settingsRef.current)
    if (persistTimer.current) window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      void persistGallery(settingsRef.current.gallery, 'Apresentação salva no link público.')
    }, 250)
  }

  async function addFiles(files: FileList | File[]) {
    if (!album || !selected) return
    const list = Array.from(files).filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    if (!list.length) return
    setUploading(`Enviando 0/${list.length}…`)
    setError('')
    const added: PalhaMediaItem[] = []
    try {
      for (let index = 0; index < list.length; index += 1) {
        setUploading(`Enviando ${index + 1}/${list.length}…`)
        const file = list[index]
        const uploaded = await uploadPalhaMediaFile(file, `gallery/${album.id}/${selected.id}`)
        added.push({
          id: newPalhaId('media'),
          url: uploaded.url,
          kind: uploaded.kind,
          caption: '',
        })
      }
      const nextAlbum: PalhaAlbum = {
        ...album,
        coverUrl: album.coverUrl || added.find((item) => item.kind === 'image')?.url || album.coverUrl,
        subalbums: album.subalbums.map((sub) =>
          sub.id === selected.id ? { ...sub, items: [...sub.items, ...added] } : sub,
        ),
      }
      await patchAlbum(nextAlbum)
      setMessage(`${added.length} arquivo${added.length === 1 ? '' : 's'} adicionado${added.length === 1 ? '' : 's'}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no envio.')
    } finally {
      setUploading('')
    }
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
    const href = `${origin}${palhaPublicPrefix(pathname)}/portfolio/${albumId}`
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
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                gallery: updateAlbum(current.gallery, album.id, { ...album, name: e.target.value }),
              }))
            }
            onBlur={() => void persistGallery(settings.gallery)}
          />
          <label className="palha-album-date">
            Data
            <input
              type="date"
              value={album.eventDate}
              onChange={(e) =>
                setSettings((current) => ({
                  ...current,
                  gallery: updateAlbum(current.gallery, album.id, { ...album, eventDate: e.target.value }),
                }))
              }
              onBlur={() => void persistGallery(settings.gallery)}
            />
          </label>
        </div>
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
          <PalhaThemeEditor album={album} onChange={saveTheme} />
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
          <ul className="palha-album-sublist">
            {album.subalbums.map((sub) => (
              <li key={sub.id} className={sub.id === selected?.id ? 'is-current' : undefined}>
                <button type="button" onClick={() => setSelectedId(sub.id)}>
                  <strong>{sub.name}</strong>
                  <em>{sub.items.length}</em>
                </button>
                {album.subalbums.length > 1 ? (
                  <button type="button" className="palha-album-sub-remove" onClick={() => void removeSubalbum(sub.id)}>
                    ×
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </aside>

        <div className="palha-album-main">
          <header className="palha-album-main-bar">
            <input
              className="palha-album-sub-title"
              value={selected?.name || ''}
              onChange={(e) => {
                if (!selected) return
                setSettings((current) => ({
                  ...current,
                  gallery: updateAlbum(current.gallery, album.id, {
                    ...album,
                    subalbums: album.subalbums.map((sub) =>
                      sub.id === selected.id ? { ...sub, name: e.target.value } : sub,
                    ),
                  }),
                }))
              }}
              onBlur={() => void persistGallery(settings.gallery)}
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
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void addFiles(e.dataTransfer.files)
            }}
          >
            {selected?.items.length ? (
              <div className="palha-admin-gallery-grid">
                {selected.items.map((item) => (
                  <article key={item.id} className="palha-admin-gallery-card">
                    {item.kind === 'video' ? (
                      <video src={item.url} muted playsInline />
                    ) : (
                      <img src={item.url} alt="" />
                    )}
                    <button type="button" className="palha-admin-mini" onClick={() => void removeMedia(item.id)}>
                      Remover
                    </button>
                  </article>
                ))}
              </div>
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
