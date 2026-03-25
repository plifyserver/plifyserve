/** Hero escuro estilo agência — modelo Moderno (`template: 'modern'`). */
export type ModernPage1 = {
  /** Rótulo do botão superior direito (ex.: GET IN TOUCH). */
  contactButtonLabel: string
  /** Texto exibido à esquerda (ex.: @MARCA.STUDIO). */
  leftHandle: string
  leftUrl: string
  rightHandle: string
  rightUrl: string
  /** Frase central; use Enter para duas linhas (ex.: MOTION DESIGN + STUDIO). */
  heroTagline: string
}

export const DEFAULT_MODERN_PAGE1: ModernPage1 = {
  contactButtonLabel: 'GET IN TOUCH',
  leftHandle: '@SUA.MARCA',
  leftUrl: '',
  rightHandle: '@SUA.MARCA',
  rightUrl: '',
  heroTagline: 'MOTION DESIGN\nSTUDIO',
}

/** Página 2 — imagem em destaque + faixa com 8 palavras-chave. */
export type ModernPage2 = {
  imageUrl: string | null
  /** Oito palavras exibidas na faixa inferior (maiúsculas na UI). */
  keywords: [string, string, string, string, string, string, string, string]
}

export const DEFAULT_MODERN_PAGE2: ModernPage2 = {
  imageUrl: null,
  keywords: ['A', 'COLLECTIVE', 'OF', 'THE', 'BEST', 'INDEPENDENT', 'PREMIUM', 'PUBLISHERS'],
}

function ensureEightKeywords(arr: unknown): ModernPage2['keywords'] {
  const d = DEFAULT_MODERN_PAGE2.keywords
  if (!Array.isArray(arr)) return [...d] as ModernPage2['keywords']
  const a = arr.filter((x): x is string => typeof x === 'string').map((x) => x.trim())
  const out: string[] = []
  for (let i = 0; i < 8; i++) out.push(a[i] ?? d[i])
  return out as ModernPage2['keywords']
}

export function mergeModernPage2(raw: unknown): ModernPage2 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage2>) : {}
  return {
    imageUrl: typeof o.imageUrl === 'string' && o.imageUrl.trim().length > 0 ? o.imageUrl.trim() : null,
    keywords: ensureEightKeywords(o.keywords),
  }
}

/** Página 3 — título vermelho + carrossel de imagens (3 obrigatórias, até 4). */
export type ModernPage3 = {
  headline: string
  carouselImages: string[]
}

export const DEFAULT_MODERN_PAGE3: ModernPage3 = {
  headline: "OUR 50+ INDEPENDENT PUBLISHERS' DNA",
  carouselImages: [],
}

const MAX_MODERN_CAROUSEL = 4

function ensureModernCarouselImages(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, MAX_MODERN_CAROUSEL)
}

/** Editor: 4 posições; persistem só URLs preenchidas (máx. 4). */
export function modernCarouselToFour(urls: string[]): (string | undefined)[] {
  return Array.from({ length: MAX_MODERN_CAROUSEL }, (_, i) => {
    const u = urls[i]
    return typeof u === 'string' && u.trim() ? u.trim() : undefined
  })
}

export function modernCarouselFromFour(four: (string | undefined)[]): string[] {
  return four.filter((x): x is string => Boolean(x && String(x).trim())).map((x) => x!.trim())
}

export function mergeModernPage3(raw: unknown): ModernPage3 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage3>) : {}
  return {
    headline: typeof o.headline === 'string' ? o.headline : DEFAULT_MODERN_PAGE3.headline,
    carouselImages: ensureModernCarouselImages(o.carouselImages),
  }
}

/** Uma linha persistida por plano (página 4). */
export type ModernPage4PlanRowStored = {
  planId: string
  /** Título grande à esquerda (ex.: SIMPLE LOGISTICS). */
  headline: string
  /** Subtítulo (ex.: DIGITAL PLATFORM). */
  subline: string
  /**
   * Imagem da vitrine: ausente = usar imagem do plano (secção Planos);
   * string = URL própria; `null` = sem imagem (ignora foto do plano).
   */
  imageOverride?: string | null
}

