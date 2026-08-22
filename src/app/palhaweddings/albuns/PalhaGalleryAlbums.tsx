'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PalhaReveal } from '../PalhaReveal'
import {
  albumMediaCount,
  formatPalhaEventDate,
  palhaPublicPrefix,
  type PalhaGallery,
} from '@/lib/palha/site-settings-shared'

export function PalhaGalleryAlbums({ gallery }: { gallery: PalhaGallery }) {
  const prefix = palhaPublicPrefix(usePathname())

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
      {gallery.albums.map((album, index) => {
        const count = albumMediaCount(album)
        return (
          <PalhaReveal key={album.id} className="palha-gallery-album" delay={Math.min(index * 90, 360)}>
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
                <span className="palha-gallery-album-count">
                  {album.passwordProtected
                    ? 'Álbum privado'
                    : `${count} arquivo${count === 1 ? '' : 's'}`}
                </span>
              </span>
            </Link>
          </PalhaReveal>
        )
      })}
    </div>
  )
}
