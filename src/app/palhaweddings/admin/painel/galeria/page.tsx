'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PALHA_SITE_SETTINGS,
  albumMediaCount,
  formatPalhaEventDate,
  type PalhaAlbum,
  type PalhaSiteSettings,
} from '@/lib/palha/site-settings-shared'
import { PalhaCoverMedia } from '@/app/palhaweddings/PalhaCoverMedia'
import { rememberPalhaAdminSettings } from '@/lib/palha/admin-settings-cache'
import { PalhaFormatField } from '../PalhaFormatField'

function albumStudioHref(albumId: string) {
  return `/palhaweddings/admin/painel/galeria/${encodeURIComponent(albumId)}`
}

function albumIdAtPoint(x: number, y: number) {
  const node = document.elementFromPoint(x, y)
  return node?.closest<HTMLElement>('[data-album-id]')?.dataset.albumId || null
}

export default function PalhaGaleriaAdmin() {
  const [settings, setSettings] = useState<PalhaSiteSettings>(DEFAULT_PALHA_SITE_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const creatingRef = useRef(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [adminPassword, setAdminPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ name: string; x: number; y: number } | null>(null)
  const startRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const reorderLock = useRef(Promise.resolve())

  useEffect(() => {
    fetch('/api/palha/site', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data: PalhaSiteSettings) => setSettings(data))
      .catch(() => setError('Não foi possível carregar as coleções.'))
  }, [])

  async function persist(next: PalhaSiteSettings) {
    const res = await fetch('/api/palha/site', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    })
    const data = (await res.json()) as PalhaSiteSettings & { error?: string }
    if (!res.ok) throw new Error(data.error || 'Não foi possível salvar.')
    rememberPalhaAdminSettings(data)
    setSettings(data)
    return data
  }

  async function saveIntro() {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await persist(settings)
      setMessage('Textos da galeria salvos.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function createCollection() {
    if (creatingRef.current) return
    if (!name.trim()) {
      setError('Digite o nome do álbum.')
      return
    }
    if (password.trim() && password.trim().length < 4) {
      setError('A senha precisa ter pelo menos 4 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }
    creatingRef.current = true
    setCreating(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/palha/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          eventDate,
          password: password.trim(),
        }),
      })
      const data = (await res.json()) as {
        error?: string
        album?: { id: string }
        settings?: PalhaSiteSettings
      }
      if (!res.ok || !data.album?.id) throw new Error(data.error || 'Não foi possível criar a coleção.')
      if (data.settings) {
        rememberPalhaAdminSettings(data.settings)
        setSettings(data.settings)
      }
      setOpen(false)
      setName('')
      setEventDate('')
      setPassword('')
      setPasswordConfirm('')
      window.location.assign(albumStudioHref(data.album.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a coleção.')
    } finally {
      creatingRef.current = false
      setCreating(false)
    }
  }

  async function removeAlbum() {
    if (!pendingDelete) return
    if (!adminPassword.trim()) {
      setError('Digite a senha do admin para excluir.')
      return
    }
    setDeleting(true)
    setError('')
    try {
      const confirmRes = await fetch('/api/palha/auth/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'include',
        body: JSON.stringify({ password: adminPassword }),
      })
      const confirmData = (await confirmRes.json()) as { error?: string }
      if (!confirmRes.ok) throw new Error(confirmData.error || 'Senha incorreta.')

      await persist({
        ...settings,
        gallery: {
          ...settings.gallery,
          albums: settings.gallery.albums.filter((album) => album.id !== pendingDelete.id),
        },
      })
      setPendingDelete(null)
      setAdminPassword('')
      setMessage('Coleção removida.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover.')
    } finally {
      setDeleting(false)
    }
  }

  function reorderAlbums(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    const albums = settings.gallery.albums.slice()
    const [moved] = albums.splice(from, 1)
    if (!moved) return
    albums.splice(to, 0, moved)
    const next = {
      ...settings,
      gallery: {
        ...settings.gallery,
        albums,
      },
    }
    setSettings(next)
    setMessage('Ordem salva.')
    setError('')
    void (reorderLock.current = reorderLock.current.then(async () => {
      try {
        await persist(next)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível salvar a ordem.')
      }
    }))
  }

  function finishDrag(clientX: number, clientY: number, albumId: string) {
    const from = settings.gallery.albums.findIndex((album) => album.id === albumId)
    const targetId = overId || albumIdAtPoint(clientX, clientY)
    const to = targetId ? settings.gallery.albums.findIndex((album) => album.id === targetId) : -1
    const moved = Boolean(activeId)
    startRef.current = null
    setActiveId(null)
    setOverId(null)
    setGhost(null)
    if (!moved || from < 0 || to < 0 || from === to) return
    reorderAlbums(from, to)
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>, album: PalhaAlbum) {
    if (event.button !== 0) return
    event.preventDefault()
    startRef.current = { id: album.id, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>, album: PalhaAlbum) {
    const start = startRef.current
    if (!start || start.id !== album.id) return
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (!activeId && distance < 8) return
    event.preventDefault()
    if (!activeId) setActiveId(album.id)
    setGhost({ name: album.name, x: event.clientX, y: event.clientY })
    const hovered = albumIdAtPoint(event.clientX, event.clientY)
    setOverId(hovered && hovered !== album.id ? hovered : null)
  }

  return (
    <main className="palha-admin-page palha-album-list-page">
      <h1 className="palha-kicker" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: '0 0 1.6rem' }}>
        Galeria
      </h1>

      <div className="palha-admin-form" style={{ marginBottom: '2rem' }}>
        <PalhaFormatField
          label="Título da página"
          value={settings.gallery.title}
          onChange={(value) => setSettings((s) => ({ ...s, gallery: { ...s.gallery, title: value } }))}
        />
        <PalhaFormatField
          label="Subtítulo"
          value={settings.gallery.subtitle}
          onChange={(value) => setSettings((s) => ({ ...s, gallery: { ...s.gallery, subtitle: value } }))}
        />
        <button type="button" className="palha-btn" disabled={saving} onClick={() => void saveIntro()}>
          {saving ? 'Salvando…' : 'Salvar textos'}
        </button>
      </div>

      <div className="palha-album-list-head">
        <h2 className="palha-label">Coleções</h2>
        <button
          type="button"
          className="palha-btn is-solid"
          onClick={() => {
            setError('')
            setMessage('')
            setOpen(true)
          }}
        >
          Criar nova coleção
        </button>
      </div>

      {settings.gallery.albums.length ? (
        <>
          <p className="palha-album-order-hint">Clique na foto ou no nome para editar. Use Reordenar para mudar a ordem na página pública.</p>
          <div className={`palha-album-cards${activeId ? ' is-sorting' : ''}`}>
            {settings.gallery.albums.map((album) => {
              const studioHref = albumStudioHref(album.id)
              return (
              <article
                key={album.id}
                data-album-id={album.id}
                className={`palha-album-card${album.id === activeId ? ' is-lifting' : ''}${album.id === overId ? ' is-drop' : ''}`}
              >
                <a
                  href={studioHref}
                  className="palha-album-card-open"
                  onClick={(event) => {
                    event.preventDefault()
                    window.location.assign(studioHref)
                  }}
                >
                  <span className="palha-album-card-cover">
                    {album.coverUrl ? (
                      <PalhaCoverMedia url={album.coverUrl} kind={album.coverKind} posterUrl={album.coverPosterUrl} />
                    ) : (
                      <span>Sem capa</span>
                    )}
                  </span>
                  <span className="palha-album-card-body">
                    <strong>{album.name}</strong>
                    <p>{formatPalhaEventDate(album.eventDate) || 'Data não informada'}</p>
                    <p>
                      {albumMediaCount(album)} arquivo{albumMediaCount(album) === 1 ? '' : 's'}
                      {album.passwordProtected ? ' · com senha' : ''}
                    </p>
                  </span>
                </a>
                <div className="palha-album-card-tools">
                  <button
                    type="button"
                    className="palha-admin-mini palha-admin-drag"
                    aria-label={`Reordenar ${album.name}`}
                    onPointerDown={(event) => onPointerDown(event, album)}
                    onPointerMove={(event) => onPointerMove(event, album)}
                    onPointerUp={(event) => {
                      if (!startRef.current) return
                      finishDrag(event.clientX, event.clientY, album.id)
                    }}
                    onPointerCancel={() => {
                      startRef.current = null
                      setActiveId(null)
                      setOverId(null)
                      setGhost(null)
                    }}
                  >
                    Reordenar
                  </button>
                  <button
                    type="button"
                    className="palha-admin-mini"
                    onClick={() => {
                      setError('')
                      setAdminPassword('')
                      setPendingDelete({ id: album.id, name: album.name })
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </article>
              )
            })}
          </div>
          {ghost ? (
            <div className="palha-admin-sort-ghost is-list" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
              {ghost.name}
            </div>
          ) : null}
        </>
      ) : (
        <p className="palha-copy">Nenhuma coleção ainda. Crie a primeira com o nome do álbum e a data do evento.</p>
      )}

      {pendingDelete ? (
        <div className="palha-modal-backdrop" onClick={() => !deleting && setPendingDelete(null)}>
          <form
            className="palha-modal palha-admin-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              void removeAlbum()
            }}
          >
            <h2 className="palha-label">Excluir coleção</h2>
            <p className="palha-copy" style={{ margin: '0 0 0.4rem' }}>
              Para excluir <strong>{pendingDelete.name || 'este álbum'}</strong>, digite a senha do admin.
            </p>
            <label>
              Senha do admin
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </label>
            {error ? <p className="palha-admin-error">{error}</p> : null}
            <div className="palha-modal-actions">
              <button type="button" className="palha-btn" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancelar
              </button>
              <button type="submit" className="palha-btn is-solid" disabled={deleting}>
                {deleting ? 'Excluindo…' : 'Excluir álbum'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {!pendingDelete && !open && error ? <p className="palha-admin-error">{error}</p> : null}
      {message ? <p className="palha-copy">{message}</p> : null}

      {open ? (
        <div className="palha-modal-backdrop" onClick={() => !creating && setOpen(false)}>
          <form
            className="palha-modal palha-admin-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              void createCollection()
            }}
          >
            <h2 className="palha-label">Nova coleção</h2>
            <label>
              Nome do álbum
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Casamento Ana e Pedro" autoFocus />
            </label>
            <label>
              Data do evento
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </label>
            <label>
              Senha do link público
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Opcional"
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirmar senha
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            </label>
            <p className="palha-copy" style={{ margin: '-0.2rem 0 0.4rem', fontSize: '0.88rem' }}>
              Quem abrir o link do álbum vai precisar desta senha.
            </p>
            {error ? <p className="palha-admin-error">{error}</p> : null}
            <div className="palha-modal-actions">
              <button type="button" className="palha-btn" onClick={() => setOpen(false)} disabled={creating}>
                Cancelar
              </button>
              <button type="submit" className="palha-btn" disabled={creating}>
                {creating ? 'Criando…' : 'Criar álbum'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}