/** Linha resolvida para UI (imagem final). */
export type ModernPage4PlanRowView = {
  planId: string
  headline: string
  subline: string
  imageUrl: string | null
}

/** Página 4 — vitrine de planos (fundo escuro). */
export type ModernPage4 = {
  /** Rótulo superior (ex.: NOSSOS PLANOS). */
  eyebrow: string
  /** Título principal em destaque (várias linhas com Enter). */
  sectionTitle: string
  planRows: ModernPage4PlanRowStored[]
}

export const DEFAULT_MODERN_PAGE4_EYEBROW = 'NOSSOS PLANOS'
export const DEFAULT_MODERN_PAGE4_TITLE = 'OUR RECENT\nPROJECTS'

export const DEFAULT_MODERN_PAGE4: ModernPage4 = {
  eyebrow: DEFAULT_MODERN_PAGE4_EYEBROW,
  sectionTitle: DEFAULT_MODERN_PAGE4_TITLE,
  planRows: [],
}

type PlanLike = { id: string; name: string; description: string; image?: string | null }

function parseStoredPlanRows(raw: unknown): ModernPage4PlanRowStored[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .map((r) => {
      const planId = typeof r.planId === 'string' ? r.planId : ''
      const headline = typeof r.headline === 'string' ? r.headline : ''
      const subline = typeof r.subline === 'string' ? r.subline : ''
      const legacyUrl =
        typeof r.imageUrl === 'string' && r.imageUrl.trim().length > 0 ? r.imageUrl.trim() : undefined
      const row: ModernPage4PlanRowStored = { planId, headline, subline }
      if ('imageOverride' in r) {
        if (r.imageOverride === null) row.imageOverride = null
        else if (typeof r.imageOverride === 'string' && r.imageOverride.trim())
          row.imageOverride = r.imageOverride.trim()
      } else if (legacyUrl) {
        row.imageOverride = legacyUrl
      }
      return row
    })
    .filter((r) => r.planId.length > 0)
}

function resolveRowImage(prev: ModernPage4PlanRowStored | undefined, planImg: string | null): string | null {
  if (!prev || !Object.prototype.hasOwnProperty.call(prev, 'imageOverride')) {
    return planImg
  }
  const io = prev.imageOverride
  if (io === null) return null
  if (typeof io === 'string' && io.trim()) return io.trim()
  return planImg
}

/** Alinha linhas com os planos atuais e resolve imagem (plano ou override). */
export function mergeModernPage4(
  raw: unknown,
  plans: PlanLike[]
): Omit<ModernPage4, 'planRows'> & { planRows: ModernPage4PlanRowView[] } {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage4>) : {}
  const eyebrow =
    typeof o.eyebrow === 'string' && o.eyebrow.trim() ? o.eyebrow.trim() : DEFAULT_MODERN_PAGE4_EYEBROW
  const sectionTitle =
    typeof o.sectionTitle === 'string' ? o.sectionTitle : DEFAULT_MODERN_PAGE4_TITLE
  const prevRows = parseStoredPlanRows(o.planRows)
  const byId = new Map(prevRows.map((r) => [r.planId, r]))

  const planRows: ModernPage4PlanRowView[] = plans.map((p) => {
    const prev = byId.get(p.id)
    const planImg = p.image && String(p.image).trim() ? String(p.image).trim() : null
    return {
      planId: p.id,
      headline: (prev?.headline?.trim() || p.name || 'Plano').trim(),
      subline: typeof prev?.subline === 'string' ? prev.subline : '',
      imageUrl: resolveRowImage(prev, planImg),
    }
  })

  return { eyebrow, sectionTitle, planRows }
}

/** Página 5 — sobre nós + três marcas/parceiros. */
export type ModernPage5BrandSlot = {
  imageUrl: string | null
  caption: string
}

export type ModernPage5 = {
  /** Título grande (ex.: SOBRE NÓS). */
  mainTitle: string
  /** Rótulo à esquerda com linha (ex.: NOSSAS CONQUISTAS). */
  eyebrow: string
  /** Texto principal (parágrafo). */
  body: string
  brands: [ModernPage5BrandSlot, ModernPage5BrandSlot, ModernPage5BrandSlot]
}

