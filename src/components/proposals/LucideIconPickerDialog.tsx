'use client'

import { useMemo, useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'
import { EmpresarialDynamicIcon } from '@/components/proposals/EmpresarialDynamicIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ALL_KEYS = Object.keys(dynamicIconImports) as string[]

/** Ícones comuns para negócios — aparecem quando a busca está vazia */
const CORPORATE_PRESETS = [
  'building-2',
  'landmark',
  'home',
  'factory',
  'trees',
  'briefcase',
  'building',
  'warehouse',
  'store',
  'hotel',
  'hospital',
  'school',
  'land-plot',
  'map-pin',
  'globe',
  'users',
  'handshake',
  'target',
  'trending-up',
  'shield-check',
  'award',
  'lightbulb',
  'layers',
  'layout-grid',
  'pen-tool',
  'palette',
  'cpu',
  'smartphone',
  'truck',
  'package',
  'hard-hat',
]

interface LucideIconPickerDialogProps {
  open: boolean
  onClose: () => void
  onPick: (iconKey: string) => void
  title?: string
}

export function LucideIconPickerDialog({
  open,
  onClose,
  onPick,
  title = 'Escolher ícone',
}: LucideIconPickerDialogProps) {
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) setQ('')
  }, [open])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/\s+/g, '-')
    if (!s) {
      const set = new Set<string>()
      CORPORATE_PRESETS.forEach((k) => {
        if (ALL_KEYS.includes(k)) set.add(k)
      })
      ALL_KEYS.slice(0, 80).forEach((k) => set.add(k))
      return Array.from(set)
    }
    return ALL_KEYS.filter((k) => k.includes(s)).slice(0, 400)
  }, [q])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar (ex.: building, home, chart)…"
              className="pl-9"
              autoFocus
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {ALL_KEYS.length}+ ícones Lucide. Digite para filtrar.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {filtered.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onPick(key)
                  onClose()
                }}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-2 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50"
                title={key}
              >
                <EmpresarialDynamicIcon iconKey={key} size={22} className="text-slate-700" />
                <span className="line-clamp-2 w-full break-all text-[10px] leading-tight text-slate-600">
                  {key}
                </span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">Nenhum ícone encontrado.</p>
          )}
        </div>
        <div className="border-t border-slate-100 p-3">
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
