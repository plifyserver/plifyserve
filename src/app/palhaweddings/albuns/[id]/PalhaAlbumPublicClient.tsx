'use client'

import { useEffect, useRef, useState } from 'react'
import { PalhaAlbumPresentation } from '../../PalhaAlbumPresentation'
import type { PalhaAlbum } from '@/lib/palha/site-settings-shared'

export function PalhaAlbumPublicClient({
  albumId,
  initial,
  locked: startLocked,
}: {
  albumId: string
  initial: PalhaAlbum
  locked: boolean
}) {
  const unlockedByPasswordRef = useRef(false)
  const [album, setAlbum] = useState(initial)
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(startLocked)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    let cancelled = false
    setAlbum(initial)
    setReady(false)
    setLocked(startLocked)

    async function confirmLock() {
      try {
        const res = await fetch(`/api/palha/albums/${albumId}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const data = (await res.json()) as { locked?: boolean; album?: PalhaAlbum }
        if (cancelled) return
        if (unlockedByPasswordRef.current) {
          if (data.album && !data.locked) setAlbum(data.album)
          setLocked(false)
          return
        }
        if (data.album) setAlbum(data.album)
        setLocked(Boolean(data.locked))
      } catch {
        if (!cancelled && !unlockedByPasswordRef.current) setLocked(startLocked)
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    void confirmLock()
    return () => {
      cancelled = true
    }
  }, [albumId, initial, startLocked])

  async function unlock(event: React.FormEvent) {
    event.preventDefault()
    if (!password.trim()) {
      setError('Digite a senha do álbum.')
      return
    }
    setChecking(true)
    setError('')
    try {
      const res = await fetch(`/api/palha/albums/${albumId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      const data = (await res.json()) as { album?: PalhaAlbum; error?: string }
      if (!res.ok || !data.album) throw new Error(data.error || 'Senha incorreta.')
      unlockedByPasswordRef.current = true
      setAlbum(data.album)
      setLocked(false)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senha incorreta.')
    } finally {
      setChecking(false)
    }
  }

  if (!ready && !locked) {
    return <main className="palha-album-lock" aria-busy="true" />
  }

  if (locked) {
    const askPassword = ready
    const lockCover =
      album.coverKind === 'video'
        ? album.coverPosterUrl || album.subalbums.flatMap((sub) => sub.items).find((item) => item.kind === 'image')?.url
        : album.coverUrl
    return (
      <main className="palha-album-lock">
        {lockCover ? <img src={lockCover} alt="" className="palha-album-lock-bg" /> : null}
        <form className="palha-album-lock-card" onSubmit={(event) => void unlock(event)}>
          <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-cover-logo" />
          <p className="palha-label">Álbum privado</p>
          <h1>{album.name || 'Álbum'}</h1>
          <p>{askPassword ? 'Digite a senha para ver as fotos.' : 'Verificando acesso…'}</p>
          {askPassword ? (
            <>
              <label>
                Senha
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </label>
              {error ? <p className="palha-admin-error">{error}</p> : null}
              <button type="submit" className="palha-btn is-solid" disabled={checking}>
                {checking ? 'Entrando…' : 'Ver álbum'}
              </button>
            </>
          ) : null}
        </form>
      </main>
    )
  }

  return <PalhaAlbumPresentation album={album} />
}
