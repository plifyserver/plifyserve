'use client'

import { useRef, type KeyboardEvent, type RefObject } from 'react'

type PalhaFormatFieldProps = {
  label: string
  value: string
  multiline?: boolean
  rows?: number
  onChange: (value: string) => void
}

function wrapSelection(
  value: string,
  start: number,
  end: number,
  mark: '*' | '**',
) {
  const selected = value.slice(start, end)
  const before = value.slice(0, start)
  const after = value.slice(end)

  if (selected.startsWith(mark) && selected.endsWith(mark) && selected.length > mark.length * 2) {
    const inner = selected.slice(mark.length, selected.length - mark.length)
    return { next: before + inner + after, cursorStart: start, cursorEnd: start + inner.length }
  }

  if (before.endsWith(mark) && after.startsWith(mark)) {
    return {
      next: before.slice(0, -mark.length) + selected + after.slice(mark.length),
      cursorStart: start - mark.length,
      cursorEnd: end - mark.length,
    }
  }

  const inner = selected || (mark === '**' ? 'negrito' : 'itálico')
  return {
    next: `${before}${mark}${inner}${mark}${after}`,
    cursorStart: start + mark.length,
    cursorEnd: start + mark.length + inner.length,
  }
}

export function PalhaFormatField({
  label,
  value,
  multiline,
  rows = 6,
  onChange,
}: PalhaFormatFieldProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  function apply(mark: '*' | '**') {
    const el = inputRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const result = wrapSelection(value, start, end, mark)
    onChange(result.next)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(result.cursorStart, result.cursorEnd)
    })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey)) return
    if (event.key.toLowerCase() === 'b') {
      event.preventDefault()
      apply('**')
    }
    if (event.key.toLowerCase() === 'i') {
      event.preventDefault()
      apply('*')
    }
  }

  return (
    <div className="palha-admin-editor">
      <span className="palha-admin-field-name">{label}</span>
      <div className="palha-admin-toolbar">
        <button
          type="button"
          className="is-bold"
          title="Negrito"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply('**')}
        >
          N
        </button>
        <button
          type="button"
          className="is-italic"
          title="Itálico"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply('*')}
        >
          I
        </button>
      </div>
      {multiline ? (
        <textarea
          ref={inputRef as RefObject<HTMLTextAreaElement>}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      ) : (
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  )
}
