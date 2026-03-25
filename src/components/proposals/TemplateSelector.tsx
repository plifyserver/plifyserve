'use client'

import { X, Landmark, Sparkles, LayoutGrid, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export type TemplateType = 'modern' | 'executive' | 'simple' | 'empresarial'

const OPTIONS: {
  id: TemplateType
  label: string
  description: string
  icon: typeof Landmark
  enabled: boolean
}[] = [
  {
    id: 'empresarial',
    label: 'Empresarial',
    description: 'Hero, trabalhos, planos, depoimentos, sobre nós e contato — landing completa.',
    icon: Landmark,
    enabled: true,
  },
  {
    id: 'simple',
    label: 'Clean',
    description:
      'Divulgação: páginas escuras estilo portfolio, sem planos no link — botão flutuante para WhatsApp (partilhável).',
    icon: Sparkles,
    enabled: true,
  },
  {
    id: 'modern',
    label: 'Moderno',
    description: 'Capa escura estilo agência (logo, @ redes, frase central, nome gigante) + planos e conteúdo.',
    icon: LayoutGrid,
    enabled: true,
  },
  {
    id: 'executive',
    label: 'Executivo',
    description: 'Tom formal, ideal para B2B e contratos de maior valor.',
    icon: Briefcase,
    enabled: false,
  },
]

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (template: TemplateType) => void
}

export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nova proposta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Empresarial (landing completa), Clean (portfolio / divulgação) ou Moderno (hero escuro + proposta). Executivo
              em breve.
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-xl p-2 transition-colors hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon
            const disabled = !opt.enabled
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (disabled) {
                    toast.info('Este modelo estará disponível em breve.')
                    return
                  }
                  onSelect(opt.id)
                  onClose()
                }}
                className={cn(
                  'rounded-2xl border-2 p-5 text-left transition-all',
                  disabled
                    ? 'cursor-not-allowed border-slate-100 bg-slate-50/80 opacity-75'
                    : 'cursor-pointer border-slate-200 bg-white hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10'
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl text-white',
                      disabled ? 'bg-slate-400' : 'bg-zinc-800'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {disabled && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      Em breve
                    </span>
                  )}
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-slate-900">{opt.label}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{opt.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