const EMPTY_BRAND: ModernPage5BrandSlot = { imageUrl: null, caption: '' }

export const DEFAULT_MODERN_PAGE5: ModernPage5 = {
  mainTitle: 'SOBRE NÓS',
  eyebrow: 'NOSSAS CONQUISTAS',
  body:
    'DESDE 2004 ACOMPANHAMOS PROJETOS QUE EXIGEM EXCELÊNCIA. QUEM ESTÁ CONOSCO TEM A GARANTIA DE RECEBER O MELHOR EM CADA ENTREGA.',
  brands: [
    { imageUrl: null, caption: 'SITE OF THE DAY' },
    { imageUrl: null, caption: 'SITE OF THE YEAR' },
    { imageUrl: null, caption: 'UX AWARD' },
  ],
}

function ensureThreeBrands(raw: unknown): ModernPage5['brands'] {
  const d = DEFAULT_MODERN_PAGE5.brands
  if (!Array.isArray(raw)) return [d[0], d[1], d[2]]
  const slots: ModernPage5BrandSlot[] = []
  for (let i = 0; i < 3; i++) {
    const x = raw[i]
    if (!x || typeof x !== 'object') {
      slots.push({ ...EMPTY_BRAND, caption: d[i]?.caption ?? '' })
      continue
    }
    const o = x as Record<string, unknown>
    const imageUrl =
      typeof o.imageUrl === 'string' && o.imageUrl.trim().length > 0 ? o.imageUrl.trim() : null
    const caption = typeof o.caption === 'string' ? o.caption : d[i]?.caption ?? ''
    slots.push({ imageUrl, caption })
  }
  return [slots[0], slots[1], slots[2]]
}

export function mergeModernPage5(raw: unknown): ModernPage5 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage5>) : {}
  return {
    mainTitle:
      typeof o.mainTitle === 'string' && o.mainTitle.trim()
        ? o.mainTitle
        : DEFAULT_MODERN_PAGE5.mainTitle,
    eyebrow:
      typeof o.eyebrow === 'string' && o.eyebrow.trim() ? o.eyebrow.trim() : DEFAULT_MODERN_PAGE5.eyebrow,
    body: typeof o.body === 'string' ? o.body : DEFAULT_MODERN_PAGE5.body,
    brands: ensureThreeBrands(o.brands),
  }
}

/** Página 6 — equipa ou produtos (layout com hover + parallax). */
export type ModernPage6Frame = 'rect' | 'arch'

export type ModernPage6Item = {
  imageUrl: string | null
  /** Nome (pessoa ou produto). */
  line1: string
  /** Cargo ou descrição curta. */
  line2: string
  frame: ModernPage6Frame
}

export type ModernPage6Mode = 'team' | 'products'

export type ModernPage6 = {
  mode: ModernPage6Mode
  title: string
  subtitle: string
  items: ModernPage6Item[]
}

export const MODERN_PAGE6_MIN_ITEMS = 2
export const MODERN_PAGE6_MAX_ITEMS = 6

export const DEFAULT_MODERN_PAGE6: ModernPage6 = {
  mode: 'team',
  title: 'NOSSA EQUIPA',
  subtitle: 'Combinamos expertise e visão de sistema para entregar o melhor em cada projeto.',
  items: [
    { imageUrl: null, line1: '', line2: '', frame: 'rect' },
    { imageUrl: null, line1: '', line2: '', frame: 'arch' },
    { imageUrl: null, line1: '', line2: '', frame: 'rect' },
    { imageUrl: null, line1: '', line2: '', frame: 'rect' },
  ],
}

