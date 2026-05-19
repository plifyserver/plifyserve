'use client'

import { useEffect, useState } from 'react'
import { Bold, Italic, Underline, Eraser } from 'lucide-react'
import type { WakeQuizBlockTypography, WakeQuizFontKey } from '@/lib/wakeQuizTypography'

const FONT_OPTIONS: { value: WakeQuizFontKey; label: string }[] = [
  { value: 'grotesk', label: 'Space Grotesk' },
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'dmSans', label: 'DM Sans' },
  { value: 'playfair', label: 'Playfair Display' },
]

function mergeTypography(
  base: WakeQuizBlockTypography | undefined,
  patch: Partial<Record<keyof WakeQuizBlockTypography, WakeQuizBlockTypography[keyof WakeQuizBlockTypography] | undefined>>
): WakeQuizBlockTypography | undefined {
  const next: WakeQuizBlockTypography = { ...(base ?? {}) }
  for (const [key, val] of Object.entries(patch) as [keyof WakeQuizBlockTypography, unknown][]) {
    if (val === undefined) {
      delete (next as Record<string, unknown>)[key as string]
    } else {
      ;(next as Record<string, unknown>)[key as string] = val
    }
  }
  return Object.keys(next).length > 0 ? next : undefined
}

type Props = {
  value: WakeQuizBlockTypography | undefined
  onChange: (next: WakeQuizBlockTypography | undefined) => void
  /** Rótulo curto para o painel (ex.: «Texto do título») */
  heading?: string
}

export function WakeQuizTypographyControls({ value, onChange, heading = 'Tipografia do texto' }: Props) {
  const v = value ?? {}
  const committedPx = v.fontSizePx

  /** Texto livre no campo; o limite 8–120 só aplica no blur (evita «1» virar 8 ao digitar «16»). */
  const [fontSizeDraft, setFontSizeDraft] = useState(() =>
    committedPx !== undefined && committedPx !== null ? String(committedPx) : ''
  )

  useEffect(() => {
    setFontSizeDraft(committedPx !== undefined && committedPx !== null ? String(committedPx) : '')
  }, [committedPx])

  const patch = (p: Partial<Record<keyof WakeQuizBlockTypography, WakeQuizBlockTypography[keyof WakeQuizBlockTypography] | undefined>>) => {
    onChange(mergeTypography(value, p))
  }

  const commitFontSizePx = () => {
    const raw = fontSizeDraft.trim()
    if (raw === '') {
      patch({ fontSizePx: undefined })
      return
    }
    const n = Number(raw)
    if (Number.isNaN(n)) {
      setFontSizeDraft(committedPx !== undefined && committedPx !== null ? String(committedPx) : '')
      return
    }
    patch({ fontSizePx: Math.min(120, Math.max(8, Math.round(n))) })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-slate-800">{heading}</p>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          <Eraser className="size-3" />
          Limpar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1">Tamanho (px)</label>
          <input
            type="number"
            min={8}
            max={120}
            value={fontSizeDraft}
            placeholder="—"
            onChange={(e) => setFontSizeDraft(e.target.value)}
            onBlur={() => commitFontSizePx()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-slate-600 mb-1">Cor</label>
          <input
            type="color"
            value={v.color?.startsWith('#') ? v.color : '#1e293b'}
            onChange={(e) => patch({ color: e.target.value })}
            className="h-9 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-slate-600 mb-1">Fonte</label>
        <select
          value={v.fontKey ?? ''}
          onChange={(e) => {
            const k = e.target.value as WakeQuizFontKey | ''
            if (!k) patch({ fontKey: undefined })
            else patch({ fontKey: k })
          }}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        >
          <option value="">(padrão da vista)</option>
          {FONT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => patch({ bold: v.bold ? undefined : true })}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
            v.bold ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white'
          }`}
        >
          <Bold className="size-3.5" /> Negrito
        </button>
        <button
          type="button"
          onClick={() => patch({ italic: v.italic ? undefined : true })}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
            v.italic ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white'
          }`}
        >
          <Italic className="size-3.5" /> Itálico
        </button>
        <button
          type="button"
          onClick={() => patch({ underline: v.underline ? undefined : true })}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${
            v.underline ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200 bg-white'
          }`}
        >
          <Underline className="size-3.5" /> Sublinhado
        </button>
      </div>
    </div>
  )
}
