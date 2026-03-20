export interface EmpresarialBottomItem {
  label: string
  /** Nome do ícone Lucide em kebab-case (ex.: building-2, trees) */
  iconKey: string
}

/** Visual geral do template empresarial (hero + secções) */
export type EmpresarialSiteMode = 'dark' | 'light'

export interface EmpresarialPage1 {
  /** Escuro (padrão) ou claro — fundo tipo login (`neutral-100`) */
  siteMode: EmpresarialSiteMode
  /** Imagem antes do título (URL ou data URL) */
  heroImageStart: string | null
  /** Texto do herói; use quebras de linha para várias linhas */
  heroHeadline: string
  /** Imagem após o título */
  heroImageEnd: string | null
  contactButtonLabel: string
  sobreNosButtonLabel: string
  bottomRow: EmpresarialBottomItem[]
}

export const DEFAULT_EMPRESARIAL_PAGE1: EmpresarialPage1 = {
  siteMode: 'dark',
  heroImageStart: null,
  heroHeadline: 'OUR BUILDINGS\nINTEGRATE BEST\nCOSY HOME',
  heroImageEnd: null,
  contactButtonLabel: 'CONTATO',
  sobreNosButtonLabel: 'SOBRE NÓS',
  bottomRow: [
    { label: 'LANDSCAPE', iconKey: 'trees' },
    { label: 'COMMERCIAL', iconKey: 'building-2' },
    { label: 'RESIDENTIAL', iconKey: 'home' },
    { label: 'INDUSTRIAL', iconKey: 'factory' },
    { label: 'URBAN', iconKey: 'landmark' },
  ],
}

function isBottomItem(x: unknown): x is EmpresarialBottomItem {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.label === 'string' && typeof o.iconKey === 'string'
}

export interface EmpresarialPage2Card {
  id: string
  title: string
  description: string
  image: string | null
}

export interface EmpresarialPage2 {
  /** Texto ao lado do ponto laranja (ex.: ALGUNS DE NOSSOS TRABALHOS) */
  eyebrow: string
  /** Título grande em linhas (use \n) */
  headline: string
  cards: EmpresarialPage2Card[]
}

export const DEFAULT_EMPRESARIAL_PAGE2: EmpresarialPage2 = {
  eyebrow: 'ALGUNS DE NOSSOS TRABALHOS',
  headline: 'OUR\nDESIGN\nTHINKING\nPROCESS',
  cards: [
    {
      id: 'p2-1',
      title: 'USER RESEARCH',
      description:
        'We listen stories of user to understand pain points and give a rough estimate about cost and time-frame.',
      image: null,
    },
    {
      id: 'p2-2',
      title: 'DEFINE PROBLEMS',
      description:
        'We engage with users to understand their needs and propose a rough budget and delivery schedule.',
      image: null,
    },
    {
      id: 'p2-3',
      title: 'ENTREGA',
      description: 'Descreva como seu serviço é entregue ao cliente.',
      image: null,
    },
  ],
}

function isPage2Card(x: unknown): x is EmpresarialPage2Card {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  const idOk = typeof o.id === 'string' && o.id.length > 0
  return (
    idOk &&
    typeof o.title === 'string' &&
    typeof o.description === 'string' &&
    (o.image === null || typeof o.image === 'string')
  )
}

export function mergeEmpresarialPage2(raw: unknown): EmpresarialPage2 {
  const d = DEFAULT_EMPRESARIAL_PAGE2
  if (!raw || typeof raw !== 'object') {
    return {
      ...d,
      cards: d.cards.map((c) => ({ ...c })),
    }
  }
  const o = raw as Record<string, unknown>
  const rawCards = Array.isArray(o.cards) ? o.cards.filter(isPage2Card) : []
  const cards =
    rawCards.length > 0
      ? rawCards.map((c, i) => ({
          ...c,
          id: c.id || `p2-${i + 1}`,
        }))
      : d.cards.map((c) => ({ ...c }))
  return {
    eyebrow: typeof o.eyebrow === 'string' ? o.eyebrow : d.eyebrow,
    headline: typeof o.headline === 'string' ? o.headline : d.headline,
    cards,
  }
}

