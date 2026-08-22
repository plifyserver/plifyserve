'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react'
import { PALHA_MEDIA_FRAMES, type PalhaGridStyle, type PalhaMediaFrame, type PalhaThumbSize } from '@/lib/palha/album-theme'
import { PALHA_GALLERY_MAX_WIDTH, layoutPalhaGrid } from '@/lib/palha/justified-grid'
import type { PalhaMediaItem } from '@/lib/palha/site-settings-shared'
import { PalhaVideoThumb } from './PalhaVideoThumb'

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
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>({})

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
    setSizes((current) => {
      const prev = current[id]
      if (prev && prev.width === nextWidth && prev.height === nextHeight) return current
      return { ...current, [id]: { width: nextWidth, height: nextHeight } }
    })
  }

  function media(item: PalhaMediaItem, objectFit: 'cover' | 'contain' = 'cover') {
    const onImage = (event: SyntheticEvent<HTMLImageElement>) => {
      rememberSize(item.id, event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
    }
    if (item.kind === 'video') {
      return <PalhaVideoThumb url={item.url} objectFit={objectFit} onReady={(w, h) => rememberSize(item.id, w, h)} />
    }
    return <img src={item.url} alt={item.caption || ''} onLoad={onImage} style={{ objectFit }} />
  }

  const gridBody = masonry ? (
    <div className={`palha-ag palha-ag-${grid} palha-ag-${thumb}`}>
      {items.map((item, index) => (
        <article
          key={item.id}
          className={`palha-ag-item palha-ag-frame-${item.frame || 'auto'}${onOpen ? ' is-openable' : ''}`}
          onClick={onOpen ? () => onOpen(item, index) : undefined}
        >
          {media(item, item.frame === 'inteira' ? 'contain' : 'cover')}
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
              {media(cell.item, cell.objectFit)}
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
