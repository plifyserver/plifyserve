'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  ChevronDown,
  Check,
  Copy,
  CheckCircle2,
  Building2,
  User,
  Layers,
  LayoutTemplate,
  Megaphone,
  MessageSquareQuote,
  Phone,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ImageUploader } from '@/components/proposals/ImageUploader'
import { RichTextEditor } from '@/components/proposals/RichTextEditor'
import { PlanList, type Plan } from '@/components/proposals/PlanCard'
import { ProposalPreview, type ProposalData, type ColorPalette } from '@/components/proposals/ProposalPreview'
import { LucideIconPickerDialog } from '@/components/proposals/LucideIconPickerDialog'
import { generateProposalSlug } from '@/lib/generateProposalSlug'
import {
  isValidLivePreviewSid,
  proposalLivePreviewChannelName,
  writeProposalLivePreviewBootstrap,
} from '@/lib/proposalLivePreview'
import type { TemplateType } from '@/components/proposals/TemplateSelector'
import {
  DEFAULT_EMPRESARIAL_PAGE1,
  DEFAULT_EMPRESARIAL_PAGE2,
  DEFAULT_EMPRESARIAL_PAGE3,
  DEFAULT_EMPRESARIAL_PAGE31,
  DEFAULT_EMPRESARIAL_PAGE4,
  DEFAULT_EMPRESARIAL_PAGE5,
  EMPRESARIAL_PAGE5_PLATFORMS,
  mergeEmpresarialPage1,
  mergeEmpresarialPage2,
  mergeEmpresarialPage3,
  mergeEmpresarialPage31,
  mergeEmpresarialPage4,
  mergeEmpresarialPage5,
  type EmpresarialPage1,
  type EmpresarialPage2,
  type EmpresarialPage2Card,
  type EmpresarialPage3,
  type EmpresarialPage31,
  type EmpresarialPage4,
  type EmpresarialPage4Quadrant,
  type EmpresarialPage5,
  type EmpresarialPage5SocialLink,
  type EmpresarialPage5Platform,
  type EmpresarialStatBlock,
  type EmpresarialTestimonial,
} from '@/types/empresarialProposal'
import {
  DEFAULT_CLEAN_PAGE1,
  DEFAULT_CLEAN_PAGE2,
  DEFAULT_CLEAN_PAGE3,
  DEFAULT_CLEAN_PAGE4,
  DEFAULT_CLEAN_PAGE5,
  DEFAULT_CLEAN_PROMOTION_CTA,
  cleanCarouselFromSix,
  cleanCarouselToSix,
  mergeCleanPage1,
  mergeCleanPage2,
  mergeCleanPage3,
  mergeCleanPage4,
  mergeCleanPage5,
  mergeCleanPromotionCta,
  type CleanPage1,
  type CleanPage2,
  type CleanPage3,
  type CleanPage4,
  type CleanPage4Column,
  type CleanPage5,
  type CleanPage5SocialLink,
  type CleanPromotionCta,
} from '@/types/cleanProposal'

type EmpresarialIconPickTarget = { kind: 'page1'; index: number } | { kind: 'page4'; index: number }
type ProposalStatus = 'draft' | 'published' | 'accepted'

