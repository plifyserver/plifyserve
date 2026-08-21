'use client'

import { useMemo, useState } from 'react'
import { formatPalhaEventDate, type PalhaAlbum, type PalhaMediaItem } from '@/lib/palha/site-settings-shared'

function fileNameFromUrl(url: string, fallback: string) {
  try {
    const name = decodeURIComponent(url.split('?')[0].split('/').pop() || fallback)
    return name || fallback
  } catch {
    return fallback
  }
}

async function downloadMedia(item: PalhaMediaItem, index: number) {
  const fallback = item.kind === 'video' ? `video-${index + 1}.mp4` : `foto-${index + 1}.jpg`
  const name = fileNameFromUrl(item.url, fallback)
  try {
    const res = await fetch(item.url)
    if (!res.ok) throw new Error('download')
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = name
    link.click()
    URL.revokeObjectURL(href)
  } catch {
    window.open(item.url, '_blank', 'noreferrer')
  }
}

export function PalhaAlbumPresentation({
  album,
  preview = false,
}: {
  album: PalhaAlbum
  preview?: boolean
}) {
  const [selectedId, setSelectedId] = useState(album.subalbums[0]?.id || '')
  const selected = useMemo(
    () => album.subalbums.find((sub) => sub.id === selectedId) ?? album.subalbums[0],
    [album.subalbums, selectedId],
  )
  const dateLabel = formatPalhaEventDate(album.eventDate)
  const cover = album.coverUrl

  return (
    <div
      className={`palha-present${preview ? ' is-preview' : ''}`}
      data-cover={album.theme.cover}
      data-type={album.theme.typography}
      data-palette={album.theme.palette}
      data-grid={album.theme.grid}
      data-thumb={album.theme.thumb}
    >
      <section className={`palha-cover is-${album.theme.cover}`}>
        {album.theme.cover === 'romance' || album.theme.cover === 'vintage' ? (
          <>
            {album.theme.cover === 'vintage' ? (
              <div className="palha-cover-photo">{cover ? <img src={cover} alt="" /> : <span />}</div>
            ) : null}
            <div className="palha-cover-copy">
              <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-cover-logo" />
              <h1>{album.name || 'Título'}</h1>
              {dateLabel ? <p className="palha-cover-date">{dateLabel}</p> : null}
              {!preview ? (
                <a className="palha-cover-cta" href="#galeria">
                  Ver galeria
                </a>
              ) : (
                <span className="palha-cover-cta">Ver galeria</span>
              )}
            </div>
            {album.theme.cover === 'romance' ? (
              <div className="palha-cover-photo">{cover ? <img src={cover} alt="" /> : <span />}</div>
            ) : null}
          </>
        ) : (
          <>
            <div className="palha-cover-photo">{cover ? <img src={cover} alt="" /> : <span />}</div>
            <div className="palha-cover-copy">
              <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-cover-logo" />
              <h1>{album.name || 'Título'}</h1>
              {dateLabel ? <p className="palha-cover-date">{dateLabel}</p> : null}
              {!preview ? (
                <a className="palha-cover-cta" href="#galeria">
                  Ver galeria
                </a>
              ) : (
                <span className="palha-cover-cta">Ver galeria</span>
              )}
            </div>
          </>
        )}
      </section>

      <section id="galeria" className="palha-present-gallery">
        {album.subalbums.length > 1 ? (
          <nav className="palha-present-subs">
            {album.subalbums.map((sub) => (
              <button
                key={sub.id}
                type="button"
                className={sub.id === selected?.id ? 'is-current' : undefined}
                onClick={() => setSelectedId(sub.id)}
              >
                {sub.name}
              </button>
            ))}
          </nav>
        ) : null}

        {selected?.items.length ? (
          <div className={`palha-ag palha-ag-${album.theme.grid} palha-ag-${album.theme.thumb}`}>
            {selected.items.map((item, index) => (
              <article key={item.id} className="palha-ag-item">
                {item.kind === 'video' ? (
                  <video src={item.url} controls playsInline preload="metadata" />
                ) : (
                  <img src={item.url} alt={item.caption || ''} />
                )}
                {!preview ? (
                  <button type="button" className="palha-ag-download" onClick={() => void downloadMedia(item, index)}>
                    Baixar
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="palha-present-empty">{preview ? 'As fotos entram aqui.' : 'Este álbum ainda não tem mídia.'}</p>
        )}
      </section>
    </div>
  )
}
