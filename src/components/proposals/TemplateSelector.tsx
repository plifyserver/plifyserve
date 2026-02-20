'use client'

import { X, Sparkles, Briefcase, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TemplateType = 'modern' | 'executive' | 'simple'

interface Template {
  id: TemplateType
  name: string
  description: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'Moderno e Clean',
    description: 'Design minimalista com foco em clareza e profissionalismo.',
    icon: <Sparkles className="w-6 h-6" />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'executive',
    name: 'Executivo Premium',
    description: 'Layout sofisticado para propostas de alto valor.',
    icon: <Briefcase className="w-6 h-6" />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'simple',
    name: 'Simples e Direto',
    description: 'Estrutura objetiva e fácil de entender.',
    icon: <FileText className="w-6 h-6" />,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Escolha um template</h2>
            <p className="text-slate-500 mt-1">Selecione o estilo da sua proposta</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={cn(
                'group relative p-6 rounded-2xl border-2 border-slate-200 bg-white',
                'hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10',
                'transition-all duration-200 text-left'
              )}
            >
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                'transition-transform group-hover:scale-110',
                template.iconBg, template.iconColor
              )}>
                {template.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {template.description}
              </p>
              <div className={cn(
                'absolute inset-0 rounded-2xl border-2 border-indigo-500 opacity-0',
                'group-hover:opacity-100 transition-opacity pointer-events-none'
              )} />
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Você poderá personalizar cores e conteúdo depois
        </p>
      </div>
    </div>
  )
}