function parseModernPage6Item(x: unknown, index: number): ModernPage6Item {
  if (!x || typeof x !== 'object') {
    return {
      imageUrl: null,
      line1: '',
      line2: '',
      frame: index === 1 ? 'arch' : 'rect',
    }
  }
  const o = x as Record<string, unknown>
  const imageUrl =
    typeof o.imageUrl === 'string' && o.imageUrl.trim().length > 0 ? o.imageUrl.trim() : null
  const line1 = typeof o.line1 === 'string' ? o.line1 : ''
  const line2 = typeof o.line2 === 'string' ? o.line2 : ''
  const frame: ModernPage6Frame = o.frame === 'arch' ? 'arch' : 'rect'
  return { imageUrl, line1, line2, frame }
}

export function mergeModernPage6(raw: unknown): ModernPage6 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage6>) : {}
  const mode: ModernPage6Mode = o.mode === 'products' ? 'products' : 'team'
  const title =
    typeof o.title === 'string' && o.title.trim() ? o.title.trim() : DEFAULT_MODERN_PAGE6.title
  const subtitle = typeof o.subtitle === 'string' ? o.subtitle : DEFAULT_MODERN_PAGE6.subtitle
  let items: ModernPage6Item[] = Array.isArray(o.items)
    ? o.items.slice(0, MODERN_PAGE6_MAX_ITEMS).map((x, i) => parseModernPage6Item(x, i))
    : []
  if (items.length === 0) {
    items = DEFAULT_MODERN_PAGE6.items.map((it) => ({ ...it }))
  } else {
    while (items.length < MODERN_PAGE6_MIN_ITEMS) {
      items.push(parseModernPage6Item(null, items.length))
    }
  }
  return { mode, title, subtitle, items }
}

/** Página 7 — recomendações / depoimentos (carrossel horizontal). */
export type ModernPage7Testimonial = {
  clientName: string
  clientRole: string
  /** Nota exibida (ex.: 4.9). */
  ratingScore: number
  /** Número de estrelas preenchidas (1–5). */
  starCount: number
  /** Texto do depoimento (aspas são adicionadas na UI). */
  quote: string
}

export type ModernPage7 = {
  /** Título da secção (ex.: DEPOIMENTOS). */
  sectionTitle: string
  items: ModernPage7Testimonial[]
}

export const MODERN_PAGE7_MAX_ITEMS = 16

export const DEFAULT_MODERN_PAGE7: ModernPage7 = {
  sectionTitle: 'DEPOIMENTOS',
  items: [],
}

function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 5
  return Math.max(0, Math.min(5, n))
}

function clampStars(n: number): number {
  if (!Number.isFinite(n)) return 5
  return Math.max(0, Math.min(5, Math.round(n)))
}

function parseModernPage7Testimonial(x: unknown): ModernPage7Testimonial {
  if (!x || typeof x !== 'object') {
    return {
      clientName: '',
      clientRole: '',
      ratingScore: 5,
      starCount: 5,
      quote: '',
    }
  }
  const o = x as Record<string, unknown>
  const ratingRaw =
    typeof o.ratingScore === 'number'
      ? o.ratingScore
      : typeof o.ratingScore === 'string'
        ? parseFloat(o.ratingScore)
        : NaN
  const starRaw =
    typeof o.starCount === 'number'
      ? o.starCount
      : typeof o.starCount === 'string'
        ? parseInt(o.starCount, 10)
        : NaN
  return {
    clientName: typeof o.clientName === 'string' ? o.clientName : '',
    clientRole: typeof o.clientRole === 'string' ? o.clientRole : '',
    ratingScore: clampRating(ratingRaw),
    starCount: clampStars(starRaw),
    quote: typeof o.quote === 'string' ? o.quote : '',
  }
}

export function mergeModernPage7(raw: unknown): ModernPage7 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage7>) : {}
  const sectionTitle =
    typeof o.sectionTitle === 'string' && o.sectionTitle.trim()
      ? o.sectionTitle.trim()
      : DEFAULT_MODERN_PAGE7.sectionTitle
  const items: ModernPage7Testimonial[] = Array.isArray(o.items)
    ? o.items.slice(0, MODERN_PAGE7_MAX_ITEMS).map((x) => parseModernPage7Testimonial(x))
    : []
  return { sectionTitle, items }
}

