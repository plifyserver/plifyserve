'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PalhaReveal } from '../PalhaReveal'
import { PalhaRichText } from '../PalhaRichText'
import {
  albumMediaCount,
  formatPalhaEventDate,
  palhaPublicPrefix,
  type PalhaGallery,
} from '@/lib/palha/site-settings-shared'

export function PalhaGalleryAlbums({ gallery }: { gallery: PalhaGallery }) {
  const prefix = palhaPublicPrefix(usePathname())

  if (!gallery.albums.length) {
    return <p className="palha-copy palha-gallery-empty">Em breve, novas imagens.</p>
  }

  return (
    <div className="palha-gallery-albums">
      {gallery.albums.map((album, index) => (
        <PalhaReveal key={album.id} className="palha-gallery-album" delay={Math.min(index * 80, 320)}>
          <Link href={`${prefix}/portfolio/${album.id}`} prefetch={false}>
            <span className="palha-gallery-album-cover">
              {album.coverUrl ? <img src={album.coverUrl} alt="" /> : <span>Sem capa</span>}
            </span>
            <strong>{album.name}</strong>
            {album.eventDate ? <em>{formatPalhaEventDate(album.eventDate)}</em> : null}
            <span>
              {album.passwordProtected
                ? 'Álbum privado'
                : `${albumMediaCount(album)} arquivo${albumMediaCount(album) === 1 ? '' : 's'}`}
            </span>
          </Link>
        </PalhaReveal>
      ))}
    </div>
  )
}
