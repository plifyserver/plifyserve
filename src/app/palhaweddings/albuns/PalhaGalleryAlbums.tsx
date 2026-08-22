'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PalhaReveal } from '../PalhaReveal'
import { PalhaRichText } from '../PalhaRichText'
import {
  albumMediaCount,
  formatPalhaEventDate,
  palhaPublicPrefix,
  type PalhaGallery,
} from '@/lib/palha/site-settings-shared'

function foldText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function PalhaGalleryAlbums({ gallery }: { gallery: PalhaGallery }) {
  const prefix = palhaPublicPrefix(usePathname())
  const [query, setQuery] = useState('')
  const [eventDate, setEventDate] = useState('')

  const albums = useMemo(() => {
    const name = foldText(query)
    return gallery.albums.filter((album) => {
      const matchesName = !name || foldText(album.name).includes(name)
      const matchesDate = !eventDate || album.eventDate === eventDate
      return matchesName && matchesDate
    })
  }, [gallery.albums, query, eventDate])

  if (!gallery.albums.length) {
    return (
      <div className="palha-gallery-empty-state">
        <p className="palha-copy">Em breve, novas imagens.</p>
        <p className="palha-gallery-empty-hint">Os álbuns publicados aparecem aqui.</p>
      </div>
    )
  }

  return (
    <div className="palha-gallery-albums">
      <form className="palha-gallery-tools" onSubmit={(event) => event.preventDefault()}>
        <label>
          Buscar álbum
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome do casal ou do evento"
          />
        </label>
        <label>
          Data do evento
          <input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
        </label>
        {query || eventDate ? (
          <button
            type="button"
            className="palha-gallery-tools-clear"
            onClick={() => {
              setQuery('')
              setEventDate('')
            }}
          >
            Limpar
          </button>
        ) : null}
      </form>

      {albums.length ? (
        albums.map((album, index) => {
        const count = albumMediaCount(album)
        const flip = index % 2 === 1
        return (
          <PalhaReveal
            key={album.id}
            className={`palha-gallery-album${flip ? ' is-flip' : ''}`}
            delay={Math.min(index * 90, 360)}
          >
            <Link href={`${prefix}/albuns/${album.id}`} prefetch={false} className="palha-gallery-album-link">
              <span className="palha-gallery-album-cover">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt="" />
                ) : (
                  <span className="palha-gallery-album-placeholder">Sem capa</span>
                )}
                {album.passwordProtected ? (
                  <span className="palha-gallery-album-badge">Privado</span>
                ) : null}
              </span>
              <span className="palha-gallery-album-meta">
                <strong>{album.name}</strong>
                {album.eventDate ? <em>{formatPalhaEventDate(album.eventDate)}</em> : null}
                {album.summary?.trim() ? (
                  <p className="palha-gallery-album-summary">
                    <PalhaRichText text={album.summary.trim()} />
                  </p>
                ) : null}
                <span className="palha-gallery-album-count">
                  {album.passwordProtected
                    ? 'Álbum privado'
                    : `${count} arquivo${count === 1 ? '' : 's'}`}
                </span>
                <span className="palha-gallery-album-cta">Ver álbum</span>
              </span>
            </Link>
          </PalhaReveal>
        )
        })
      ) : (
        <div className="palha-gallery-empty-state">
          <p className="palha-copy">Nenhum álbum com esse nome ou data.</p>
          <p className="palha-gallery-empty-hint">Tente outro nome ou limpe o filtro.</p>
        </div>
      )}
    </div>
  )
}