/** Página 8 — rodapé escuro (redes, links, contato, marca). */
export type ModernPage8SocialPlatform =
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'dribbble'
  | 'github'
  | 'whatsapp'
  | 'tiktok'
  | 'behance'
  | 'other'

export type ModernPage8SocialLink = {
  platform: ModernPage8SocialPlatform
  url: string
  /** Quando `platform === 'other'`, rótulo curto para acessibilidade. */
  customLabel?: string
}

export type ModernPage8ClickableLink = {
  label: string
  url: string
}

export type ModernPage8 = {
  socialColumnTitle: string
  socialLinks: ModernPage8SocialLink[]
  /** Título da coluna central (padrão: LINKS CLICÁVEIS). */
  linksColumnTitle: string
  clickableLinks: ModernPage8ClickableLink[]
  contactColumnTitle: string
  contactEmail: string
  contactPhone: string
  contactAddress: string
  /** Nome em destaque no rodapé (várias linhas com Enter). */
  footerBrandText: string
  copyrightLine: string
  termsLabel: string
  termsUrl: string
  privacyLabel: string
  privacyUrl: string
}

export const MODERN_PAGE8_MAX_SOCIAL = 8
export const MODERN_PAGE8_MAX_CLICKABLE = 12

type CompanyLike = {
  name?: string
  email?: string
  phone?: string
  address?: string
}

const DEFAULT_SOCIAL_PLATFORM: ModernPage8SocialPlatform = 'instagram'

function parseSocialPlatform(x: unknown): ModernPage8SocialPlatform {
  const s = typeof x === 'string' ? x : ''
  const allowed: ModernPage8SocialPlatform[] = [
    'facebook',
    'twitter',
    'instagram',
    'linkedin',
    'youtube',
    'dribbble',
    'github',
    'whatsapp',
    'tiktok',
    'behance',
    'other',
  ]
  return (allowed.includes(s as ModernPage8SocialPlatform) ? s : DEFAULT_SOCIAL_PLATFORM) as ModernPage8SocialPlatform
}

function parseModernPage8Social(x: unknown): ModernPage8SocialLink {
  if (!x || typeof x !== 'object') {
    return { platform: DEFAULT_SOCIAL_PLATFORM, url: '', customLabel: '' }
  }
  const o = x as Record<string, unknown>
  return {
    platform: parseSocialPlatform(o.platform),
    url: typeof o.url === 'string' ? o.url : '',
    customLabel: typeof o.customLabel === 'string' ? o.customLabel : '',
  }
}

function parseModernPage8Clickable(x: unknown): ModernPage8ClickableLink {
  if (!x || typeof x !== 'object') {
    return { label: '', url: '' }
  }
  const o = x as Record<string, unknown>
  return {
    label: typeof o.label === 'string' ? o.label : '',
    url: typeof o.url === 'string' ? o.url : '',
  }
}