export interface EmpresarialPage3 {
  /** Frase motivacional sob o rótulo "nossos planos" */
  motivationalPhrase: string
}

export const DEFAULT_EMPRESARIAL_PAGE3: EmpresarialPage3 = {
  motivationalPhrase: 'ESCOLHA O PLANO IDEAL PARA O SEU PROJETO',
}

export function mergeEmpresarialPage3(raw: unknown): EmpresarialPage3 {
  const d = DEFAULT_EMPRESARIAL_PAGE3
  if (!raw || typeof raw !== 'object') return { ...d }
  const o = raw as Record<string, unknown>
  return {
    motivationalPhrase:
      typeof o.motivationalPhrase === 'string' ? o.motivationalPhrase : d.motivationalPhrase,
  }
}

export interface EmpresarialStatBlock {
  id: string
  value: string
  label: string
}

export interface EmpresarialTestimonial {
  id: string
  clientName: string
  quote: string
}

export interface EmpresarialPage31 {
  showStats: boolean
  stats: EmpresarialStatBlock[]
  testimonials: EmpresarialTestimonial[]
  marqueeText: string
}

export const DEFAULT_EMPRESARIAL_PAGE31: EmpresarialPage31 = {
  showStats: true,
  stats: [
    { id: 'st-1', value: '4k+', label: 'PROJETOS CONCLUÍDOS' },
    { id: 'st-2', value: '91+', label: 'ESPECIALISTAS' },
    { id: 'st-3', value: '42+', label: 'PARCERIAS' },
    { id: 'st-4', value: '24+', label: 'PRÊMIOS' },
  ],
  testimonials: [
    {
      id: 't1',
      clientName: 'Cliente satisfeito',
      quote:
        'Profissionalismo e clareza em todas as etapas. Recomendamos de olhos fechados.',
    },
  ],
  marqueeText: 'WE LOVE DESIGN. WE LOVE ARCHITECTURE. ',
}

function isStatBlock(x: unknown): x is EmpresarialStatBlock {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.value === 'string' && typeof o.label === 'string'
}

function isTestimonial(x: unknown): x is EmpresarialTestimonial {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.clientName === 'string' && typeof o.quote === 'string'
}

/** Quadrante da página 4 (processo / sobre a empresa) */
export interface EmpresarialPage4Quadrant {
  id: string
  iconKey: string
  title: string
  subtitle: string
}

export interface EmpresarialPage4 {
  /** Imagem de fundo em tela cheia */
  backgroundImage: string | null
  /** Título principal em maiúsculas; use \\n para várias linhas */
  headline: string
  quadrants: EmpresarialPage4Quadrant[]
  /** 3 a 7 frases curtas na faixa inferior (marquee) */
  marqueePhrases: string[]
}

export const DEFAULT_EMPRESARIAL_PAGE4: EmpresarialPage4 = {
  backgroundImage: null,
  headline: 'THE\nPROJECT\nPROCESS',
  quadrants: [
    {
      id: 'p4-1',
      iconKey: 'box',
      title: 'PROJECT ANALYSIS',
      subtitle: 'Stand out with a polished, professional look.',
    },
    {
      id: 'p4-2',
      iconKey: 'layers',
      title: 'EXECUTION',
      subtitle: 'We turn strategy into tangible results with clear milestones.',
    },
    {
      id: 'p4-3',
      iconKey: 'target',
      title: 'FOCUS',
      subtitle: 'Goals aligned with your business and your audience.',
    },
    {
      id: 'p4-4',
      iconKey: 'shield-check',
      title: 'QUALITY',
      subtitle: 'Rigorous standards at every stage of delivery.',
    },
    {
      id: 'p4-5',
      iconKey: 'users',
      title: 'COLLABORATION',
      subtitle: 'Transparent communication and dedicated support.',
    },
    {
      id: 'p4-6',
      iconKey: 'award',
      title: 'EXCELLENCE',
      subtitle: 'Experience that builds trust and long-term partnerships.',
    },
  ],
  marqueePhrases: [
    'WE LOVE DESIGN',
    'WE LOVE ARCHITECTURE',
    'INNOVATION',
    'PARTNERSHIP',
    'QUALITY FIRST',
  ],
}

