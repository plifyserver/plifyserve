'use client'

import { X, Landmark } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TemplateType = 'modern' | 'executive' | 'simple' | 'empresarial'

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (template: TemplateType) => void
}

/** Único fluxo ativo: proposta no formato empresarial (landing completa). */
export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nova proposta</h2>
            <p className="mt-1 text-slate-500">Modelo empresarial — landing com hero, planos e contato</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelect('empresarial')}
          className={cn(
            'w-full rounded-2xl border-2 border-slate-200 bg-white p-6 text-left transition-all',
            'cursor-pointer hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'
          )}
        >
          <div className={cn('mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 text-white')}>
            <Landmark className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">Empresarial</h3>
          <p className="text-sm leading-relaxed text-slate-500">
            Hero, trabalhos, planos, depoimentos, sobre nós e contato — tudo em uma página contínua.
          </p>
        </button>
      </div>
    </div>
  )
}
