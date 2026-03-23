'use client'

import { Mail, Phone, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from './PlanCard'
import type {
  EmpresarialPage1,
  EmpresarialPage2,
  EmpresarialPage3,
  EmpresarialPage31,
  EmpresarialPage4,
  EmpresarialPage5,
} from '@/types/empresarialProposal'
import type {
  CleanPage1,
  CleanPage2,
  CleanPage3,
  CleanPage4,
  CleanPage5,
  CleanPromotionCta,
} from '@/types/cleanProposal'
import { ProposalEmpresarialLayout } from '@/components/proposals/ProposalEmpresarialLayout'
import { ProposalCleanLayout } from '@/components/proposals/ProposalCleanLayout'
import { ProposalCommerceSections } from '@/components/proposals/ProposalCommerceSections'

export interface ProposalData {
  template: 'modern' | 'executive' | 'simple' | 'empresarial'
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
  /** Template empresarial — página 1 (hero) e faixa inferior */
  empresarialPage1?: EmpresarialPage1
  /** Template empresarial — página 2 (trabalhos / cards) */
  empresarialPage2?: EmpresarialPage2
  empresarialPage3?: EmpresarialPage3
  empresarialPage31?: EmpresarialPage31
  empresarialPage4?: EmpresarialPage4
  empresarialPage5?: EmpresarialPage5
  /** Template Clean (`simple`) */
  cleanPage1?: CleanPage1
  cleanPage2?: CleanPage2
  cleanPage3?: CleanPage3
  cleanPage4?: CleanPage4
  cleanPage5?: CleanPage5
  /** Modelo Clean (divulgação): texto do botão + WhatsApp */
  cleanPromotionCta?: CleanPromotionCta
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
  /** Quando definido, o cliente pode selecionar um plano (página pública); botão Confirmar só aparece após seleção */
  selectedPlanId?: string | null
  onSelectPlan?: (planId: string) => void
  /** Página pública: abre fluxo com comentário + aceitar (não usa clique no card inteiro) */
  onOpenPlanAccept?: (planId: string) => void
}

export function ProposalPreview({
  data,
  className,
  selectedPlanId,
  onSelectPlan,
  onOpenPlanAccept,
}: ProposalPreviewProps) {
  const palette = { ...defaultPalette, ...data.colorPalette }
  const { template } = data

  if (template === 'empresarial') {
    return (
      <ProposalEmpresarialLayout
        data={data}
        className={cn(!className?.includes('rounded-none') && 'rounded-2xl', className)}
        selectedPlanId={selectedPlanId}
        onSelectPlan={onSelectPlan}
        onOpenPlanAccept={onOpenPlanAccept}
      />
    )
  }

  if (template === 'simple') {
    return (
      <ProposalCleanLayout
        data={data}
        className={cn(!className?.includes('rounded-none') && 'rounded-2xl', className)}
        selectedPlanId={selectedPlanId}
        onSelectPlan={onSelectPlan}
        onOpenPlanAccept={onOpenPlanAccept}
      />
    )
  }

  const getTemplateStyles = () => {
    switch (template) {
      case 'executive':
        return {
          headerBg: palette.secondary,
          headerText: '#FFFFFF',
          sectionRadius: '0.5rem',
          cardShadow: 'shadow-lg',
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
      className={cn(
        'overflow-hidden bg-white',
        !className?.includes('rounded-none') && 'rounded-2xl',
        className
      )}
      style={{ color: palette.text }}
    >
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
              <img src={data.company.logo} alt={data.company.name} className="h-36 w-auto object-contain mb-4" />
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{data.company.name || 'Sua Empresa'}</h1>
            <p className="opacity-80 text-lg">Proposta para {data.clientName || 'Cliente'}</p>
          </div>
          <div className="text-center text-sm opacity-80 space-y-1 flex flex-col items-center">
            {data.company.email && (
              <p className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                {data.company.email}
              </p>
            )}
            {data.company.phone && (
              <p className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                {data.company.phone}
              </p>
            )}
            {data.company.address && (
              <p className="flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                {data.company.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <ProposalCommerceSections
        data={data}
        styles={{ sectionRadius: styles.sectionRadius, cardShadow: styles.cardShadow }}
        selectedPlanId={selectedPlanId}
        onSelectPlan={onSelectPlan}
        onOpenPlanAccept={onOpenPlanAccept}
      />
    </div>
  )
}
