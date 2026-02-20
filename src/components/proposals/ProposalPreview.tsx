'use client'

import { Check, Calendar, MapPin, Mail, Phone, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from './PlanCard'

export interface ProposalData {
  template: 'modern' | 'executive' | 'simple'
  clientName: string
  company: {
    name: string
    document: string
    logo: string | null
    address: string
    email: string
    phone: string
  }
  paymentType: 'plans' | 'single'
  plans: Plan[]
  singlePrice: number
  deliveryType: 'immediate' | 'scheduled'
  deliveryDate: string
  description: string
  blocks: ContentBlock[]
  colorPalette: ColorPalette
}

export interface ContentBlock {
  id: string
  type: 'text' | 'image' | 'heading' | 'divider'
  content: string
}

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

const defaultPalette: ColorPalette = {
  primary: '#6366F1',
  secondary: '#1E293B',
  accent: '#F59E0B',
  background: '#FFFFFF',
  text: '#334155',
}

interface ProposalPreviewProps {
  data: ProposalData
  className?: string
}

export function ProposalPreview({ data, className }: ProposalPreviewProps) {
  const palette = { ...defaultPalette, ...data.colorPalette }
  const { template } = data

  const getTemplateStyles = () => {
    switch (template) {
      case 'executive':
        return {
          headerBg: palette.secondary,
          headerText: '#FFFFFF',
          sectionRadius: '0.5rem',
          cardShadow: 'shadow-lg',
        }
      case 'simple':
        return {
          headerBg: palette.background,
          headerText: palette.text,
          sectionRadius: '0.25rem',
          cardShadow: 'shadow-sm',
        }
      default:
        return {
          headerBg: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
          headerText: '#FFFFFF',
          sectionRadius: '1rem',
          cardShadow: 'shadow-md',
        }
    }
  }

  const styles = getTemplateStyles()

  return (
    <div 
      className={cn('rounded-2xl overflow-hidden bg-white', className)}
      style={{ color: palette.text }}
    >
      {/* Header */}
      <div 
        className="p-8 md:p-12"
        style={{ 
          background: styles.headerBg,
          color: styles.headerText,
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            {data.company.logo && (
              <img 
                src={data.company.logo} 
                alt={data.company.name}
                className="h-12 w-auto object-contain mb-4"
              />
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {data.company.name || 'Sua Empresa'}
            </h1>
            <p className="opacity-80 text-lg">
              Proposta para {data.clientName || 'Cliente'}
            </p>
          </div>
          <div className="text-right text-sm opacity-80 space-y-1">
            {data.company.email && (
              <p className="flex items-center gap-2 justify-end">
                <Mail className="w-4 h-4" />
                {data.company.email}
              </p>
            )}
            {data.company.phone && (
              <p className="flex items-center gap-2 justify-end">
                <Phone className="w-4 h-4" />
                {data.company.phone}
              </p>
            )}
            {data.company.address && (
              <p className="flex items-center gap-2 justify-end">
                <MapPin className="w-4 h-4" />
                {data.company.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 md:p-12 space-y-10">
        {/* Description */}
        {data.description && (
          <section>
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: palette.secondary }}
            >
              Sobre o Projeto
            </h2>
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </section>
        )}

        {/* Custom Blocks */}
        {data.blocks.length > 0 && (
          <section className="space-y-6">
            {data.blocks.map((block) => {
              if (block.type === 'heading') {
                return (
                  <h3 
                    key={block.id}
                    className="text-2xl font-bold"
                    style={{ color: palette.secondary }}
                  >
                    {block.content}
                  </h3>
                )
              }
              if (block.type === 'image' && block.content) {
                return (
                  <img 
                    key={block.id}
                    src={block.content}
                    alt=""
                    className="rounded-xl w-full max-w-2xl mx-auto"
                  />
                )
              }
              if (block.type === 'divider') {
                return (
                  <hr 
                    key={block.id}
                    className="border-slate-200"
                  />
                )
              }
              return (
                <div 
                  key={block.id}
                  className="prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )
            })}
          </section>
        )}

        {/* Plans */}
        {data.paymentType === 'plans' && data.plans.length > 0 && (
          <section>
            <h2 
              className="text-xl font-semibold mb-6 text-center"
              style={{ color: palette.secondary }}
            >
              Planos Disponíveis
            </h2>
            <div className={cn(
              'gap-6',
              data.plans.length === 1 && 'flex justify-center',
              data.plans.length === 2 && 'grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto',
              data.plans.length >= 3 && 'grid grid-cols-1 md:grid-cols-3',
            )}>
              {data.plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={cn(
                    'relative rounded-2xl border-2 p-6 transition-all bg-white',
                    styles.cardShadow,
                    plan.highlighted 
                      ? 'border-current scale-105 z-10' 
                      : 'border-slate-200'
                  )}
                  style={plan.highlighted ? { borderColor: palette.primary } : undefined}
                >
                  {plan.highlighted && (
                    <div 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
                      style={{ backgroundColor: palette.primary }}
                    >
                      Recomendado
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2" style={{ color: palette.secondary }}>
                    {plan.name || 'Plano'}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                  <div className="mb-5">
                    <span className="text-4xl font-bold" style={{ color: palette.secondary }}>
                      R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {plan.priceType === 'monthly' && (
                      <span className="text-slate-500 text-sm">/mês</span>
                    )}
                  </div>
                  <ul className="space-y-3">
                    {plan.benefits.filter(b => b.trim()).map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${palette.primary}20` }}
                        >
                          <Check className="w-3 h-3" style={{ color: palette.primary }} />
                        </div>
                        <span style={{ color: palette.text }}>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full mt-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: plan.highlighted ? palette.primary : palette.secondary }}
                  >
                    Selecionar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Single Price */}
        {data.paymentType === 'single' && data.singlePrice > 0 && (
          <section className="text-center py-8">
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: palette.secondary }}
            >
              Investimento
            </h2>
            <div className="inline-flex flex-col items-center bg-slate-50 rounded-2xl px-12 py-8">
              <span className="text-5xl font-bold" style={{ color: palette.primary }}>
                R$ {data.singlePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-slate-500 mt-2">valor único</span>
            </div>
          </section>
        )}

        {/* Delivery */}
        <section className="flex items-center justify-center gap-3 py-6 border-t border-slate-100">
          <Calendar className="w-5 h-5" style={{ color: palette.primary }} />
          <span className="text-slate-600">
            {data.deliveryType === 'immediate' 
              ? 'Entrega imediata após confirmação'
              : `Entrega prevista: ${data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'A definir'}`
            }
          </span>
        </section>

        {/* Company Info Footer */}
        <footer className="pt-8 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Building2 className="w-4 h-4" />
            <span>{data.company.name}</span>
            {data.company.document && (
              <>
                <span className="mx-2">•</span>
                <span>{data.company.document}</span>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
