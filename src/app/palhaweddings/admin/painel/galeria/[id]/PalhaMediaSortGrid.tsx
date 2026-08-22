'use client'

import { useRef, useState } from 'react'
import type { PalhaMediaItem } from '@/lib/palha/site-settings-shared'

type Ghost = {
  url: string
  kind: PalhaMediaItem['kind']
  x: number
  y: number
}

function mediaIdAtPoint(x: number, y: number) {
  const node = document.elementFromPoint(x, y)
  return node?.closest<HTMLElement>('[data-media-id]')?.dataset.mediaId || null
}

export function PalhaMediaSortGrid({
  items,
  onReorder,
  onRemove,
}: {
  items: PalhaMediaItem[]
  onReorder: (from: number, to: number) => void
  onRemove: (id: string) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const startRef = useRef<{ id: string; x: number; y: number } | null>(null)

  function finishDrag(clientX: number, clientY: number, itemId: string) {
    const from = items.findIndex((item) => item.id === itemId)
    const targetId = overId || mediaIdAtPoint(clientX, clientY)
    const to = targetId ? items.findIndex((item) => item.id === targetId) : -1
    startRef.current = null
    setActiveId(null)
    setOverId(null)
    setGhost(null)
    if (from < 0 || to < 0 || from === to) return
    onReorder(from, to)
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>, item: PalhaMediaItem) {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('button')) return
    startRef.current = { id: item.id, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>, item: PalhaMediaItem) {
    const start = startRef.current
    if (!start || start.id !== item.id) return
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (!activeId && distance < 8) return
    event.preventDefault()
    if (!activeId) setActiveId(item.id)
    setGhost({ url: item.url, kind: item.kind, x: event.clientX, y: event.clientY })
    const hovered = mediaIdAtPoint(event.clientX, event.clientY)
    setOverId(hovered && hovered !== item.id ? hovered : null)
  }

  return (
    <>
      <div className={`palha-admin-gallery-grid${activeId ? ' is-sorting' : ''}`}>
        {items.map((item) => (
          <article
            key={item.id}
            data-media-id={item.id}
            className={`palha-admin-gallery-card${item.id === activeId ? ' is-lifting' : ''}${item.id === overId ? ' is-drop' : ''}`}
            onPointerDown={(event) => onPointerDown(event, item)}
            onPointerMove={(event) => onPointerMove(event, item)}
            onPointerUp={(event) => {
              if (!startRef.current) return
              finishDrag(event.clientX, event.clientY, item.id)
            }}
            onPointerCancel={() => {
              startRef.current = null
              setActiveId(null)
              setOverId(null)
              setGhost(null)
            }}
          >
            <div className="palha-admin-drag">
              {item.kind === 'video' ? (
                <video src={item.url} muted playsInline draggable={false} />
              ) : (
                <img src={item.url} alt="" draggable={false} />
              )}
            </div>
            <button type="button" className="palha-admin-mini" onClick={() => onRemove(item.id)}>
              Remover
            </button>
          </article>
        ))}
      </div>
      {ghost ? (
        <div className="palha-admin-sort-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          {ghost.kind === 'video' ? <video src={ghost.url} muted playsInline /> : <img src={ghost.url} alt="" />}
        </div>
      ) : null}
    </>
  )
}
