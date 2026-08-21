'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  DEFAULT_PALHA_SITE_SETTINGS,
  albumMediaCount,
  createPalhaAlbum,
  formatPalhaEventDate,
  palhaAdminPrefix,
  type PalhaSiteSettings,
} from '@/lib/palha/site-settings-shared'
import { PalhaFormatField } from '../PalhaFormatField'

export default function PalhaGaleriaAdmin() {
  const pathname = usePathname()
  const router = useRouter()
  const prefix = palhaAdminPrefix(pathname)
  const [settings, setSettings] = useState<PalhaSiteSettings>(DEFAULT_PALHA_SITE_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
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
    setCreating(true)
    setError('')
    try {
      const album = createPalhaAlbum(name, eventDate)
      const next = {
        ...settings,
        gallery: { ...settings.gallery, albums: [...settings.gallery.albums, album] },
      }
      await persist(next)
      if (password.trim()) {
        const res = await fetch(`/api/palha/albums/${album.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: password.trim() }),
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) throw new Error(data.error || 'Álbum criado, mas a senha não foi salva.')
      }
      setOpen(false)
      setName('')
      setEventDate('')
      setPassword('')
      setPasswordConfirm('')
      router.push(`${prefix}/painel/galeria/${album.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a coleção.')
    } finally {
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

  return (
    <main className="palha-admin-page palha-album-list-page">
      <h1 className="palha-kicker" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: '0 0 0.4rem' }}>
        Galeria
      </h1>
      <p className="palha-copy" style={{ marginBottom: '1.6rem' }}>
        Crie coleções por casamento. Cada álbum pode ter capa, fotos, vídeos e subálbuns.
      </p>

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
        <button type="button" className="palha-btn is-solid" onClick={() => setOpen(true)}>
          Criar nova coleção
        </button>
      </div>

      {settings.gallery.albums.length ? (
        <div className="palha-album-cards">
          {settings.gallery.albums.map((album) => (
            <article key={album.id} className="palha-album-card">
              <Link href={`${prefix}/painel/galeria/${album.id}`} className="palha-album-card-cover">
                {album.coverUrl ? <img src={album.coverUrl} alt="" /> : <span>Sem capa</span>}
              </Link>
              <div className="palha-album-card-body">
                <Link href={`${prefix}/painel/galeria/${album.id}`}>
                  <strong>{album.name}</strong>
                </Link>
                <p>{formatPalhaEventDate(album.eventDate) || 'Data não informada'}</p>
                <p>
                  {albumMediaCount(album)} arquivo{albumMediaCount(album) === 1 ? '' : 's'}
                  {album.passwordProtected ? ' · com senha' : ''}
                </p>
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
          ))}
        </div>
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

      {!pendingDelete && error ? <p className="palha-admin-error">{error}</p> : null}
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
