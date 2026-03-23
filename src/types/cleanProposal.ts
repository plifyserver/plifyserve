import type { EmpresarialPage5Platform } from '@/types/empresarialProposal'
import { EMPRESARIAL_PAGE5_PLATFORMS } from '@/types/empresarialProposal'

export type CleanMetaField = { label: string; value: string }

/** Hero escuro estilo portfolio (modelo Clean / Agntix). */
export type CleanPage1 = {
  /** Logo no topo; se vazio, usa `company.logo` na visualização. */
  logoUrl: string | null
  keyword1: string
  keyword2: string
  /** Título grande (nome da empresa na capa). */
  headline: string
  meta: CleanMetaField[]
  contactButtonLabel: string
}

export type CleanPage2 = {
  imageUrl: string | null
}

/** Página 3 — serviços/produtos: título, resumo, 3 palavras-chave e carrossel (3–6 imagens). */
export type CleanPage3 = {
  sectionTitle: string
  summary: string
  keywords: [string, string, string]
  carouselImages: string[]
}

export type CleanPage4Column = {
  /** Ex.: "01", "02" — editável */
  prefix: string
  title: string
  description: string
}

/** Página 4 — apresentação do produto/serviço: título, 3 passos, 1 imagem grande + 2 pequenas. */
export type CleanPage4 = {
  introHeadline: string
  columns: [CleanPage4Column, CleanPage4Column, CleanPage4Column]
  largeImageUrl: string | null
  bottomLeftImageUrl: string | null
  bottomRightImageUrl: string | null
}

/** Rodapé Clean — redes com as mesmas plataformas que o modelo empresarial (pág. 5). */
export type CleanPage5SocialLink = {
  id: string
  platform: EmpresarialPage5Platform
  url: string
}

/** Página 5 — rodapé: frase à esquerda, redes, contacto (dados da empresa), nome gigante. */
export type CleanPage5 = {
  headline: string
  socialLinks: CleanPage5SocialLink[]
}

/** Modelo Clean (divulgação): botão flutuante → WhatsApp. */
export type CleanPromotionCta = {
  buttonLabel: string
  /** Número (DDI + DDD + número, só dígitos) ou URL completa https://wa.me/... */
  whatsappTarget: string
}

export type CleanPlaceholderPage = {
  title: string
  body: string
}

export const DEFAULT_CLEAN_PAGE1: CleanPage1 = {
  logoUrl: null,
  keyword1: 'Website',
  keyword2: 'Services',
  headline: '',
  meta: [
    { label: 'Cliente', value: 'Envato' },
    { label: 'Tarefa', value: 'Branding' },
    { label: 'Prazo', value: '8 mar. 2025' },
    { label: 'Designer', value: 'ThemePure' },
  ],
  contactButtonLabel: 'CONTATO',
}

export const DEFAULT_CLEAN_PAGE2: CleanPage2 = {
  imageUrl: null,
}

export const DEFAULT_CLEAN_PAGE3: CleanPage3 = {
  sectionTitle: 'Nossos Serviços',
  summary:
    'Breve resumo sobre os serviços ou produtos que você oferece. Use este espaço para apresentar o valor da sua proposta de forma clara e objetiva.',
  keywords: [
    'Branding e identidade',
    'Websites e plataformas digitais',
    'Estratégia de conteúdo para redes sociais',
  ],
  carouselImages: [],
}

export const DEFAULT_CLEAN_PAGE4_COLUMNS: [CleanPage4Column, CleanPage4Column, CleanPage4Column] = [
  {
    prefix: '01',
    title: 'Desenvolvimento',
    description:
      'Nesta fase estruturamos a base técnica e alinhamos expectativas para que tudo evolua com segurança e previsibilidade.',
  },
  {
    prefix: '02',
    title: 'Conceito e design',
    description:
      'Definimos a identidade visual e a experiência: como o utilizador ou cliente percebe o produto e interage com ele.',
  },
  {
    prefix: '03',
    title: 'Implementação',
    description:
      'Colocamos o plano em prática, com entregas claras e acompanhamento até ao resultado acordado.',
  },
]

export const DEFAULT_CLEAN_PAGE4: CleanPage4 = {
  introHeadline:
    'Um resumo breve de como o seu produto ou serviço funciona — em poucas linhas, com clareza e confiança.',
  columns: DEFAULT_CLEAN_PAGE4_COLUMNS.map((c) => ({ ...c })) as [
    CleanPage4Column,
    CleanPage4Column,
    CleanPage4Column,
  ],
  largeImageUrl: null,
  bottomLeftImageUrl: null,
  bottomRightImageUrl: null,
}

export const DEFAULT_CLEAN_PAGE5: CleanPage5 = {
  headline: 'Ajudamos negócios a crescer com soluções claras, bem feitas e ao seu lado em cada etapa.',
  socialLinks: [],
}