export function mergeModernPage8(raw: unknown, company?: CompanyLike): ModernPage8 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage8>) : {}
  const coName = company?.name?.trim() || ''
  const year = new Date().getFullYear()
  const hasSocialKey = Boolean(raw && typeof raw === 'object' && 'socialLinks' in (raw as object))
  const hasClickableKey = Boolean(raw && typeof raw === 'object' && 'clickableLinks' in (raw as object))

  const socialColumnTitle =
    typeof o.socialColumnTitle === 'string' && o.socialColumnTitle.trim()
      ? o.socialColumnTitle.trim()
      : 'REDES SOCIAIS'

  const linksColumnTitle =
    typeof o.linksColumnTitle === 'string' && o.linksColumnTitle.trim()
      ? o.linksColumnTitle.trim()
      : 'LINKS CLICÁVEIS'

  const socialLinks: ModernPage8SocialLink[] =
    hasSocialKey && Array.isArray(o.socialLinks)
      ? o.socialLinks.slice(0, MODERN_PAGE8_MAX_SOCIAL).map((x) => parseModernPage8Social(x))
      : !hasSocialKey
        ? Array.from({ length: 4 }, () => ({
            platform: DEFAULT_SOCIAL_PLATFORM,
            url: '',
            customLabel: '',
          }))
        : []

  const clickableLinks: ModernPage8ClickableLink[] =
    hasClickableKey && Array.isArray(o.clickableLinks)
      ? o.clickableLinks.slice(0, MODERN_PAGE8_MAX_CLICKABLE).map((x) => parseModernPage8Clickable(x))
      : []

  const contactColumnTitle =
    typeof o.contactColumnTitle === 'string' && o.contactColumnTitle.trim()
      ? o.contactColumnTitle.trim()
      : 'CONTATO'

  const contactEmail =
    typeof o.contactEmail === 'string' ? o.contactEmail : (company?.email ?? '')
  const contactPhone =
    typeof o.contactPhone === 'string' ? o.contactPhone : (company?.phone ?? '')
  const contactAddress =
    typeof o.contactAddress === 'string' ? o.contactAddress : (company?.address ?? '')

  const footerBrandText =
    typeof o.footerBrandText === 'string' && o.footerBrandText.trim()
      ? o.footerBrandText
      : (coName ? coName.toUpperCase() : 'SUA EMPRESA')

  const copyrightLine =
    typeof o.copyrightLine === 'string' && o.copyrightLine.trim()
      ? o.copyrightLine.trim()
      : `©${year} ${coName || 'Sua empresa'}.`

  const termsLabel = typeof o.termsLabel === 'string' && o.termsLabel.trim() ? o.termsLabel.trim() : 'Termos'
  const termsUrl = typeof o.termsUrl === 'string' ? o.termsUrl : ''
  const privacyLabel =
    typeof o.privacyLabel === 'string' && o.privacyLabel.trim() ? o.privacyLabel.trim() : 'Privacidade'
  const privacyUrl = typeof o.privacyUrl === 'string' ? o.privacyUrl : ''

  return {
    socialColumnTitle,
    socialLinks,
    linksColumnTitle,
    clickableLinks,
    contactColumnTitle,
    contactEmail,
    contactPhone,
    contactAddress,
    footerBrandText,
    copyrightLine,
    termsLabel,
    termsUrl,
    privacyLabel,
    privacyUrl,
  }
}

/** Normaliza o que vai para o JSON: uma linha por plano + overrides explícitos. */
export function ensureModernPage4Stored(raw: unknown, plans: PlanLike[]): ModernPage4 {
  const merged = mergeModernPage4(raw, plans)
  return {
    eyebrow: merged.eyebrow,
    sectionTitle: merged.sectionTitle,
    planRows: merged.planRows.map((rv) => {
      const p = plans.find((x) => x.id === rv.planId)
      const planImg = p?.image && String(p.image).trim() ? String(p.image).trim() : null
      const st: ModernPage4PlanRowStored = {
        planId: rv.planId,
        headline: rv.headline,
        subline: rv.subline,
      }
      if (rv.imageUrl === null && planImg) {
        st.imageOverride = null
      } else if (rv.imageUrl && rv.imageUrl !== planImg) {
        st.imageOverride = rv.imageUrl
      }
      return st
    }),
  }
}

export function mergeModernPage1(raw: unknown): ModernPage1 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ModernPage1>) : {}
  return {
    contactButtonLabel:
      typeof o.contactButtonLabel === 'string' && o.contactButtonLabel.trim()
        ? o.contactButtonLabel.trim()
        : DEFAULT_MODERN_PAGE1.contactButtonLabel,
    leftHandle: typeof o.leftHandle === 'string' && o.leftHandle.trim() ? o.leftHandle : DEFAULT_MODERN_PAGE1.leftHandle,
    leftUrl: typeof o.leftUrl === 'string' ? o.leftUrl : '',
    rightHandle:
      typeof o.rightHandle === 'string' && o.rightHandle.trim() ? o.rightHandle : DEFAULT_MODERN_PAGE1.rightHandle,
    rightUrl: typeof o.rightUrl === 'string' ? o.rightUrl : '',
    heroTagline: typeof o.heroTagline === 'string' ? o.heroTagline : DEFAULT_MODERN_PAGE1.heroTagline,
  }
}