function isPage4Quadrant(x: unknown): x is EmpresarialPage4Quadrant {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.iconKey === 'string' &&
    typeof o.title === 'string' &&
    typeof o.subtitle === 'string'
  )
}

export function mergeEmpresarialPage4(raw: unknown): EmpresarialPage4 {
  const d = DEFAULT_EMPRESARIAL_PAGE4
  if (!raw || typeof raw !== 'object') {
    return {
      ...d,
      quadrants: d.quadrants.map((q) => ({ ...q })),
      marqueePhrases: [...d.marqueePhrases],
    }
  }
  const o = raw as Record<string, unknown>
  const rawQuads = Array.isArray(o.quadrants) ? o.quadrants.filter(isPage4Quadrant) : []
  let quadrants =
    rawQuads.length >= 2
      ? rawQuads.slice(0, 6).map((q, i) => ({ ...q, id: q.id || `p4-${i + 1}` }))
      : d.quadrants.map((q) => ({ ...q }))

  const rawPhrases = Array.isArray(o.marqueePhrases)
    ? o.marqueePhrases
        .filter((x): x is string => typeof x === 'string')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  let marqueePhrases = rawPhrases.slice(0, 7)
  if (marqueePhrases.length < 3) {
    marqueePhrases = [...d.marqueePhrases]
  }

  return {
    backgroundImage:
      typeof o.backgroundImage === 'string'
        ? o.backgroundImage
        : o.backgroundImage === null
          ? null
          : d.backgroundImage,
    headline: typeof o.headline === 'string' ? o.headline : d.headline,
    quadrants,
    marqueePhrases,
  }
}

/** Redes disponíveis na página de contato (pág. 5) */
export const EMPRESARIAL_PAGE5_PLATFORMS = [
  'instagram',
  'x',
  'facebook',
  'linkedin',
  'youtube',
  'tiktok',
  'github',
  'behance',
  'dribbble',
  'website',
] as const

export type EmpresarialPage5Platform = (typeof EMPRESARIAL_PAGE5_PLATFORMS)[number]

export interface EmpresarialPage5SocialLink {
  id: string
  platform: EmpresarialPage5Platform
  url: string
}

export interface EmpresarialPage5 {
  /** Texto curto abaixo da logo (missão / tagline) */
  tagline: string
  email: string
  phone: string
  /** Número com DDI para wa.me (ex.: 5511999998888) — só dígitos ou formato livre */
  whatsapp: string
  /** Endereço; use quebras de linha para várias linhas */
  address: string
  socialLinks: EmpresarialPage5SocialLink[]
  /** Rodapé legal (copyright) */
  copyrightText: string
}

export const DEFAULT_EMPRESARIAL_PAGE5: EmpresarialPage5 = {
  tagline: 'Nosso objetivo é superar expectativas e criar soluções memoráveis para cada cliente.',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  socialLinks: [],
  copyrightText: '',
}

function isPage5Platform(x: string): x is EmpresarialPage5Platform {
  return (EMPRESARIAL_PAGE5_PLATFORMS as readonly string[]).includes(x)
}

function isPage5SocialLink(x: unknown): x is EmpresarialPage5SocialLink {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.url === 'string' &&
    typeof o.platform === 'string' &&
    isPage5Platform(o.platform)
  )
}