export const DEFAULT_CLEAN_PROMOTION_CTA: CleanPromotionCta = {
  buttonLabel: 'SAIBA MAIS',
  whatsappTarget: '',
}

export const DEFAULT_CLEAN_PLACEHOLDER: CleanPlaceholderPage = {
  title: 'Em breve',
  body: 'O conteúdo desta página será definido numa próxima etapa do modelo Clean.',
}

function ensureMetaFour(meta: unknown): CleanMetaField[] {
  const d = DEFAULT_CLEAN_PAGE1.meta
  if (!Array.isArray(meta)) return d.map((x) => ({ ...x }))
  const rows = meta
    .filter((m): m is CleanMetaField => Boolean(m) && typeof m === 'object')
    .map((m) => {
      const o = m as CleanMetaField
      return {
        label: typeof o.label === 'string' ? o.label : '',
        value: typeof o.value === 'string' ? o.value : '',
      }
    })
  const out = [...rows]
  while (out.length < 4) out.push({ ...d[out.length] })
  return out.slice(0, 4)
}

export function mergeCleanPage1(raw: unknown): CleanPage1 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<CleanPage1>) : {}
  return {
    logoUrl:
      typeof o.logoUrl === 'string' && o.logoUrl.trim().length > 0 ? o.logoUrl.trim() : null,
    keyword1: typeof o.keyword1 === 'string' ? o.keyword1 : DEFAULT_CLEAN_PAGE1.keyword1,
    keyword2: typeof o.keyword2 === 'string' ? o.keyword2 : DEFAULT_CLEAN_PAGE1.keyword2,
    headline: typeof o.headline === 'string' ? o.headline : DEFAULT_CLEAN_PAGE1.headline,
    meta: ensureMetaFour(o.meta),
    contactButtonLabel:
      typeof o.contactButtonLabel === 'string' && o.contactButtonLabel.trim()
        ? o.contactButtonLabel.trim()
        : DEFAULT_CLEAN_PAGE1.contactButtonLabel,
  }
}

export function mergeCleanPage2(raw: unknown): CleanPage2 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<CleanPage2>) : {}
  return {
    imageUrl: typeof o.imageUrl === 'string' && o.imageUrl.length > 0 ? o.imageUrl : null,
  }
}

function ensureThreeKeywords(kw: unknown): [string, string, string] {
  const d = DEFAULT_CLEAN_PAGE3.keywords
  if (!Array.isArray(kw)) return [d[0], d[1], d[2]]
  const a = kw
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
  return [a[0] ?? d[0], a[1] ?? d[1], a[2] ?? d[2]]
}

function ensureCarouselImages(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, 6)
}

/** Aceita formato antigo `{ title, body }` (placeholder). */
/** Editor: 6 posições fixas; persistimos só URLs preenchidas (mín. 3 na publicação). */
export function cleanCarouselToSix(urls: string[]): (string | undefined)[] {
  return Array.from({ length: 6 }, (_, i) => {
    const u = urls[i]
    return typeof u === 'string' && u.trim() ? u.trim() : undefined
  })
}

export function cleanCarouselFromSix(six: (string | undefined)[]): string[] {
  return six.filter((x): x is string => Boolean(x && String(x).trim())).map((x) => x.trim())
}

export function mergeCleanPage3(raw: unknown): CleanPage3 {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const hasNewShape =
    Array.isArray(o.carouselImages) ||
    Array.isArray(o.keywords) ||
    typeof o.sectionTitle === 'string' ||
    typeof o.summary === 'string'

  if (!hasNewShape && (typeof o.title === 'string' || typeof o.body === 'string')) {
    return {
      sectionTitle:
        typeof o.title === 'string' && o.title.trim() ? o.title.trim() : DEFAULT_CLEAN_PAGE3.sectionTitle,
      summary: typeof o.body === 'string' ? o.body : DEFAULT_CLEAN_PAGE3.summary,
      keywords: [...DEFAULT_CLEAN_PAGE3.keywords],
      carouselImages: [],
    }
  }

  return {
    sectionTitle:
      typeof o.sectionTitle === 'string' && o.sectionTitle.trim()
        ? o.sectionTitle.trim()
        : DEFAULT_CLEAN_PAGE3.sectionTitle,
    summary: typeof o.summary === 'string' ? o.summary : DEFAULT_CLEAN_PAGE3.summary,
    keywords: ensureThreeKeywords(o.keywords),
    carouselImages: ensureCarouselImages(o.carouselImages),
  }
}

