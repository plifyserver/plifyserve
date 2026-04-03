import type { EffectivePlan } from '@/lib/plan-entitlements'
import { hasUnlimitedQuotas } from '@/lib/plan-entitlements'

export type ProposalPresetDef = {
  id: string
  slug: string
  name: string
  description: string
  preview_image?: string
  /** Disponível para uso (não “em breve”) */
  released: boolean
  /** Se true, só Pro (e admin) */
  proOnly: boolean
}

/**
 * 4 modelos de proposta: Essential só o primeiro; Pro (e admin) acessa os quatro.
 */
export const PROPOSAL_PRESETS: ProposalPresetDef[] = [
  {
    id: 'default-1',
    slug: 'executive-bold',
    name: 'Executive Bold',
    description: 'Design corporativo com cards em perspectiva 3D e efeitos de profundidade',
    preview_image: '/images/template-executive-bold.png',
    released: true,
    proOnly: false,
  },
  {
    id: 'default-2',
    slug: 'modern-line',
    name: 'Modern Line',
    description: 'Layout limpo, tipografia forte e blocos modulares para propostas ágeis',
    preview_image: '/images/template-executive-bold.png',
    released: true,
    proOnly: true,
  },
  {
    id: 'default-3',
    slug: 'classic-pro',
    name: 'Classic Pro',
    description: 'Estilo clássico com hierarquia clara e foco em leitura',
    preview_image: '/images/template-executive-bold.png',
    released: true,
    proOnly: true,
  },
  {
    id: 'default-4',
    slug: 'studio-next',
    name: 'Studio Next',
    description: 'Layout editorial com foco em portfólio e storytelling visual',
    preview_image: '/images/template-executive-bold.png',
    released: true,
    proOnly: true,
  },
]

export function getPresetByIdOrSlug(key: string): ProposalPresetDef | undefined {
  return PROPOSAL_PRESETS.find((p) => p.id === key || p.slug === key)
}

/** Pode abrir o fluxo “novo” com esse id/slug? */
export function canUseProposalPreset(plan: EffectivePlan, presetKey: string): boolean {
  const preset = getPresetByIdOrSlug(presetKey)
  if (!preset || !preset.released) return false
  if (hasUnlimitedQuotas(plan)) return true
  if (preset.proOnly) return false
  return true
}

export function presetBadgeLabel(preset: ProposalPresetDef, plan: EffectivePlan): 'em-breve' | 'pro' | null {
  if (!preset.released) return 'em-breve'
  if (preset.proOnly && !hasUnlimitedQuotas(plan)) return 'pro'
  return null
}