export function mergeEmpresarialPage5(raw: unknown): EmpresarialPage5 {
  const d = DEFAULT_EMPRESARIAL_PAGE5
  if (!raw || typeof raw !== 'object') {
    return {
      ...d,
      socialLinks: [],
    }
  }
  const o = raw as Record<string, unknown>
  const rawSocial = Array.isArray(o.socialLinks) ? o.socialLinks.filter(isPage5SocialLink) : []
  const socialLinks = rawSocial.slice(0, 12).map((l, i) => ({
    ...l,
    id: l.id || `soc-${i}`,
  }))
  return {
    tagline: typeof o.tagline === 'string' ? o.tagline : d.tagline,
    email: typeof o.email === 'string' ? o.email : d.email,
    phone: typeof o.phone === 'string' ? o.phone : d.phone,
    whatsapp: typeof o.whatsapp === 'string' ? o.whatsapp : d.whatsapp,
    address: typeof o.address === 'string' ? o.address : d.address,
    socialLinks,
    copyrightText: typeof o.copyrightText === 'string' ? o.copyrightText : d.copyrightText,
  }
}

export function mergeEmpresarialPage31(raw: unknown): EmpresarialPage31 {
  const d = DEFAULT_EMPRESARIAL_PAGE31
  if (!raw || typeof raw !== 'object') {
    return {
      ...d,
      stats: d.stats.map((s) => ({ ...s })),
      testimonials: d.testimonials.map((t) => ({ ...t })),
    }
  }
  const o = raw as Record<string, unknown>
  const statsRaw = Array.isArray(o.stats) ? o.stats.filter(isStatBlock) : null
  const testimonialsRaw = Array.isArray(o.testimonials) ? o.testimonials.filter(isTestimonial) : null
  const stats =
    statsRaw !== null
      ? statsRaw.slice(0, 4).map((s, i) => ({ ...s, id: s.id || `st-${i}` }))
      : d.stats.map((s) => ({ ...s }))
  const testimonials =
    testimonialsRaw !== null
      ? testimonialsRaw.slice(0, 6).map((t, i) => ({ ...t, id: t.id || `t-${i}` }))
      : d.testimonials.map((t) => ({ ...t }))
  return {
    showStats: typeof o.showStats === 'boolean' ? o.showStats : d.showStats,
    stats: stats.length > 0 ? stats : d.stats.map((s) => ({ ...s })),
    testimonials,
    marqueeText: typeof o.marqueeText === 'string' ? o.marqueeText : d.marqueeText,
  }
}

export function mergeEmpresarialPage1(raw: unknown): EmpresarialPage1 {
  const d = DEFAULT_EMPRESARIAL_PAGE1
  if (!raw || typeof raw !== 'object') {
    return {
      ...d,
      bottomRow: d.bottomRow.map((b) => ({ ...b })),
    }
  }
  const o = raw as Record<string, unknown>
  const br = Array.isArray(o.bottomRow) ? o.bottomRow.filter(isBottomItem) : []
  const siteMode: EmpresarialSiteMode =
    o.siteMode === 'light' || o.siteMode === 'dark' ? o.siteMode : d.siteMode
  return {
    siteMode,
    heroImageStart: typeof o.heroImageStart === 'string' ? o.heroImageStart : o.heroImageStart === null ? null : d.heroImageStart,
    heroHeadline: typeof o.heroHeadline === 'string' ? o.heroHeadline : d.heroHeadline,
    heroImageEnd: typeof o.heroImageEnd === 'string' ? o.heroImageEnd : o.heroImageEnd === null ? null : d.heroImageEnd,
    contactButtonLabel: typeof o.contactButtonLabel === 'string' ? o.contactButtonLabel : d.contactButtonLabel,
    sobreNosButtonLabel: typeof o.sobreNosButtonLabel === 'string' ? o.sobreNosButtonLabel : d.sobreNosButtonLabel,
    bottomRow: br.length >= 1 ? br : d.bottomRow.map((b) => ({ ...b })),
  }
}