const colorPalettes: { name: string; colors: ColorPalette }[] = [
  {
    name: 'Laranja (padrão)',
    colors: {
      primary: '#F59E0B',
      secondary: '#78350F',
      accent: '#EA580C',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Vermelho',
    colors: {
      primary: '#DC2626',
      secondary: '#7F1D1D',
      accent: '#F87171',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Azul',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E3A5F',
      accent: '#60A5FA',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Rosa',
    colors: {
      primary: '#EC4899',
      secondary: '#831843',
      accent: '#F472B6',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
]

function ProposalColorPalettePicker({
  selected,
  onSelect,
  hint,
}: {
  selected: ColorPalette
  onSelect: (colors: ColorPalette) => void
  hint?: string
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Paleta de cores</label>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {colorPalettes.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => onSelect(palette.colors)}
            className={cn(
              'rounded-xl border-2 p-4 text-left transition-all',
              JSON.stringify(selected) === JSON.stringify(palette.colors)
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            )}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex shrink-0 -space-x-1">
                <div
                  className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: palette.colors.primary }}
                />
                <div
                  className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: palette.colors.secondary }}
                />
                <div
                  className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: palette.colors.accent }}
                />
              </div>
              {JSON.stringify(selected) === JSON.stringify(palette.colors) ? (
                <Check className="ml-auto h-4 w-4 shrink-0 text-indigo-600" />
              ) : null}
            </div>
            <p className="text-sm font-medium text-slate-900">{palette.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function PlansPaymentEditor({
  plans,
  accentColor,
  onPlansChange,
}: {
  plans: Plan[]
  accentColor: string
  onPlansChange: (next: Plan[]) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">VALORES</label>
        <p className="mt-1 text-xs text-slate-500">
          Cadastre um ou mais valores. Com apenas um cartão, na proposta o cliente vê uma única opção.
        </p>
      </div>
      <PlanList plans={plans} onChange={onPlansChange} accentColor={accentColor} />
    </div>
  )
}

const PROPOSTA_BASE_SECTIONS = [
  { id: 'client', label: 'Cliente', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'planos', label: 'Planos', icon: Megaphone },
] as const

const getDefaultProposalData = (template: TemplateType): ProposalData => ({
  template: template || 'empresarial',
  clientName: '',
  company: {
    name: '',
    document: '',
    logo: null,
    address: '',
    email: '',
    phone: '',
  },
  paymentType: 'plans',
  plans:
    template === 'simple'
      ? []
      : [
          {
            id: 'plan-1',
            name: 'Básico',
            description: 'Ideal para começar',
            benefits: ['Benefício 1', 'Benefício 2'],
            price: 997,
            priceType: 'unique',
            image: null,
          },
        ],
  singlePrice: 0,
  deliveryType: 'immediate',
  deliveryDate: '',
  description: '',
  blocks: [],
  colorPalette: colorPalettes[0].colors,
  empresarialPage1:
    template === 'empresarial'
      ? {
          ...DEFAULT_EMPRESARIAL_PAGE1,
          bottomRow: DEFAULT_EMPRESARIAL_PAGE1.bottomRow.map((b) => ({ ...b })),
        }
      : undefined,
  empresarialPage2:
    template === 'empresarial'
      ? {
          ...DEFAULT_EMPRESARIAL_PAGE2,
          cards: DEFAULT_EMPRESARIAL_PAGE2.cards.map((c) => ({ ...c })),
        }
      : undefined,
  empresarialPage3: template === 'empresarial' ? { ...DEFAULT_EMPRESARIAL_PAGE3 } : undefined,
  empresarialPage31:
    template === 'empresarial'
      ? {
          ...DEFAULT_EMPRESARIAL_PAGE31,
          stats: DEFAULT_EMPRESARIAL_PAGE31.stats.map((s) => ({ ...s })),
          testimonials: DEFAULT_EMPRESARIAL_PAGE31.testimonials.map((t) => ({ ...t })),
        }
      : undefined,
  empresarialPage4:
    template === 'empresarial'
      ? {
          ...DEFAULT_EMPRESARIAL_PAGE4,
          quadrants: DEFAULT_EMPRESARIAL_PAGE4.quadrants.map((q) => ({ ...q })),
          marqueePhrases: [...DEFAULT_EMPRESARIAL_PAGE4.marqueePhrases],
        }
      : undefined,
  empresarialPage5: template === 'empresarial' ? { ...DEFAULT_EMPRESARIAL_PAGE5, socialLinks: [] } : undefined,
  cleanPage1:
    template === 'simple'
      ? {
          ...DEFAULT_CLEAN_PAGE1,
          meta: DEFAULT_CLEAN_PAGE1.meta.map((m) => ({ ...m })),
        }
      : undefined,
  cleanPage2: template === 'simple' ? { ...DEFAULT_CLEAN_PAGE2 } : undefined,
  cleanPage3:
    template === 'simple'
      ? {
          ...DEFAULT_CLEAN_PAGE3,
          keywords: [...DEFAULT_CLEAN_PAGE3.keywords] as [string, string, string],
          carouselImages: [],
        }
      : undefined,
  cleanPage4:
    template === 'simple'
      ? {
          ...DEFAULT_CLEAN_PAGE4,
          columns: DEFAULT_CLEAN_PAGE4.columns.map((c) => ({ ...c })) as [
            CleanPage4Column,
            CleanPage4Column,
            CleanPage4Column,
          ],
        }
      : undefined,
  cleanPage5:
    template === 'simple'
      ? { ...DEFAULT_CLEAN_PAGE5, socialLinks: [] }
      : undefined,
  cleanPromotionCta: template === 'simple' ? { ...DEFAULT_CLEAN_PROMOTION_CTA } : undefined,
})

export function NovaPropostaEditor({
  shell = 'dashboard',
}: {
  shell?: 'dashboard' | 'studio'
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateParam = searchParams.get('template') as TemplateType | null
  const editId = searchParams.get('id')
  const livePreviewParam = searchParams.get('livePreview')
  const livePreviewFromUrl = isValidLivePreviewSid(livePreviewParam) ? livePreviewParam : null
  const [livePreviewSidExtra, setLivePreviewSidExtra] = useState<string | null>(null)
  const effectiveLivePreviewSid = livePreviewFromUrl ?? livePreviewSidExtra
  const livePreviewChannelRef = useRef<BroadcastChannel | null>(null)

  const [activeSection, setActiveSection] = useState('client')
  const [showPreview, setShowPreview] = useState(true)
  const [status, setStatus] = useState<ProposalStatus>('draft')
  const [isSaving, setIsSaving] = useState(false)
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null)
  const [savedPublicSlug, setSavedPublicSlug] = useState<string | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishedLink, setPublishedLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(!!editId)

  const [proposalData, setProposalData] = useState<ProposalData>(() =>
    getDefaultProposalData(templateParam || 'empresarial')
  )
  const [iconPickTarget, setIconPickTarget] = useState<EmpresarialIconPickTarget | null>(null)

  const sections = useMemo(() => {
    if (proposalData.template === 'empresarial') {
      return [
        ...PROPOSTA_BASE_SECTIONS.slice(0, 1),
        { id: 'empresarial' as const, label: 'Hero · Pág. 1', icon: LayoutTemplate },
        { id: 'empresarial2' as const, label: 'Trabalhos · Pág. 2', icon: Layers },
        { id: 'empresarial3' as const, label: 'Planos · Pág. 3', icon: Megaphone },
        { id: 'empresarial31' as const, label: 'Depoimentos · 3.1', icon: MessageSquareQuote },
        { id: 'empresarial4' as const, label: 'Sobre nós · Pág. 4', icon: Building2 },
        { id: 'empresarial5' as const, label: 'Contato · Pág. 5', icon: Phone },
        ...PROPOSTA_BASE_SECTIONS.slice(3),
      ]
    }
    if (proposalData.template === 'simple') {
      return [
        ...PROPOSTA_BASE_SECTIONS.slice(0, 2),
        {
          id: 'clean1' as const,
          label: 'Capa · logo, título e destaques',
          icon: LayoutTemplate,
        },
        {
          id: 'clean2' as const,
          label: 'Imagem de impacto · tela cheia',
          icon: Layers,
        },
        {
          id: 'clean3' as const,
          label: 'Apresentação · texto e carrossel',
          icon: Megaphone,
        },
        {
          id: 'clean4' as const,
          label: 'Conteúdo · blocos com imagens',
          icon: Building2,
        },
        {
          id: 'clean5' as const,
          label: 'Rodapé · contato e redes',
          icon: Phone,
        },
        {
          id: 'cleanCta' as const,
          label: 'Botão flutuante · WhatsApp',
          icon: MessageCircle,
        },
      ]
    }
    return [...PROPOSTA_BASE_SECTIONS]
  }, [proposalData.template])

  const patchEmpresarial = useCallback((patch: Partial<EmpresarialPage1>) => {
    setProposalData((prev) => {
      const cur = mergeEmpresarialPage1(prev.empresarialPage1)
      return { ...prev, empresarialPage1: { ...cur, ...patch } }
    })
  }, [])

  const patchEmpresarialPage2 = useCallback((patch: Partial<EmpresarialPage2>) => {
    setProposalData((prev) => {
      const cur = mergeEmpresarialPage2(prev.empresarialPage2)
      return { ...prev, empresarialPage2: { ...cur, ...patch } }
    })
  }, [])

  const patchEmpresarialPage3 = useCallback((patch: Partial<EmpresarialPage3>) => {
    setProposalData((prev) => {
      const cur = mergeEmpresarialPage3(prev.empresarialPage3)
      return { ...prev, empresarialPage3: { ...cur, ...patch } }
    })
  }, [])

  const patchEmpresarialPage31 = useCallback((patch: Partial<EmpresarialPage31>) => {
    setProposalData((prev) => {
      const cur = mergeEmpresarialPage31(prev.empresarialPage31)
      return { ...prev, empresarialPage31: { ...cur, ...patch } }
    })
  }, [])

  const patchEmpresarialPage4 = useCallback((patch: Partial<EmpresarialPage4>) => {
    setProposalData((prev) => {
      const cur = mergeEmpresarialPage4(prev.empresarialPage4)
      return { ...prev, empresarialPage4: { ...cur, ...patch } }
    })
  }, [])

  const patchEmpresarialPage5 = useCallback((patch: Partial<EmpresarialPage5>) => {
    setProposalData((prev) => {
      const cur = mergeEmpresarialPage5(prev.empresarialPage5)
      return { ...prev, empresarialPage5: { ...cur, ...patch } }
    })
  }, [])

  const patchCleanPage1 = useCallback((patch: Partial<CleanPage1>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage1(prev.cleanPage1)
      return { ...prev, cleanPage1: { ...cur, ...patch } }
    })
  }, [])

  const patchCleanMeta = useCallback((index: number, field: 'label' | 'value', value: string) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage1(prev.cleanPage1)
      const meta = cur.meta.map((m, i) => (i === index ? { ...m, [field]: value } : m))
      return { ...prev, cleanPage1: { ...cur, meta } }
    })
  }, [])

  const patchCleanPage2 = useCallback((patch: Partial<CleanPage2>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage2(prev.cleanPage2)
      return { ...prev, cleanPage2: { ...cur, ...patch } }
    })
  }, [])

  const patchCleanPage3 = useCallback((patch: Partial<CleanPage3>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage3(prev.cleanPage3)
      return { ...prev, cleanPage3: mergeCleanPage3({ ...cur, ...patch }) }
    })
  }, [])

  const patchCleanPage4 = useCallback((patch: Partial<CleanPage4>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage4(prev.cleanPage4)
      return { ...prev, cleanPage4: mergeCleanPage4({ ...cur, ...patch }) }
    })
  }, [])

  const patchCleanPage4Column = useCallback((index: 0 | 1 | 2, patch: Partial<CleanPage4Column>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage4(prev.cleanPage4)
      const cols = [...cur.columns] as [CleanPage4Column, CleanPage4Column, CleanPage4Column]
      cols[index] = { ...cols[index], ...patch }
      return { ...prev, cleanPage4: mergeCleanPage4({ ...cur, columns: cols }) }
    })
  }, [])

  const patchCleanPage5 = useCallback((patch: Partial<CleanPage5>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPage5(prev.cleanPage5)
      return { ...prev, cleanPage5: mergeCleanPage5({ ...cur, ...patch }) }
    })
  }, [])

  const patchCleanPromotionCta = useCallback((patch: Partial<CleanPromotionCta>) => {
    setProposalData((prev) => {
      const cur = mergeCleanPromotionCta(prev.cleanPromotionCta)
      return { ...prev, cleanPromotionCta: mergeCleanPromotionCta({ ...cur, ...patch }) }
    })
  }, [])

  useEffect(() => {
    if (!effectiveLivePreviewSid || typeof BroadcastChannel === 'undefined') {
      livePreviewChannelRef.current?.close()
      livePreviewChannelRef.current = null
      return
    }
    livePreviewChannelRef.current?.close()
    const ch = new BroadcastChannel(proposalLivePreviewChannelName(effectiveLivePreviewSid))
    livePreviewChannelRef.current = ch
    return () => {
      ch.close()
      if (livePreviewChannelRef.current === ch) livePreviewChannelRef.current = null
    }
  }, [effectiveLivePreviewSid])

  useEffect(() => {
    const ch = livePreviewChannelRef.current
    if (!ch || !effectiveLivePreviewSid) return
    let cancelled = false
    const send = () => {
      if (cancelled) return
      try {
        ch.postMessage({
          type: 'data',
          payload: JSON.parse(JSON.stringify(proposalData)),
        })
      } catch {
        // ignore
      }
    }
    const id = requestAnimationFrame(send)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [proposalData, effectiveLivePreviewSid])

  const openClientLivePreview = useCallback(() => {
    const sid = effectiveLivePreviewSid ?? crypto.randomUUID()
    // Snapshot síncrono: BroadcastChannel não fila — a nova aba pode subscrever depois do 1.º postMessage.
    writeProposalLivePreviewBootstrap(sid, proposalData)
    if (!effectiveLivePreviewSid) {
      setLivePreviewSidExtra(sid)
    }
    window.open(
      `/proposta/live-preview?sid=${encodeURIComponent(sid)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }, [effectiveLivePreviewSid, proposalData])

  // Carregar proposta existente para edição (incluindo cópias)
  useEffect(() => {
    if (!editId) {
      setLoadingEdit(false)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/proposals/${editId}`, { credentials: 'include' })
        if (!res.ok || cancelled) return
        const p = (await res.json()) as {
          id?: string
          client_name?: string | null
          client_email?: string | null
          content?: {
            company?: ProposalData['company']
            description?: string
            plans?: ProposalData['plans']
            delivery?: { type?: string; date?: string }
            blocks?: ProposalData['blocks']
            colorPalette?: ProposalData['colorPalette']
            template?: TemplateType
            empresarialPage1?: unknown
            empresarialPage2?: unknown
            empresarialPage3?: unknown
            empresarialPage31?: unknown
            empresarialPage4?: unknown
            empresarialPage5?: unknown
            cleanPage1?: unknown
            cleanPage2?: unknown
            cleanPage3?: unknown
            cleanPage4?: unknown
            cleanPage5?: unknown
            cleanPromotionCta?: unknown
            paymentType?: ProposalData['paymentType']
            singlePrice?: number
          }
          public_slug?: string | null
        }
        if (cancelled) return
        setSavedProposalId(p.id ?? null)
        setSavedPublicSlug(p.public_slug ?? null)
        const c = p.content ?? {}
        const company = c.company ?? getDefaultProposalData('empresarial').company
        const delivery = c.delivery ?? { type: 'immediate', date: '' }
        const rawPaymentType = (c.paymentType as ProposalData['paymentType']) || 'plans'
        const rawSingle = typeof c.singlePrice === 'number' ? c.singlePrice : 0
        let plans: ProposalData['plans'] =
          Array.isArray(c.plans) && c.plans.length > 0 ? c.plans : getDefaultProposalData('empresarial').plans
        let paymentType: ProposalData['paymentType'] = rawPaymentType
        let singlePrice = rawSingle
        if (rawPaymentType === 'single' && rawSingle > 0 && (!Array.isArray(c.plans) || c.plans.length === 0)) {
          plans = [
            {
              id: `valor-unico-${Date.now()}`,
              name: 'VALOR DO PROJETO',
              description: '',
              benefits: [],
              price: rawSingle,
              priceType: 'unique',
              image: null,
            },
          ]
          paymentType = 'plans'
          singlePrice = 0
        } else if (rawPaymentType === 'single' && Array.isArray(c.plans) && c.plans.length > 0) {
          paymentType = 'plans'
          singlePrice = 0
        }
        setProposalData({
          template: (c.template as TemplateType) || templateParam || 'empresarial',
          clientName: p.client_name ?? '',
          company: {
            name: company.name ?? '',
            document: company.document ?? '',
            logo: company.logo ?? null,
            address: company.address ?? '',
            email: company.email ?? p.client_email ?? '',
            phone: company.phone ?? '',
          },
          paymentType,
          plans,
          singlePrice,
          deliveryType: (delivery.type as 'immediate' | 'scheduled') || 'immediate',
          deliveryDate: delivery.date ?? '',
          description: c.description ?? '',
          blocks: Array.isArray(c.blocks) ? c.blocks : [],
          colorPalette: c.colorPalette && typeof c.colorPalette === 'object' ? c.colorPalette : colorPalettes[0].colors,
          empresarialPage1:
            c.template === 'empresarial'
              ? mergeEmpresarialPage1(c.empresarialPage1)
              : undefined,
          empresarialPage2:
            c.template === 'empresarial'
              ? mergeEmpresarialPage2(c.empresarialPage2)
              : undefined,
          empresarialPage3:
            c.template === 'empresarial'
              ? mergeEmpresarialPage3(c.empresarialPage3)
              : undefined,
          empresarialPage31:
            c.template === 'empresarial'
              ? mergeEmpresarialPage31(c.empresarialPage31)
              : undefined,
          empresarialPage4:
            c.template === 'empresarial' ? mergeEmpresarialPage4(c.empresarialPage4) : undefined,
          empresarialPage5:
            c.template === 'empresarial' ? mergeEmpresarialPage5(c.empresarialPage5) : undefined,
          cleanPage1: c.template === 'simple' ? mergeCleanPage1(c.cleanPage1) : undefined,
          cleanPage2: c.template === 'simple' ? mergeCleanPage2(c.cleanPage2) : undefined,
          cleanPage3: c.template === 'simple' ? mergeCleanPage3(c.cleanPage3) : undefined,
          cleanPage4: c.template === 'simple' ? mergeCleanPage4(c.cleanPage4) : undefined,
          cleanPage5: c.template === 'simple' ? mergeCleanPage5(c.cleanPage5) : undefined,
          cleanPromotionCta: c.template === 'simple' ? mergeCleanPromotionCta(c.cleanPromotionCta) : undefined,
        })
      } finally {
        if (!cancelled) setLoadingEdit(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [editId, templateParam])

  useEffect(() => {
    if (
      proposalData.template !== 'empresarial' &&
      (activeSection === 'empresarial' ||
        activeSection === 'empresarial2' ||
        activeSection === 'empresarial3' ||
        activeSection === 'empresarial31' ||
        activeSection === 'empresarial4' ||
        activeSection === 'empresarial5')
    ) {
      setActiveSection('client')
    }
    if (
      proposalData.template !== 'simple' &&
      (activeSection === 'clean1' ||
        activeSection === 'clean2' ||
        activeSection === 'clean3' ||
        activeSection === 'clean4' ||
        activeSection === 'clean5' ||
        activeSection === 'cleanCta')
    ) {
      setActiveSection('client')
    }
    if (proposalData.template === 'empresarial' && activeSection === 'company') {
      setActiveSection('empresarial')
    }
    if (activeSection === 'style') {
      setActiveSection(
        proposalData.template === 'empresarial'
          ? 'empresarial'
          : proposalData.template === 'simple'
            ? 'clean1'
            : 'planos'
      )
    }
    if (activeSection === 'delivery' || activeSection === 'content') {
      setActiveSection(
        proposalData.template === 'empresarial'
          ? 'empresarial'
          : proposalData.template === 'simple'
            ? 'clean1'
            : 'planos'
      )
    }
    if (activeSection === 'payment') {
      setActiveSection(
        proposalData.template === 'empresarial'
          ? 'empresarial3'
          : proposalData.template === 'simple'
            ? 'cleanCta'
            : 'planos'
      )
    }
    if (activeSection === 'blocks') {
      setActiveSection(
        proposalData.template === 'empresarial'
          ? 'empresarial'
          : proposalData.template === 'simple'
            ? 'clean1'
            : 'planos'
      )
    }
  }, [proposalData.template, activeSection])

  const updateField = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    setProposalData((prev) => ({ ...prev, [field]: value }))
  }

  const updateCompany = <K extends keyof ProposalData['company']>(
    field: K, 
    value: ProposalData['company'][K]
  ) => {
    setProposalData((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }))
  }

  const buildPayload = () => ({
    title: `Proposta para ${proposalData.clientName || 'Cliente'}`,
    client_name: proposalData.clientName || null,
    client_email: proposalData.company.email || null,
    content: {
      company: proposalData.company,
      description: proposalData.description,
      plans: proposalData.plans,
      delivery: { type: proposalData.deliveryType, date: proposalData.deliveryDate },
      blocks: proposalData.blocks,
      colorPalette: proposalData.colorPalette,
      template: proposalData.template,
      paymentType: proposalData.paymentType,
      singlePrice: proposalData.singlePrice,
      ...(proposalData.template === 'empresarial' && proposalData.empresarialPage1
        ? { empresarialPage1: proposalData.empresarialPage1 }
        : {}),
      ...(proposalData.template === 'empresarial' && proposalData.empresarialPage2
        ? { empresarialPage2: proposalData.empresarialPage2 }
        : {}),
      ...(proposalData.template === 'empresarial' && proposalData.empresarialPage3
        ? { empresarialPage3: proposalData.empresarialPage3 }
        : {}),
      ...(proposalData.template === 'empresarial' && proposalData.empresarialPage31
        ? { empresarialPage31: proposalData.empresarialPage31 }
        : {}),
      ...(proposalData.template === 'empresarial' && proposalData.empresarialPage4
        ? { empresarialPage4: proposalData.empresarialPage4 }
        : {}),
      ...(proposalData.template === 'empresarial' && proposalData.empresarialPage5
        ? { empresarialPage5: proposalData.empresarialPage5 }
        : {}),
      ...(proposalData.template === 'simple' && proposalData.cleanPage1
        ? { cleanPage1: proposalData.cleanPage1 }
        : {}),
      ...(proposalData.template === 'simple' && proposalData.cleanPage2
        ? { cleanPage2: proposalData.cleanPage2 }
        : {}),
      ...(proposalData.template === 'simple' && proposalData.cleanPage3
        ? { cleanPage3: proposalData.cleanPage3 }
        : {}),
      ...(proposalData.template === 'simple' && proposalData.cleanPage4
        ? { cleanPage4: proposalData.cleanPage4 }
        : {}),
      ...(proposalData.template === 'simple' && proposalData.cleanPage5
        ? { cleanPage5: proposalData.cleanPage5 }
        : {}),
      ...(proposalData.template === 'simple' && proposalData.cleanPromotionCta
        ? { cleanPromotionCta: mergeCleanPromotionCta(proposalData.cleanPromotionCta) }
        : {}),
    },
  })

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      const payload = buildPayload()
      if (savedProposalId) {
        const res = await fetch(`/api/proposals/${savedProposalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payload, status: 'draft' }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || 'Falha ao salvar')
        }
        setStatus('draft')
        toast.success('Proposta salva em rascunho.')
      } else {
        const res = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payload, status: 'draft' }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || 'Falha ao salvar')
        }
        const data = (await res.json()) as { id?: string; public_slug?: string }
        if (data.id) setSavedProposalId(data.id)
        if (data.public_slug) setSavedPublicSlug(data.public_slug)
        setStatus('draft')
        toast.success('Proposta salva em rascunho.')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar rascunho.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!proposalData.clientName.trim()) {
      toast.error('Por favor, preencha o nome do cliente.')
      setActiveSection('client')
      return
    }
    if (!proposalData.company.name.trim()) {
      toast.error('Por favor, preencha o nome da empresa.')
      setActiveSection(proposalData.template === 'empresarial' ? 'empresarial' : 'company')
      return
    }
    if (proposalData.template === 'simple') {
      const c3 = mergeCleanPage3(proposalData.cleanPage3)
      if (c3.carouselImages.length < 3) {
        toast.error('Na página 3 (Clean), adicione pelo menos 3 imagens no carrossel.')
        setActiveSection('clean3')
        return
      }
    }

    setIsSaving(true)
    try {
      const payload = buildPayload()
      let publicSlug = savedPublicSlug

      if (savedProposalId) {
        // Ao publicar proposta editada (ex.: cópia), gera novo link para o cliente atual
        const newSlug = generateProposalSlug(payload.title, proposalData.clientName || 'cliente')
        const res = await fetch(`/api/proposals/${savedProposalId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payload, status: 'sent', public_slug: newSlug }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || 'Falha ao publicar')
        }
        publicSlug = newSlug
        setSavedPublicSlug(newSlug)
      } else {
        const res = await fetch('/api/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...payload, status: 'sent' }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error((err as { error?: string }).error || 'Falha ao publicar')
        }
        const data = (await res.json()) as { id?: string; public_slug?: string }
        if (data.id) setSavedProposalId(data.id)
        if (data.public_slug) {
          publicSlug = data.public_slug
          setSavedPublicSlug(data.public_slug)
        }
      }

      if (!publicSlug) {
        toast.error('Proposta salva, mas o link não pôde ser gerado.')
        return
      }

      setStatus('published')
      const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${publicSlug}`
      setPublishedLink(link)
      setShowPublishModal(true)
      setLinkCopied(false)
      toast.success('Proposta publicada!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao publicar.')
    } finally {
      setIsSaving(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publishedLink)
      setLinkCopied(true)
      toast.success('Link copiado!')
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'client':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Dados do Cliente</h3>
              <p className="text-sm text-slate-500">Informe os dados do cliente para a proposta</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do cliente *
              </label>
              <Input
                value={proposalData.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="Nome completo ou empresa do cliente"
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>
        )

      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Dados da Empresa</h3>
              <p className="text-sm text-slate-500">Informações que aparecerão na proposta</p>
            </div>

            <ImageUploader
              label="Logo da empresa"
              value={proposalData.company.logo || undefined}
              onChange={(url) => updateCompany('logo', url)}
              aspectRatio="video"
            />

            {/* Identificação: mesma largura para os dois campos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da empresa *
                </label>
                <Input
                  value={proposalData.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  placeholder="Sua Empresa Ltda"
                  className="w-full rounded-xl border-slate-200"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CNPJ ou CPF
                </label>
                <Input
                  value={proposalData.company.document}
                  onChange={(e) => updateCompany('document', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endereço
              </label>
              <Input
                value={proposalData.company.address}
                onChange={(e) => updateCompany('address', e.target.value)}
                placeholder="Rua, número, bairro - Cidade/UF"
                className="w-full rounded-xl border-slate-200"
              />
            </div>

            {/* Contato: mesma largura para email e telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={proposalData.company.email}
                  onChange={(e) => updateCompany('email', e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full rounded-xl border-slate-200"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefone
                </label>
                <Input
                  value={proposalData.company.phone}
                  onChange={(e) => updateCompany('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        )

      case 'clean1': {
        const c1 = mergeCleanPage1(proposalData.cleanPage1)
        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Capa · logo, título e destaques</h3>
              <p className="text-sm text-slate-500">
                Inspirado no portfolio Agntix: logo, palavras-chave, nome em destaque e quatro campos de metadados. Sem
                menu central; o botão à direita leva à secção de contato.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <h4 className="text-sm font-semibold text-slate-800">Logo no topo</h4>
              <p className="text-xs text-slate-500">
                Se não enviar logo aqui, usamos o logo da secção Empresa (quando existir).
              </p>
              <ImageUploader
                label="Logo da capa (opcional)"
                value={c1.logoUrl || undefined}
                onChange={(url) => patchCleanPage1({ logoUrl: url || null })}
                aspectRatio="video"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Palavra-chave 1</label>
                <Input
                  value={c1.keyword1}
                  onChange={(e) => patchCleanPage1({ keyword1: e.target.value })}
                  placeholder="Website"
                  className="rounded-xl border-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">Exibido como etiqueta com ponto vermelho (* automático).</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Palavra-chave 2</label>
                <Input
                  value={c1.keyword2}
                  onChange={(e) => patchCleanPage1({ keyword2: e.target.value })}
                  placeholder="Services"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Nome em destaque (capa)</label>
              <Input
                value={c1.headline}
                onChange={(e) => patchCleanPage1({ headline: e.target.value })}
                placeholder="Nome da empresa ou projeto"
                className="rounded-xl border-slate-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Se ficar vazio, usamos o nome da empresa da secção Empresa.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Texto do botão (canto direito)</label>
              <Input
                value={c1.contactButtonLabel}
                onChange={(e) => patchCleanPage1({ contactButtonLabel: e.target.value })}
                placeholder="CONTATO"
                className="max-w-xs rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800">Quatro campos (rótulo + valor)</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {c1.meta.map((m, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                    <p className="text-xs font-medium text-slate-500">Campo {i + 1}</p>
                    <Input
                      value={m.label}
                      onChange={(e) => patchCleanMeta(i, 'label', e.target.value)}
                      placeholder="Rótulo"
                      className="rounded-lg border-slate-200 text-sm"
                    />
                    <Input
                      value={m.value}
                      onChange={(e) => patchCleanMeta(i, 'value', e.target.value)}
                      placeholder="Valor"
                      className="rounded-lg border-slate-200 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      case 'clean2': {
        const c2 = mergeCleanPage2(proposalData.cleanPage2)
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Imagem de impacto (tela cheia)</h3>
              <p className="text-sm text-slate-500">
                A imagem encaixa no ecrã sem ser esticada: ficheiros grandes reduzem com nitidez; imagens pequenas
                mantêm o tamanho natural (sem ampliação forçada). Parallax suave e desfoque leve ao fazer scroll.
              </p>
            </div>
            <ImageUploader
              label="Imagem da página 2"
              value={c2.imageUrl || undefined}
              onChange={(url) => patchCleanPage2({ imageUrl: url || null })}
              aspectRatio="video"
            />
          </div>
        )
      }

      case 'clean3': {
        const c3 = mergeCleanPage3(proposalData.cleanPage3)
        const six = cleanCarouselToSix(c3.carouselImages)
        const setCarouselSlot = (index: number, url: string | undefined) => {
          const nextSix = [...six]
          nextSix[index] = url
          patchCleanPage3({ carouselImages: cleanCarouselFromSix(nextSix) })
        }
        const patchKeyword = (index: 0 | 1 | 2, value: string) => {
          const next: [string, string, string] = [...c3.keywords]
          next[index] = value
          patchCleanPage3({ keywords: next })
        }
        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Apresentação · texto e carrossel</h3>
              <p className="text-sm text-slate-500">
                Título ao estilo &quot;Brand overview&quot; (ex.: Nossos Serviços), resumo dos serviços, três
                palavras-chave e carrossel de 3 a 6 fotos (troca automática a cada 4 segundos).
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Título da secção</label>
              <Input
                value={c3.sectionTitle}
                onChange={(e) => patchCleanPage3({ sectionTitle: e.target.value })}
                placeholder="Ex.: Nossos Serviços"
                className="rounded-xl border-slate-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Resumo</label>
              <Textarea
                value={c3.summary}
                onChange={(e) => patchCleanPage3({ summary: e.target.value })}
                rows={8}
                className="rounded-xl border-slate-200"
                placeholder="Breve texto sobre os serviços ou produtos..."
              />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Três palavras-chave</h4>
              <p className="text-xs text-slate-500">Aparecem como etiquetas com ponto vermelho (sem asterisco).</p>
              {([0, 1, 2] as const).map((i) => (
                <Input
                  key={i}
                  value={c3.keywords[i]}
                  onChange={(e) => patchKeyword(i, e.target.value)}
                  placeholder={`Palavra-chave ${i + 1}`}
                  className="rounded-xl border-slate-200"
                />
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800">Carrossel</h4>
              <p className="text-xs text-slate-500">
                Preencha pelo menos as 3 primeiras imagens para publicar. Até 6 imagens no total; na proposta mostram-se 3
                de cada vez, em rotação.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {six.map((url, i) => (
                  <ImageUploader
                    key={i}
                    label={`Imagem ${i + 1}${i < 3 ? ' *' : ''}`}
                    value={url}
                    onChange={(u) => setCarouselSlot(i, u || undefined)}
                    aspectRatio="video"
                  />
                ))}
              </div>
            </div>
          </div>
        )
      }

      case 'clean4': {
        const c4 = mergeCleanPage4(proposalData.cleanPage4)
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Conteúdo · blocos com imagens</h3>
              <p className="mt-1 text-sm text-slate-500">
                Título introdutório, três passos (número, título e texto) e galeria: uma imagem larga e duas quadradas
                abaixo, com animação ao scroll na pré-visualização.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Título / frase principal</label>
              <Textarea
                value={c4.introHeadline}
                onChange={(e) => patchCleanPage4({ introHeadline: e.target.value })}
                rows={4}
                className="rounded-xl border-slate-200"
                placeholder="Resumo breve de como o produto ou serviço funciona..."
              />
            </div>
            <div className="space-y-6">
              <h4 className="text-sm font-semibold text-slate-800">Três colunas (passos)</h4>
              {([0, 1, 2] as const).map((i) => (
                <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-xs font-medium text-slate-600">Coluna {i + 1}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Número / prefixo</label>
                      <Input
                        value={c4.columns[i].prefix}
                        onChange={(e) => patchCleanPage4Column(i, { prefix: e.target.value })}
                        placeholder="01"
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
                      <Input
                        value={c4.columns[i].title}
                        onChange={(e) => patchCleanPage4Column(i, { title: e.target.value })}
                        className="rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Descrição</label>
                    <Textarea
                      value={c4.columns[i].description}
                      onChange={(e) => patchCleanPage4Column(i, { description: e.target.value })}
                      rows={3}
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-800">Imagens</h4>
              <ImageUploader
                label="Imagem grande (topo)"
                value={c4.largeImageUrl ?? undefined}
                onChange={(u) => patchCleanPage4({ largeImageUrl: u })}
                aspectRatio="video"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploader
                  label="Imagem pequena (esquerda)"
                  value={c4.bottomLeftImageUrl ?? undefined}
                  onChange={(u) => patchCleanPage4({ bottomLeftImageUrl: u })}
                  aspectRatio="square"
                />
                <ImageUploader
                  label="Imagem pequena (direita)"
                  value={c4.bottomRightImageUrl ?? undefined}
                  onChange={(u) => patchCleanPage4({ bottomRightImageUrl: u })}
                  aspectRatio="square"
                />
              </div>
            </div>
          </div>
        )
      }

      case 'clean5': {
        const c5 = mergeCleanPage5(proposalData.cleanPage5)
        const setClean5Social = (socialLinks: CleanPage5SocialLink[]) =>
          patchCleanPage5({ socialLinks: socialLinks.slice(0, 12) })

        const clean5PlatformLabels: Record<EmpresarialPage5Platform, string> = {
          instagram: 'Instagram',
          x: 'X (Twitter)',
          facebook: 'Facebook',
          linkedin: 'LinkedIn',
          youtube: 'YouTube',
          tiktok: 'TikTok',
          github: 'GitHub',
          behance: 'Behance',
          dribbble: 'Dribbble',
          website: 'Site / outro link',
        }

        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Rodapé · contato e redes</h3>
              <p className="mt-1 text-sm text-slate-500">
                Frase forte à esquerda, ícones de redes (opcional) e bloco <strong>Contato</strong> com e-mail, telefone e
                morada da secção <strong>Empresa</strong>. O nome gigante no fundo é o nome da empresa, automaticamente.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Frase / headline</label>
              <Textarea
                value={c5.headline}
                onChange={(e) => patchCleanPage5({ headline: e.target.value })}
                rows={5}
                className="rounded-xl border-slate-200"
                placeholder="Ex.: Ajudamos o seu negócio a crescer..."
              />
              <p className="mt-1 text-xs text-slate-500">Use Enter para quebrar linhas no rodapé.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">Redes sociais (máx. 12)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={c5.socialLinks.length >= 12}
                  onClick={() =>
                    setClean5Social([
                      ...c5.socialLinks,
                      {
                        id: `clean-soc-${Date.now()}`,
                        platform: 'instagram',
                        url: '',
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar rede
                </Button>
              </div>
              {c5.socialLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Rede</label>
                    <select
                      value={link.platform}
                      onChange={(e) => {
                        const next = [...c5.socialLinks]
                        next[index] = { ...next[index], platform: e.target.value as EmpresarialPage5Platform }
                        setClean5Social(next)
                      }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {EMPRESARIAL_PAGE5_PLATFORMS.map((key) => (
                        <option key={key} value={key}>
                          {clean5PlatformLabels[key]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0 flex-[2]">
                    <label className="mb-1 block text-xs font-medium text-slate-600">URL</label>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const next = [...c5.socialLinks]
                        next[index] = { ...next[index], url: e.target.value }
                        setClean5Social(next)
                      }}
                      placeholder="https://instagram.com/suaempresa"
                      className="rounded-lg border-slate-200"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-600"
                    onClick={() => setClean5Social(c5.socialLinks.filter((l) => l.id !== link.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'cleanCta': {
        const cta = mergeCleanPromotionCta(proposalData.cleanPromotionCta)
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Botão flutuante · WhatsApp</h3>
              <p className="mt-1 text-sm text-slate-500">
                Este modelo não tem planos nem confirmação no link: o visitante usa o botão fixo para abrir o{' '}
                <strong>WhatsApp</strong> e falar consigo. O link público pode ser partilhado à vontade.
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Texto do botão</label>
              <Input
                value={cta.buttonLabel}
                onChange={(e) => patchCleanPromotionCta({ buttonLabel: e.target.value })}
                className="rounded-xl border-slate-200"
                placeholder="SAIBA MAIS"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">WhatsApp</label>
              <Input
                value={cta.whatsappTarget}
                onChange={(e) => patchCleanPromotionCta({ whatsappTarget: e.target.value })}
                className="rounded-xl border-slate-200"
                placeholder="5511999998888 ou https://wa.me/5511999998888"
              />
              <p className="mt-1 text-xs text-slate-500">
                Indique o número com DDI e DDD (só dígitos) ou uma URL completa do WhatsApp. Se ficar vazio, o botão não
                aparece na proposta.
              </p>
            </div>
          </div>
        )
      }

      case 'empresarial': {
        const p1 = mergeEmpresarialPage1(proposalData.empresarialPage1)
        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Hero — página 1</h3>
              <p className="text-sm text-slate-500">
                Topo da proposta: cabeçalho com logo ou nome, botões de contato e Sobre nós, frase principal e faixa
                inferior. Use quebras de linha no título para várias linhas.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Logo e nome no cabeçalho</h4>
                <p className="mt-1 text-xs text-slate-500">Defina o que aparece no cabeçalho do hero.</p>
              </div>
              <ImageUploader
                label="Logo da empresa"
                value={proposalData.company.logo || undefined}
                onChange={(url) => updateCompany('logo', url)}
                aspectRatio="video"
              />
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-700">Nome da empresa *</label>
                <Input
                  value={proposalData.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  placeholder="Sua Empresa Ltda"
                  className="w-full rounded-xl border-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Exibido no topo quando não há logo, ou como texto alternativo da imagem.
                </p>
              </div>
            </div>

            <ProposalColorPalettePicker
              selected={proposalData.colorPalette}
              onSelect={(colors) => updateField('colorPalette', colors)}
              hint="Cores de destaque em planos, botões e secções da proposta empresarial."
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Aparência do site</label>
              <p className="mb-3 text-xs text-slate-500">
                <strong>Escuro</strong> — hero e secções escuras (padrão). <strong>Claro</strong> — fundo{' '}
                <code className="rounded bg-slate-100 px-1 text-[11px]">neutral-100</code> como na tela de login, com
                texto escuro nas vitrines coloridas.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => patchEmpresarial({ siteMode: 'dark' })}
                  className={cn(
                    'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all',
                    p1.siteMode === 'dark'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  Modelo escuro
                </button>
                <button
                  type="button"
                  onClick={() => patchEmpresarial({ siteMode: 'light' })}
                  className={cn(
                    'rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all',
                    p1.siteMode === 'light'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  )}
                >
                  Modelo claro
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <ImageUploader
                label="Imagem antes do título"
                value={p1.heroImageStart || undefined}
                onChange={(url) => patchEmpresarial({ heroImageStart: url })}
                aspectRatio="auto"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Título / frase principal</label>
              <textarea
                value={p1.heroHeadline}
                onChange={(e) => patchEmpresarial({ heroHeadline: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="OUR BUILDINGS&#10;INTEGRATE BEST&#10;COSY HOME"
              />
            </div>

            <div className="space-y-3">
              <ImageUploader
                label="Imagem após o título"
                value={p1.heroImageEnd || undefined}
                onChange={(url) => patchEmpresarial({ heroImageEnd: url })}
                aspectRatio="auto"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Texto do botão de contato</label>
                <Input
                  value={p1.contactButtonLabel}
                  onChange={(e) => patchEmpresarial({ contactButtonLabel: e.target.value })}
                  className="rounded-xl border-slate-200"
                  placeholder="CONTATO"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Rola até a secção de contato no rodapé — conteúdo configurável na aba Contato.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Texto do botão principal</label>
                <Input
                  value={p1.sobreNosButtonLabel}
                  onChange={(e) => patchEmpresarial({ sobreNosButtonLabel: e.target.value })}
                  className="rounded-xl border-slate-200"
                  placeholder="SOBRE NÓS"
                />
                <p className="mt-1 text-xs text-slate-500">Rola até a secção Sobre nós mais abaixo na mesma página.</p>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-800">Faixa inferior (5 itens)</h4>
              <p className="mb-4 text-xs text-slate-500">
                Edite o rótulo e escolha entre milhares de ícones Lucide (corporativos e mais).
              </p>
              <div className="space-y-4">
                {p1.bottomRow.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end"
                  >
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-medium text-slate-600">Rótulo {index + 1}</label>
                      <Input
                        value={item.label}
                        onChange={(e) => {
                          const row = [...p1.bottomRow]
                          row[index] = { ...row[index], label: e.target.value }
                          patchEmpresarial({ bottomRow: row })
                        }}
                        className="rounded-lg border-slate-200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIconPickTarget({ kind: 'page1', index })}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <span className="text-xs text-slate-500">Ícone:</span>
                        <code className="max-w-[120px] truncate text-xs">{item.iconKey}</code>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      case 'empresarial2': {
        const p2 = mergeEmpresarialPage2(proposalData.empresarialPage2)
        const setCards = (cards: EmpresarialPage2Card[]) => patchEmpresarialPage2({ cards })

        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Trabalhos — página 2</h3>
              <p className="text-sm text-slate-500">
                Aparece ao rolar após o hero. À esquerda fica fixo o rótulo e o título; à direita os cards sobem com
                animação conforme o scroll. É obrigatório pelo menos um card.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Rótulo (ponto laranja)</label>
              <Input
                value={p2.eyebrow}
                onChange={(e) => patchEmpresarialPage2({ eyebrow: e.target.value })}
                className="rounded-xl border-slate-200"
                placeholder="ALGUNS DE NOSSOS TRABALHOS"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Título grande</label>
              <textarea
                value={p2.headline}
                onChange={(e) => patchEmpresarialPage2({ headline: e.target.value })}
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder={'A MELHOR EMPRESA\nDE MARKETING\nDO BRASIL'}
              />
              <p className="mt-1 text-xs text-slate-500">Use Enter para quebrar linhas.</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-800">Cards de serviço</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() =>
                    setCards([
                      ...p2.cards,
                      {
                        id: `p2-${Date.now()}`,
                        title: 'NOVO SERVIÇO',
                        description: 'Descreva o serviço.',
                        image: null,
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar card
                </Button>
              </div>

              {p2.cards.map((card, index) => (
                <div key={card.id} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600">Card {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700"
                      disabled={p2.cards.length <= 1}
                      onClick={() => {
                        if (p2.cards.length <= 1) return
                        setCards(p2.cards.filter((c) => c.id !== card.id))
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <ImageUploader
                    label="Imagem do serviço"
                    value={card.image || undefined}
                    onChange={(url) => {
                      const next = [...p2.cards]
                      next[index] = { ...next[index], image: url }
                      setCards(next)
                    }}
                    aspectRatio="video"
                  />
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
                    <Input
                      value={card.title}
                      onChange={(e) => {
                        const next = [...p2.cards]
                        next[index] = { ...next[index], title: e.target.value }
                        setCards(next)
                      }}
                      className="rounded-lg border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Descrição</label>
                    <textarea
                      value={card.description}
                      onChange={(e) => {
                        const next = [...p2.cards]
                        next[index] = { ...next[index], description: e.target.value }
                        setCards(next)
                      }}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'empresarial3': {
        const p3 = mergeEmpresarialPage3(proposalData.empresarialPage3)
        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Planos — página 3</h3>
              <p className="text-sm text-slate-500">
                Em <strong>VALORES</strong> cadastre os preços (um ou mais). O rótulo em destaque na vitrine é fixo:{' '}
                <strong>nossos planos</strong>. Cada cartão usa nome, descrição, benefícios, valor e imagem opcional.
                Grade de 2 colunas; um único cartão fica centralizado.
              </p>
            </div>

            <PlansPaymentEditor
              plans={proposalData.plans}
              accentColor={proposalData.colorPalette.primary}
              onPlansChange={(next) =>
                setProposalData((prev) => ({
                  ...prev,
                  plans: next,
                  paymentType: 'plans',
                  singlePrice: 0,
                }))
              }
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Frase motivacional</label>
              <textarea
                value={p3.motivationalPhrase}
                onChange={(e) => patchEmpresarialPage3({ motivationalPhrase: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="A MELHOR SOLUÇÃO PARA O SEU NEGÓCIO"
              />
              <p className="mt-1 text-xs text-slate-500">Use Enter para quebrar linhas no título grande.</p>
            </div>
          </div>
        )
      }

      case 'empresarial31': {
        const p31 = mergeEmpresarialPage31(proposalData.empresarialPage31)
        const setStats = (stats: EmpresarialStatBlock[]) => patchEmpresarialPage31({ stats: stats.slice(0, 4) })
        const setTestimonials = (testimonials: EmpresarialTestimonial[]) =>
          patchEmpresarialPage31({ testimonials: testimonials.slice(0, 6) })

        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Página 3.1 — números e depoimentos</h3>
              <p className="text-sm text-slate-500">
                Aparece após os planos na área escura. Até 4 blocos de métricas, até 6 depoimentos (rotação automática
                a cada 4s) e uma frase em marquee infinito.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={p31.showStats}
                onChange={(e) => patchEmpresarialPage31({ showStats: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-800">Mostrar blocos de métricas (4k+, etc.)</span>
            </label>

            {p31.showStats && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Métricas (máx. 4)</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={p31.stats.length >= 4}
                    onClick={() =>
                      setStats([
                        ...p31.stats,
                        { id: `st-${Date.now()}`, value: '0+', label: 'NOVO INDICADOR' },
                      ])
                    }
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
                {p31.stats.map((s, index) => (
                  <div key={s.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Valor (ex.: 4k+)</label>
                      <Input
                        value={s.value}
                        onChange={(e) => {
                          const next = [...p31.stats]
                          next[index] = { ...next[index], value: e.target.value }
                          setStats(next)
                        }}
                        className="rounded-lg border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Rótulo</label>
                      <Input
                        value={s.label}
                        onChange={(e) => {
                          const next = [...p31.stats]
                          next[index] = { ...next[index], label: e.target.value }
                          setStats(next)
                        }}
                        className="rounded-lg border-slate-200"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => setStats(p31.stats.filter((x) => x.id !== s.id))}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">Depoimentos (máx. 6)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={p31.testimonials.length >= 6}
                  onClick={() =>
                    setTestimonials([
                      ...p31.testimonials,
                      {
                        id: `t-${Date.now()}`,
                        clientName: 'Nome do cliente',
                        quote: 'Breve relato sobre a experiência.',
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {p31.testimonials.map((t, index) => (
                <div key={t.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600">Depoimento {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600"
                      onClick={() => setTestimonials(p31.testimonials.filter((x) => x.id !== t.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    value={t.clientName}
                    onChange={(e) => {
                      const next = [...p31.testimonials]
                      next[index] = { ...next[index], clientName: e.target.value }
                      setTestimonials(next)
                    }}
                    placeholder="Nome do cliente"
                    className="rounded-lg border-slate-200"
                  />
                  <textarea
                    value={t.quote}
                    onChange={(e) => {
                      const next = [...p31.testimonials]
                      next[index] = { ...next[index], quote: e.target.value }
                      setTestimonials(next)
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Relato"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Frase do marquee (rolagem contínua)</label>
              <textarea
                value={p31.marqueeText}
                onChange={(e) => patchEmpresarialPage31({ marqueeText: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="WE LOVE DESIGN. WE LOVE YOUR PROJECT. "
              />
              <p className="mt-1 text-xs text-slate-500">A frase completa percorre a tela em loop; quanto maior, mais lenta a animação.</p>
            </div>
          </div>
        )
      }

      case 'empresarial4': {
        const p4 = mergeEmpresarialPage4(proposalData.empresarialPage4)
        const setQuadrants = (quadrants: EmpresarialPage4Quadrant[]) =>
          patchEmpresarialPage4({ quadrants: quadrants.slice(0, 6) })
        const setPhrases = (phrases: string[]) => patchEmpresarialPage4({ marqueePhrases: phrases.slice(0, 7) })

        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Sobre nós — página 4</h3>
              <p className="text-sm text-slate-500">
                Imagem de fundo em tela cheia, rótulo fixo <strong>Sobre nós</strong>, título editável, grade de 2 a 6
                blocos (ícone Lucide, número, título e subtítulo) e faixa na cor de destaque com 3 a 7 frases em marquee.
              </p>
            </div>

            <ImageUploader
              label="Imagem de fundo (empresa / ambiente)"
              value={p4.backgroundImage || undefined}
              onChange={(url) => patchEmpresarialPage4({ backgroundImage: url ?? null })}
              aspectRatio="video"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Título principal</label>
              <textarea
                value={p4.headline}
                onChange={(e) => patchEmpresarialPage4({ headline: e.target.value })}
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder={'THE PROJECT\nPROCESS'}
              />
              <p className="mt-1 text-xs text-slate-500">
                Use Enter para quebrar linhas. Na proposta ao cliente o título é mostrado em <strong>CAIXA ALTA</strong> (aqui
                você pode digitar normalmente).
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-800">Quadrantes (mín. 2, máx. 6)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={p4.quadrants.length >= 6}
                  onClick={() =>
                    setQuadrants([
                      ...p4.quadrants,
                      {
                        id: `p4-${Date.now()}`,
                        iconKey: 'sparkles',
                        title: 'NOVO PASSO',
                        subtitle: 'Descreva esta etapa.',
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar quadrante
                </Button>
              </div>

              {p4.quadrants.map((q, index) => (
                <div key={q.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-600">Quadrante {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-600"
                      disabled={p4.quadrants.length <= 2}
                      onClick={() => {
                        if (p4.quadrants.length <= 2) return
                        setQuadrants(p4.quadrants.filter((x) => x.id !== q.id))
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIconPickTarget({ kind: 'page4', index })}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span className="text-xs text-slate-500">Ícone:</span>
                      <code className="max-w-[140px] truncate text-xs">{q.iconKey}</code>
                    </button>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Título</label>
                    <Input
                      value={q.title}
                      onChange={(e) => {
                        const next = [...p4.quadrants]
                        next[index] = { ...next[index], title: e.target.value }
                        setQuadrants(next)
                      }}
                      className="rounded-lg border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Subtítulo</label>
                    <textarea
                      value={q.subtitle}
                      onChange={(e) => {
                        const next = [...p4.quadrants]
                        next[index] = { ...next[index], subtitle: e.target.value }
                        setQuadrants(next)
                      }}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">Faixa colorida — frases (mín. 3, máx. 7)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={p4.marqueePhrases.length >= 7}
                  onClick={() => setPhrases([...p4.marqueePhrases, 'NOVA FRASE'])}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar frase
                </Button>
              </div>
              {p4.marqueePhrases.map((phrase, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={phrase}
                    onChange={(e) => {
                      const next = [...p4.marqueePhrases]
                      next[index] = e.target.value
                      setPhrases(next)
                    }}
                    className="rounded-lg border-slate-200"
                    placeholder="Frase curta"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-600"
                    disabled={p4.marqueePhrases.length <= 3}
                    onClick={() => setPhrases(p4.marqueePhrases.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'empresarial5': {
        const p5 = mergeEmpresarialPage5(proposalData.empresarialPage5)
        const setSocial = (socialLinks: EmpresarialPage5SocialLink[]) =>
          patchEmpresarialPage5({ socialLinks: socialLinks.slice(0, 12) })

        const platformLabels: Record<EmpresarialPage5Platform, string> = {
          instagram: 'Instagram',
          x: 'X (Twitter)',
          facebook: 'Facebook',
          linkedin: 'LinkedIn',
          youtube: 'YouTube',
          tiktok: 'TikTok',
          github: 'GitHub',
          behance: 'Behance',
          dribbble: 'Dribbble',
          website: 'Site / outro link',
        }

        return (
          <div className="space-y-8">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Contato — página 5</h3>
              <p className="text-sm text-slate-500">
                Rodapé escuro em três colunas: <strong>contato</strong> (e-mail, telefone e WhatsApp),{' '}
                <strong>endereço</strong> no centro e <strong>redes sociais</strong> à direita. A{' '}
                <strong>logo</strong> vem da seção <strong>Cliente</strong> (e o nome da empresa, se não houver imagem).
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Frase / missão (abaixo da logo)</label>
              <textarea
                value={p5.tagline}
                onChange={(e) => patchEmpresarialPage5({ tagline: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Texto curto sobre a empresa..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">E-mail</label>
                <Input
                  type="email"
                  value={p5.email}
                  onChange={(e) => patchEmpresarialPage5({ email: e.target.value })}
                  className="rounded-xl border-slate-200"
                  placeholder="contato@empresa.com"
                />
                <p className="mt-1 text-xs text-slate-500">Na proposta, o visitante abre o app de e-mail ao clicar.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Telefone</label>
                <Input
                  value={p5.phone}
                  onChange={(e) => patchEmpresarialPage5({ phone: e.target.value })}
                  className="rounded-xl border-slate-200"
                  placeholder="+55 11 99999-8888"
                />
                <p className="mt-1 text-xs text-slate-500">Link <code className="text-[11px]">tel:</code> para ligar no celular.</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">WhatsApp</label>
              <Input
                value={p5.whatsapp}
                onChange={(e) => patchEmpresarialPage5({ whatsapp: e.target.value })}
                className="rounded-xl border-slate-200"
                placeholder="5511999998888 (DDI + DDD + número, só números)"
              />
              <p className="mt-1 text-xs text-slate-500">
                Ao clicar em &quot;WhatsApp&quot; na proposta, abre o WhatsApp Web ou o app com conversa nova.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Endereço</label>
              <textarea
                value={p5.address}
                onChange={(e) => patchEmpresarialPage5({ address: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder={'Rua Exemplo, 100\nBairro — Cidade / UF\nCEP 00000-000'}
              />
              <p className="mt-1 text-xs text-slate-500">Use Enter para cada linha; o layout centraliza no desktop.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Copyright (rodapé inferior)</label>
              <Input
                value={p5.copyrightText}
                onChange={(e) => patchEmpresarialPage5({ copyrightText: e.target.value })}
                className="rounded-xl border-slate-200"
                placeholder="© 2026. Todos os direitos reservados."
              />
              <p className="mt-1 text-xs text-slate-500">Se vazio, usamos ano atual + nome da empresa da seção Cliente.</p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-800">Redes sociais (máx. 12)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={p5.socialLinks.length >= 12}
                  onClick={() =>
                    setSocial([
                      ...p5.socialLinks,
                      {
                        id: `soc-${Date.now()}`,
                        platform: 'instagram',
                        url: '',
                      },
                    ])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar rede
                </Button>
              </div>
              {p5.socialLinks.map((link, index) => (
                <div key={link.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Rede</label>
                    <select
                      value={link.platform}
                      onChange={(e) => {
                        const next = [...p5.socialLinks]
                        next[index] = { ...next[index], platform: e.target.value as EmpresarialPage5Platform }
                        setSocial(next)
                      }}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                    >
                      {EMPRESARIAL_PAGE5_PLATFORMS.map((key) => (
                        <option key={key} value={key}>
                          {platformLabels[key]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-0 flex-[2]">
                    <label className="mb-1 block text-xs font-medium text-slate-600">URL</label>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const next = [...p5.socialLinks]
                        next[index] = { ...next[index], url: e.target.value }
                        setSocial(next)
                      }}
                      placeholder="https://instagram.com/suaempresa"
                      className="rounded-lg border-slate-200"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-red-600"
                    onClick={() => setSocial(p5.socialLinks.filter((l) => l.id !== link.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'planos':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-1 text-lg font-semibold text-slate-900">Planos</h3>
              <p className="text-sm text-slate-500">Valores e opções que o cliente verá na proposta</p>
            </div>

            {proposalData.template !== 'empresarial' ? (
              <ProposalColorPalettePicker
                selected={proposalData.colorPalette}
                onSelect={(colors) => updateField('colorPalette', colors)}
                hint="Cores da proposta (planos, destaques e elementos do layout)."
              />
            ) : null}

            <PlansPaymentEditor
              plans={proposalData.plans}
              accentColor={proposalData.colorPalette.primary}
              onPlansChange={(next) =>
                setProposalData((prev) => ({
                  ...prev,
                  plans: next,
                  paymentType: 'plans',
                  singlePrice: 0,
                }))
              }
            />
          </div>
        )

      default:
        return null
    }
  }

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Carregando proposta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header fixo */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/propostas"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">{editId ? 'Editar Proposta' : 'Nova Proposta'}</h1>
              <p className="text-xs text-slate-500">
                {shell === 'studio' ? 'Janela dedicada · ' : ''}
                {status === 'draft' ? 'Rascunho' : status === 'published' ? 'Publicada' : 'Aceita'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shell === 'dashboard' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openClientLivePreview}
                className="gap-1.5 sm:gap-2 shrink-0 border-indigo-200 text-indigo-800 hover:bg-indigo-50"
                title="Nova aba: mesma visualização que o cliente verá (atualiza em tempo real)"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Cliente</span>
                <span className="hidden sm:inline">Ver como cliente</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2 hidden lg:flex"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Ocultar' : 'Preview'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePublish}
              disabled={isSaving}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
              Publicar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar de navegação */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-57px)] sticky top-[57px]">
          <nav className="p-3 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm',
                  activeSection === section.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Área principal */}
        <main className={cn(
          'flex-1 min-w-0 transition-all',
          showPreview ? 'lg:w-1/2' : 'w-full'
        )}>
          {/* Mobile tabs */}
          <div className="md:hidden sticky top-[57px] z-20 bg-white border-b border-slate-200 overflow-x-auto">
            <div className="flex px-4 py-2 gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                    activeSection === section.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-slate-600'
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 lg:p-8 max-w-3xl">
            {renderSection()}
          </div>
        </main>

        {/* Preview lateral */}
        {showPreview && (
          <aside className="hidden lg:block w-1/2 min-w-[400px] max-w-[600px] bg-slate-100 border-l border-slate-200 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Preview</h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
                  Tempo real
                </span>
              </div>
              <div className="transform scale-[0.85] origin-top">
                <ProposalPreview 
                  data={proposalData} 
                  className="shadow-xl"
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      <LucideIconPickerDialog
        open={iconPickTarget !== null}
        onClose={() => setIconPickTarget(null)}
        onPick={(iconKey) => {
          const target = iconPickTarget
          if (!target) return
          if (target.kind === 'page1') {
            setProposalData((prev) => {
              const p1 = mergeEmpresarialPage1(prev.empresarialPage1)
              const row = [...p1.bottomRow]
              if (row[target.index]) row[target.index] = { ...row[target.index], iconKey }
              return { ...prev, empresarialPage1: { ...p1, bottomRow: row } }
            })
          } else {
            setProposalData((prev) => {
              const p4 = mergeEmpresarialPage4(prev.empresarialPage4)
              const quads = [...p4.quadrants]
              if (quads[target.index]) quads[target.index] = { ...quads[target.index], iconKey }
              return { ...prev, empresarialPage4: { ...p4, quadrants: quads } }
            })
          }
          setIconPickTarget(null)
        }}
        title={iconPickTarget?.kind === 'page4' ? 'Ícone do quadrante' : 'Ícone da faixa inferior'}
      />

      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg [&>button]:text-slate-500 [&>button]:hover:text-slate-700 [&>button]:top-4 [&>button]:right-4">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900 m-0">
                  Proposta publicada
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1 m-0">
                  Envie o link abaixo para seu cliente acessar e aceitar a proposta.
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={publishedLink}
                className="h-9 flex-1 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600"
              />
              <Button
                type="button"
                size="sm"
                onClick={copyLink}
                className="h-9 shrink-0 gap-1.5 rounded-lg bg-slate-800 px-3 text-white hover:bg-slate-700"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {linkCopied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPublishModal(false)}
                className="rounded-lg"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
