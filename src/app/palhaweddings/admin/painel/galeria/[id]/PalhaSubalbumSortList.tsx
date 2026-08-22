'use client'

import { useRef, useState } from 'react'
import type { PalhaSubAlbum } from '@/lib/palha/site-settings-shared'

function subIdAtPoint(x: number, y: number) {
  const node = document.elementFromPoint(x, y)
  return node?.closest<HTMLElement>('[data-sub-id]')?.dataset.subId || null
}

export function PalhaSubalbumSortList({
  items,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
}: {
  items: PalhaSubAlbum[]
  selectedId: string
  onSelect: (id: string) => void
  onReorder: (from: number, to: number) => void
  onRemove: (id: string) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [ghost, setGhost] = useState<{ name: string; x: number; y: number } | null>(null)
  const startRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const draggedRef = useRef(false)

  function finishDrag(clientX: number, clientY: number, itemId: string) {
    const from = items.findIndex((item) => item.id === itemId)
    const targetId = overId || subIdAtPoint(clientX, clientY)
    const to = targetId ? items.findIndex((item) => item.id === targetId) : -1
    const moved = draggedRef.current
    startRef.current = null
    setActiveId(null)
    setOverId(null)
    setGhost(null)
    if (moved) window.setTimeout(() => {
      draggedRef.current = false
    }, 0)
    else draggedRef.current = false
    if (!moved || from < 0 || to < 0 || from === to) return
    onReorder(from, to)
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>, item: PalhaSubAlbum) {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('.palha-album-sub-remove')) return
    draggedRef.current = false
    startRef.current = { id: item.id, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>, item: PalhaSubAlbum) {
    const start = startRef.current
    if (!start || start.id !== item.id) return
    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (!activeId && distance < 8) return
    event.preventDefault()
    draggedRef.current = true
    if (!activeId) setActiveId(item.id)
    setGhost({ name: item.name, x: event.clientX, y: event.clientY })
    const hovered = subIdAtPoint(event.clientX, event.clientY)
    setOverId(hovered && hovered !== item.id ? hovered : null)
  }

  return (
    <>
      <ul className={`palha-album-sublist${activeId ? ' is-sorting' : ''}`}>
        {items.map((sub) => (
          <li
            key={sub.id}
            data-sub-id={sub.id}
            className={`${sub.id === selectedId ? 'is-current' : ''}${sub.id === activeId ? ' is-lifting' : ''}${sub.id === overId ? ' is-drop' : ''}`}
            onPointerDown={(event) => onPointerDown(event, sub)}
            onPointerMove={(event) => onPointerMove(event, sub)}
            onPointerUp={(event) => {
              if (!startRef.current) return
              finishDrag(event.clientX, event.clientY, sub.id)
            }}
            onPointerCancel={() => {
              startRef.current = null
              draggedRef.current = false
              setActiveId(null)
              setOverId(null)
              setGhost(null)
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (draggedRef.current) return
                onSelect(sub.id)
              }}
            >
              <strong>{sub.name}</strong>
              <em>{sub.items.length}</em>
            </button>
            {items.length > 1 ? (
              <button type="button" className="palha-album-sub-remove" onClick={() => onRemove(sub.id)}>
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {ghost ? (
        <div className="palha-admin-sort-ghost is-list" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          {ghost.name}
        </div>
      ) : null}
    </>
  )
}