function optionalImageUrl(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

function ensureThreeColumns(cols: unknown): [CleanPage4Column, CleanPage4Column, CleanPage4Column] {
  const d = DEFAULT_CLEAN_PAGE4_COLUMNS
  if (!Array.isArray(cols)) return d.map((x) => ({ ...x })) as [CleanPage4Column, CleanPage4Column, CleanPage4Column]
  const parsed = cols
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === 'object')
    .map((c) => ({
      prefix: typeof c.prefix === 'string' ? c.prefix : '',
      title: typeof c.title === 'string' ? c.title : '',
      description: typeof c.description === 'string' ? c.description : '',
    }))
  const out: CleanPage4Column[] = []
  for (let i = 0; i < 3; i++) {
    out.push(
      parsed[i]
        ? {
            prefix: parsed[i].prefix.trim() || d[i].prefix,
            title: parsed[i].title.trim() || d[i].title,
            description: parsed[i].description || d[i].description,
          }
        : { ...d[i] }
    )
  }
  return out as [CleanPage4Column, CleanPage4Column, CleanPage4Column]
}

/** Migra placeholder antigo `{ title, body }`. */
export function mergeCleanPage4(raw: unknown): CleanPage4 {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const hasNewShape =
    typeof o.introHeadline === 'string' ||
    Array.isArray(o.columns) ||
    o.largeImageUrl != null ||
    o.bottomLeftImageUrl != null ||
    o.bottomRightImageUrl != null

  if (!hasNewShape && (typeof o.title === 'string' || typeof o.body === 'string')) {
    const body = typeof o.body === 'string' ? o.body.trim() : ''
    const title = typeof o.title === 'string' ? o.title.trim() : ''
    return {
      introHeadline: body || title || DEFAULT_CLEAN_PAGE4.introHeadline,
      columns: DEFAULT_CLEAN_PAGE4_COLUMNS.map((c) => ({ ...c })) as [
        CleanPage4Column,
        CleanPage4Column,
        CleanPage4Column,
      ],
      largeImageUrl: null,
      bottomLeftImageUrl: null,
      bottomRightImageUrl: null,
    }
  }

  return {
    introHeadline:
      typeof o.introHeadline === 'string' && o.introHeadline.trim()
        ? o.introHeadline
        : DEFAULT_CLEAN_PAGE4.introHeadline,
    columns: ensureThreeColumns(o.columns),
    largeImageUrl: optionalImageUrl(o.largeImageUrl),
    bottomLeftImageUrl: optionalImageUrl(o.bottomLeftImageUrl),
    bottomRightImageUrl: optionalImageUrl(o.bottomRightImageUrl),
  }
}

function isCleanPage5Platform(x: string): x is EmpresarialPage5Platform {
  return (EMPRESARIAL_PAGE5_PLATFORMS as readonly string[]).includes(x)
}

function isCleanPage5SocialLink(x: unknown): x is CleanPage5SocialLink {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.url === 'string' &&
    typeof o.platform === 'string' &&
    isCleanPage5Platform(o.platform)
  )
}

export function mergeCleanPromotionCta(raw: unknown): CleanPromotionCta {
  const o = raw && typeof raw === 'object' ? (raw as Partial<CleanPromotionCta>) : {}
  return {
    buttonLabel:
      typeof o.buttonLabel === 'string' && o.buttonLabel.trim()
        ? o.buttonLabel.trim()
        : DEFAULT_CLEAN_PROMOTION_CTA.buttonLabel,
    whatsappTarget: typeof o.whatsappTarget === 'string' ? o.whatsappTarget.trim() : '',
  }
}

/** Migra placeholder antigo `{ title, body }` para headline + redes. */
export function mergeCleanPage5(raw: unknown): CleanPage5 {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const hasNewShape = typeof o.headline === 'string' || Array.isArray(o.socialLinks)

  if (!hasNewShape && (typeof o.title === 'string' || typeof o.body === 'string')) {
    const title = typeof o.title === 'string' ? o.title.trim() : ''
    const body = typeof o.body === 'string' ? o.body.trim() : ''
    const headline =
      body || title || DEFAULT_CLEAN_PAGE5.headline
    return {
      headline,
      socialLinks: [],
    }
  }

  const rawSocial = Array.isArray(o.socialLinks) ? o.socialLinks.filter(isCleanPage5SocialLink) : []
  const socialLinks = rawSocial.slice(0, 12).map((l, i) => ({
    ...l,
    id: l.id || `clean-soc-${i}`,
  }))

  return {
    headline:
      typeof o.headline === 'string' && o.headline.trim() ? o.headline : DEFAULT_CLEAN_PAGE5.headline,
    socialLinks,
  }
}

export function mergeCleanPlaceholder(raw: unknown): CleanPlaceholderPage {
  const o = raw && typeof raw === 'object' ? (raw as Partial<CleanPlaceholderPage>) : {}
  return {
    title: typeof o.title === 'string' ? o.title : DEFAULT_CLEAN_PLACEHOLDER.title,
    body: typeof o.body === 'string' ? o.body : DEFAULT_CLEAN_PLACEHOLDER.body,
  }
}
