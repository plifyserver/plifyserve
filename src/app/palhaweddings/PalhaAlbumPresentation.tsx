'use client'

import { useEffect, useMemo, useState } from 'react'
import { PalhaAlbumGrid } from '@/app/palhaweddings/PalhaAlbumGrid'
import type { PalhaMediaFrame } from '@/lib/palha/album-theme'
import { formatPalhaEventDate, type PalhaAlbum, type PalhaMediaItem } from '@/lib/palha/site-settings-shared'

function fileNameFromUrl(url: string, fallback: string) {
  try {
    const name = decodeURIComponent(url.split('?')[0].split('/').pop() || fallback)
    return name || fallback
  } catch {
    return fallback
  }
}

function downloadHref(item: PalhaMediaItem, index: number) {
  const fallback = item.kind === 'video' ? `video-${index + 1}.mp4` : `foto-${index + 1}.jpg`
  const name = fileNameFromUrl(item.url, fallback)
  return `/api/palha/download?url=${encodeURIComponent(item.url)}&name=${encodeURIComponent(name)}`
}

async function downloadMedia(item: PalhaMediaItem, index: number) {
  const fallback = item.kind === 'video' ? `video-${index + 1}.mp4` : `foto-${index + 1}.jpg`
  const name = fileNameFromUrl(item.url, fallback)
  const endpoint = downloadHref(item, index)

  const metaRes = await fetch(endpoint, { credentials: 'include', cache: 'no-store' })
  const meta = (await metaRes.json()) as {
    url?: string
    filename?: string
    contentType?: string
    error?: string
  }
  if (!metaRes.ok || !meta.url) throw new Error(meta.error || 'download')

  const filename = meta.filename || name
  try {
    const fileRes = await fetch(meta.url, { cache: 'no-store' })
    if (!fileRes.ok) throw new Error('download')
    const buffer = await fileRes.arrayBuffer()
    const type = meta.contentType || fileRes.headers.get('content-type') || 'application/octet-stream'
    const blob = new Blob([buffer], { type })
    const file = new File([buffer], filename, { type })

    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    const href = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = href
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(href), 4000)
  } catch {
    window.location.assign(meta.url)
  }
}

export function PalhaAlbumPresentation({
  album,
  preview = false,
  onFrameChange,
}: {
  album: PalhaAlbum
  preview?: boolean
  onFrameChange?: (id: string, frame: PalhaMediaFrame) => void
}) {
  const [selectedId, setSelectedId] = useState(album.subalbums[0]?.id || '')
  const [viewer, setViewer] = useState<{ item: PalhaMediaItem; index: number } | null>(null)
  const [savingId, setSavingId] = useState('')
  const selected = useMemo(
    () => album.subalbums.find((sub) => sub.id === selectedId) ?? album.subalbums[0],
    [album.subalbums, selectedId],
  )
  const dateLabel = formatPalhaEventDate(album.eventDate)
  const cover = album.coverUrl

  useEffect(() => {
    if (!viewer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewer(null)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [viewer])

  async function saveMedia(item: PalhaMediaItem, index: number) {
    if (savingId) return
    setSavingId(item.id)
    try {
      await downloadMedia(item, index)
    } catch {
      // O fallback do download já tenta o arquivo original.
    } finally {
      setSavingId('')
    }
  }

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
                onClick={() => {
                  setSelectedId(sub.id)
                  setViewer(null)
                }}
              >
                {sub.name}
              </button>
            ))}
          </nav>
        ) : null}

        {selected?.items.length ? (
          <PalhaAlbumGrid
            items={selected.items}
            grid={album.theme.grid}
            thumb={album.theme.thumb}
            preview={preview}
            onFrameChange={preview ? onFrameChange : undefined}
            onOpen={!preview ? (item, index) => setViewer({ item, index }) : undefined}
            renderActions={
              preview
                ? undefined
                : (item, index) => (
                    <>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setViewer({ item, index })
                        }}
                      >
                        Visualizar
                      </button>
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          void saveMedia(item, index)
                        }}
                      >
                        {savingId === item.id ? 'Salvando…' : 'Baixar'}
                      </button>
                    </>
                  )
            }
          />
        ) : (
          <p className="palha-present-empty">{preview ? 'As fotos entram aqui.' : 'Este álbum ainda não tem mídia.'}</p>
        )}
      </section>

      {viewer && !preview ? (
        <div className="palha-lightbox" role="dialog" aria-modal="true" aria-label="Visualizar mídia">
          <button type="button" className="palha-lightbox-backdrop" aria-label="Fechar" onClick={() => setViewer(null)} />
          <div className="palha-lightbox-card">
            <button type="button" className="palha-lightbox-close" onClick={() => setViewer(null)}>
              Fechar
            </button>
            {viewer.item.kind === 'video' ? (
              <video src={viewer.item.url} controls autoPlay playsInline preload="metadata" />
            ) : (
              <img src={viewer.item.url} alt={viewer.item.caption || album.name || ''} />
            )}
            <div className="palha-lightbox-tools">
              <button type="button" disabled={savingId === viewer.item.id} onClick={() => void saveMedia(viewer.item, viewer.index)}>
                {savingId === viewer.item.id ? 'Salvando…' : 'Baixar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
