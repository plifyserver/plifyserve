'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PALHA_MEDIA_FRAMES, type PalhaGridStyle, type PalhaMediaFrame, type PalhaThumbSize } from '@/lib/palha/album-theme'
import { palhaGridImageSrc } from '@/lib/palha/display-url'
import { PALHA_GALLERY_MAX_WIDTH, layoutPalhaGrid } from '@/lib/palha/justified-grid'
import type { PalhaMediaItem } from '@/lib/palha/site-settings-shared'
import { PalhaVideoThumb } from './PalhaVideoThumb'

function PalhaGridPhoto({
  item,
  objectFit,
  displayWidth,
  eager = false,
  onReady,
}: {
  item: PalhaMediaItem
  objectFit: 'cover' | 'contain'
  displayWidth: number
  eager?: boolean
  onReady: (width: number, height: number) => void
}) {
  const boxRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(eager)
  const [src, setSrc] = useState(() => (eager ? palhaGridImageSrc(item.url, displayWidth) : ''))

  useEffect(() => {
    if (visible) return
    const el = boxRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        setSrc(palhaGridImageSrc(item.url, displayWidth))
        observer.disconnect()
      },
      { rootMargin: '1100px 0px', threshold: 0.01 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, item.url, displayWidth])

  const ratio =
    item.width && item.height ? `${item.width} / ${item.height}` : undefined

  return (
    <span ref={boxRef} className="palha-ag-media" style={ratio ? { aspectRatio: ratio } : undefined}>
      {src ? (
        <img
          src={src}
          alt={item.caption || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'low'}
          onLoad={(event) => {
            if (item.width && item.height) {
              onReady(item.width, item.height)
              return
            }
            onReady(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
          }}
          onError={(event) => {
            if (event.currentTarget.src === item.url) return
            event.currentTarget.src = item.url
          }}
          style={{ objectFit }}
        />
      ) : null}
    </span>
  )
}

function FramePicker({
  item,
  onChange,
}: {
  item: PalhaMediaItem
  onChange: (id: string, frame: PalhaMediaFrame) => void
}) {
  return (
    <label className="palha-ag-framebar" onClick={(event) => event.stopPropagation()}>
      <span>Enquadramento</span>
      <select
        value={item.frame || 'auto'}
        onChange={(event) => onChange(item.id, event.target.value as PalhaMediaFrame)}
      >
        {PALHA_MEDIA_FRAMES.map((frame) => (
          <option key={frame.id} value={frame.id}>
            {frame.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PalhaAlbumGrid({
  items,
  grid,
  thumb,
  preview = false,
  onOpen,
  onFrameChange,
  renderActions,
}: {
  items: PalhaMediaItem[]
  grid: PalhaGridStyle
  thumb: PalhaThumbSize
  preview?: boolean
  onOpen?: (item: PalhaMediaItem, index: number) => void
  onFrameChange?: (id: string, frame: PalhaMediaFrame) => void
  renderActions?: (item: PalhaMediaItem, index: number) => ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [pageHeight, setPageHeight] = useState(0)
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({})
  const sizes = useMemo(() => {
    const next = { ...measured }
    for (const item of items) {
      if (item.width && item.height && !next[item.id]) {
        next[item.id] = { width: item.width, height: item.height }
      }
    }
    return next
  }, [items, measured])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const masonry = grid === 'vertical' || grid === 'horizontal'
  const layoutWidth = preview ? PALHA_GALLERY_MAX_WIDTH : width
  const scale = preview && width ? Math.min(1, width / PALHA_GALLERY_MAX_WIDTH) : 1
  const rows = useMemo(
    () => (masonry || !layoutWidth ? [] : layoutPalhaGrid(items, { grid, thumb, containerWidth: layoutWidth, sizes })),
    [items, grid, thumb, layoutWidth, sizes, masonry],
  )

  useEffect(() => {
    const page = pageRef.current
    if (!preview || !page) return
    const update = () => setPageHeight(page.scrollHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(page)
    return () => observer.disconnect()
  }, [preview, rows, items, grid, thumb])

  function rememberSize(id: string, nextWidth: number, nextHeight: number) {
    if (!(nextWidth > 0 && nextHeight > 0)) return
    setMeasured((current) => {
      const prev = current[id]
      if (prev && prev.width === nextWidth && prev.height === nextHeight) return current
      return { ...current, [id]: { width: nextWidth, height: nextHeight } }
    })
  }

  function media(item: PalhaMediaItem, objectFit: 'cover' | 'contain' = 'cover', displayWidth = 420, eager = false) {
    if (item.kind === 'video') {
      if (item.posterUrl) {
        return (
          <PalhaGridPhoto
            item={{ ...item, url: item.posterUrl, kind: 'image' }}
            objectFit={objectFit}
            displayWidth={displayWidth}
            eager={eager}
            onReady={(w, h) => rememberSize(item.id, item.width || w, item.height || h)}
          />
        )
      }
      return (
        <PalhaVideoThumb
          url={item.url}
          posterUrl={item.posterUrl}
          objectFit={objectFit}
          onReady={(w, h) => rememberSize(item.id, w, h)}
        />
      )
    }
    return (
      <PalhaGridPhoto
        item={item}
        objectFit={objectFit}
        displayWidth={displayWidth}
        eager={eager}
        onReady={(w, h) => rememberSize(item.id, w, h)}
      />
    )
  }

  const gridBody = masonry ? (
    <div className={`palha-ag palha-ag-${grid} palha-ag-${thumb}`}>
      {items.map((item, index) => (
        <article
          key={item.id}
          className={`palha-ag-item palha-ag-frame-${item.frame || 'auto'}${onOpen ? ' is-openable' : ''}`}
          onClick={onOpen ? () => onOpen(item, index) : undefined}
        >
          {media(item, item.frame === 'inteira' ? 'contain' : 'cover', Math.min(width || 420, 640), index < 8)}
          {item.kind === 'video' ? <span className="palha-ag-play" aria-hidden="true" /> : null}
          {onFrameChange ? <FramePicker item={item} onChange={onFrameChange} /> : null}
          {renderActions ? <div className="palha-ag-actions">{renderActions(item, index)}</div> : null}
        </article>
      ))}
    </div>
  ) : (
    <div className={`palha-ag palha-ag-justified palha-ag-${grid} palha-ag-${thumb}`}>
      {rows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="palha-ag-row">
          {row.map((cell) => (
            <article
              key={cell.item.id}
              className={`palha-ag-item palha-ag-frame-${cell.item.frame || 'auto'}${onOpen ? ' is-openable' : ''}`}
              style={{ width: cell.width, height: cell.height }}
              onClick={onOpen ? () => onOpen(cell.item, cell.index) : undefined}
            >
              {media(cell.item, cell.objectFit, cell.width, cell.index < 8)}
              {cell.item.kind === 'video' ? <span className="palha-ag-play" aria-hidden="true" /> : null}
              {onFrameChange ? <FramePicker item={cell.item} onChange={onFrameChange} /> : null}
              {renderActions ? <div className="palha-ag-actions">{renderActions(cell.item, cell.index)}</div> : null}
            </article>
          ))}
        </div>
      ))}
    </div>
  )

  if (!preview) {
    return (
      <div ref={boxRef} className="palha-ag-shell">
        {gridBody}
      </div>
    )
  }

  const pageStyle = {
    width: PALHA_GALLERY_MAX_WIDTH,
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    '--palha-frame-unscale': String(1 / Math.max(scale, 0.6)),
  } as CSSProperties

  return (
    <div ref={boxRef} className="palha-ag-shell is-preview-scale" style={{ height: pageHeight ? pageHeight * scale : undefined }}>
      <div ref={pageRef} className="palha-ag-page" style={pageStyle}>
        {gridBody}
      </div>
    </div>
  )
}
