/** Hero neon escuro — modelo Executiva (`template: 'executive'`). */

export type ExecutiveNeonAccent = 'blue' | 'orange' | 'red' | 'white'

export type ExecutivePage1 = {
  /** Cor do brilho neon e do botão principal */
  neonAccent: ExecutiveNeonAccent
  /** Ex.: 4.9/5 */
  ratingLabel: string
  /** Parágrafo abaixo do título (logo ou nome) */
  heroDescription: string
  /** Texto acima do carrossel de marcas */
  trustedByText: string
  /** Link do botão NOSSOS PRODUTOS (vazio = rola para o conteúdo da proposta) */
  productsButtonUrl: string
  /** Link do botão CONTATO */
  contactButtonUrl: string
  /** Até 6 URLs de logos (carrossel minimalista) */
  brandLogos: string[]
}

export const MAX_EXECUTIVE_BRAND_LOGOS = 6

export const DEFAULT_EXECUTIVE_PAGE1: ExecutivePage1 = {
  neonAccent: 'blue',
  ratingLabel: '4.9/5',
  heroDescription:
    'Gerencie, monitore e proteja seus projetos — tudo em um painel poderoso. Insights em tempo real, suporte dedicado e processos pensados para o seu negócio.',
  trustedByText: 'Confiado por milhares de profissionais para apresentar propostas que convertem.',
  productsButtonUrl: '',
  contactButtonUrl: '',
  brandLogos: [],
}

function ensureBrandLogos(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, MAX_EXECUTIVE_BRAND_LOGOS)
}

function ensureNeonAccent(raw: unknown): ExecutiveNeonAccent {
  if (raw === 'orange' || raw === 'red' || raw === 'white' || raw === 'blue') return raw
  return 'blue'
}

export function mergeExecutivePage1(raw: unknown): ExecutivePage1 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutivePage1>) : {}
  return {
    neonAccent: ensureNeonAccent(o.neonAccent),
    ratingLabel:
      typeof o.ratingLabel === 'string' && o.ratingLabel.trim() ? o.ratingLabel.trim() : DEFAULT_EXECUTIVE_PAGE1.ratingLabel,
    heroDescription:
      typeof o.heroDescription === 'string' && o.heroDescription.trim()
        ? o.heroDescription.trim()
        : DEFAULT_EXECUTIVE_PAGE1.heroDescription,
    trustedByText:
      typeof o.trustedByText === 'string' && o.trustedByText.trim()
        ? o.trustedByText.trim()
        : DEFAULT_EXECUTIVE_PAGE1.trustedByText,
    productsButtonUrl: typeof o.productsButtonUrl === 'string' ? o.productsButtonUrl.trim() : '',
    contactButtonUrl: typeof o.contactButtonUrl === 'string' ? o.contactButtonUrl.trim() : '',
    brandLogos: ensureBrandLogos(o.brandLogos),
  }
}

/** RGB para sombras e gradientes CSS */
export function executiveNeonRgb(accent: ExecutiveNeonAccent): string {
  switch (accent) {
    case 'orange':
      return '255, 122, 61'
    case 'red':
      return '255, 71, 87'
    case 'white':
      return '255, 255, 255'
    default:
      return '0, 209, 255'
  }
}

/** Seis slots para o editor (URLs opcionais). */
export function executiveBrandSlots(urls: string[]): (string | undefined)[] {
  return Array.from({ length: MAX_EXECUTIVE_BRAND_LOGOS }, (_, i) => {
    const u = urls[i]
    return typeof u === 'string' && u.trim() ? u.trim() : undefined
  })
}

export function executiveBrandLogosFromSlots(slots: (string | undefined)[]): string[] {
  return slots
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, MAX_EXECUTIVE_BRAND_LOGOS)
}

export function executiveNeonHex(accent: ExecutiveNeonAccent): string {
  switch (accent) {
    case 'orange':
      return '#FF7A3D'
    case 'red':
      return '#FF4757'
    case 'white':
      return '#FFFFFF'
    default:
      return '#00D1FF'
  }
}

/** Depoimento na página 2 (Executiva). Índices pares → coluna sobe; ímpares → desce. */
export type ExecutiveTestimonial = {
  /** 1–5 estrelas preenchidas */
  starCount: number
  /** Ex.: 4.9/5 */
  ratingLabel: string
  quote: string
  name: string
  /** Ex.: CEO da Empresa X */
  role: string
  photoUrl: string | null
}

export type ExecutivePage2 = {
  /** Texto antes do número (ex.: “Veja nossas” / “See our”) */
  reviewsLead: string
  /** Quantidade / número exibido (ex.: 436) */
  reviewsCount: string
  /** Texto após o número (ex.: “avaliações no”) — o selo Trustpilot é opcional abaixo */
  reviewsTrail: string
  /** Exibe estrela verde + “Trustpilot” após a linha de avaliações */
  showTrustpilotBadge: boolean
  sectionTitle: string
  sectionDescription: string
  /** Sempre 8 entradas; colunas 0,2,4,6 e 1,3,5,7 */
  testimonials: ExecutiveTestimonial[]
  showBackToTop: boolean
}

export const EXECUTIVE_TESTIMONIAL_SLOTS = 8

const DEFAULT_TESTIMONIAL: ExecutiveTestimonial = {
  starCount: 5,
  ratingLabel: '5.0/5',
  quote: '',
  name: '',
  role: '',
  photoUrl: null,
}

export const DEFAULT_EXECUTIVE_PAGE2: ExecutivePage2 = {
  reviewsLead: 'Veja nossas',
  reviewsCount: '436',
  reviewsTrail: 'avaliações no',
  showTrustpilotBadge: true,
  sectionTitle: 'Confiado por clientes em todo o mundo',
  sectionDescription:
    'Milhares de profissionais confiam em nós para entregar resultados com clareza e segurança.',
  testimonials: Array.from({ length: EXECUTIVE_TESTIMONIAL_SLOTS }, () => ({ ...DEFAULT_TESTIMONIAL })),
  showBackToTop: true,
}

function clampStarCount(n: unknown): number {
  const x = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(x)) return 5
  return Math.min(5, Math.max(1, Math.round(x)))
}

function mergeTestimonial(raw: unknown): ExecutiveTestimonial {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutiveTestimonial>) : {}
  const photoUrl = typeof o.photoUrl === 'string' && o.photoUrl.trim() ? o.photoUrl.trim() : null
  return {
    starCount: clampStarCount(o.starCount),
    ratingLabel:
      typeof o.ratingLabel === 'string' && o.ratingLabel.trim()
        ? o.ratingLabel.trim()
        : DEFAULT_TESTIMONIAL.ratingLabel,
    quote: typeof o.quote === 'string' ? o.quote : '',
    name: typeof o.name === 'string' ? o.name : '',
    role: typeof o.role === 'string' ? o.role : '',
    photoUrl,
  }
}

function ensureEightTestimonials(arr: unknown): ExecutiveTestimonial[] {
  const list = Array.isArray(arr) ? arr.map(mergeTestimonial) : []
  const out = [...list]
  while (out.length < EXECUTIVE_TESTIMONIAL_SLOTS) {
    out.push({ ...DEFAULT_TESTIMONIAL })
  }
  return out.slice(0, EXECUTIVE_TESTIMONIAL_SLOTS)
}

export function mergeExecutivePage2(raw: unknown): ExecutivePage2 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutivePage2>) : {}
  return {
    reviewsLead:
      typeof o.reviewsLead === 'string' && o.reviewsLead.trim()
        ? o.reviewsLead.trim()
        : DEFAULT_EXECUTIVE_PAGE2.reviewsLead,
    reviewsCount:
      typeof o.reviewsCount === 'string' && o.reviewsCount.trim()
        ? o.reviewsCount.trim()
        : DEFAULT_EXECUTIVE_PAGE2.reviewsCount,
    reviewsTrail:
      typeof o.reviewsTrail === 'string' && o.reviewsTrail.trim()
        ? o.reviewsTrail.trim()
        : DEFAULT_EXECUTIVE_PAGE2.reviewsTrail,
    showTrustpilotBadge:
      typeof o.showTrustpilotBadge === 'boolean' ? o.showTrustpilotBadge : DEFAULT_EXECUTIVE_PAGE2.showTrustpilotBadge,
    sectionTitle:
      typeof o.sectionTitle === 'string' && o.sectionTitle.trim()
        ? o.sectionTitle.trim()
        : DEFAULT_EXECUTIVE_PAGE2.sectionTitle,
    sectionDescription:
      typeof o.sectionDescription === 'string' && o.sectionDescription.trim()
        ? o.sectionDescription.trim()
        : DEFAULT_EXECUTIVE_PAGE2.sectionDescription,
    testimonials: ensureEightTestimonials(o.testimonials),
    showBackToTop: typeof o.showBackToTop === 'boolean' ? o.showBackToTop : DEFAULT_EXECUTIVE_PAGE2.showBackToTop,
  }
}

/** Slots fixos para o editor (sempre 8). */
export function executiveTestimonialSlotsForEditor(list: ExecutiveTestimonial[]): ExecutiveTestimonial[] {
  return ensureEightTestimonials(list)
}

/** Página 3 — planos em fundo escuro + neon (Executiva). */
export type ExecutivePage3 = {
  sectionTitle: string
  sectionDescription: string
  /** Texto do link abaixo do botão (ex.: ver cobrança anual) */
  yearlyBillingLabel: string
  yearlyBillingUrl: string
}

export const DEFAULT_EXECUTIVE_PAGE3: ExecutivePage3 = {
  sectionTitle: 'Comece grátis, escale com confiança',
  sectionDescription:
    'Esteja começando agora ou gerindo operações maiores — há um plano alinhado à sua jornada.',
  yearlyBillingLabel: 'Ver cobrança anual',
  yearlyBillingUrl: '',
}

export function mergeExecutivePage3(raw: unknown): ExecutivePage3 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutivePage3>) : {}
  return {
    sectionTitle:
      typeof o.sectionTitle === 'string' && o.sectionTitle.trim()
        ? o.sectionTitle.trim()
        : DEFAULT_EXECUTIVE_PAGE3.sectionTitle,
    sectionDescription:
      typeof o.sectionDescription === 'string' && o.sectionDescription.trim()
        ? o.sectionDescription.trim()
        : DEFAULT_EXECUTIVE_PAGE3.sectionDescription,
    yearlyBillingLabel:
      typeof o.yearlyBillingLabel === 'string' && o.yearlyBillingLabel.trim()
        ? o.yearlyBillingLabel.trim()
        : DEFAULT_EXECUTIVE_PAGE3.yearlyBillingLabel,
    yearlyBillingUrl: typeof o.yearlyBillingUrl === 'string' ? o.yearlyBillingUrl.trim() : '',
  }
}

export type ExecutiveFaqItem = {
  question: string
  answer: string
}

/** Página 4 — FAQ em acordeão (Executiva). */
export type ExecutivePage4 = {
  sectionTitle: string
  sectionSubtitle: string
  /** Até 5 pares pergunta/resposta */
  faqItems: ExecutiveFaqItem[]
  ctaButtonLabel: string
  /** WhatsApp só com dígitos (DDI+DDD+número). Vazio = usa telefone da empresa na proposta. */
  whatsappPhone: string
}

export const EXECUTIVE_FAQ_SLOTS = 5

const DEFAULT_FAQ_ITEM: ExecutiveFaqItem = { question: '', answer: '' }

export const DEFAULT_EXECUTIVE_PAGE4: ExecutivePage4 = {
  sectionTitle: 'PERGUNTAS FREQUENTES',
  sectionSubtitle: 'Da contratação à entrega, esclarecemos o essencial antes de você decidir.',
  faqItems: Array.from({ length: EXECUTIVE_FAQ_SLOTS }, () => ({ ...DEFAULT_FAQ_ITEM })),
  ctaButtonLabel: 'AINDA TEM DÚVIDAS?',
  whatsappPhone: '',
}

function mergeFaqItem(raw: unknown): ExecutiveFaqItem {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutiveFaqItem>) : {}
  return {
    question: typeof o.question === 'string' ? o.question : '',
    answer: typeof o.answer === 'string' ? o.answer : '',
  }
}

function ensureFiveFaqItems(arr: unknown): ExecutiveFaqItem[] {
  const list = Array.isArray(arr) ? arr.map(mergeFaqItem) : []
  const out = [...list]
  while (out.length < EXECUTIVE_FAQ_SLOTS) out.push({ ...DEFAULT_FAQ_ITEM })
  return out.slice(0, EXECUTIVE_FAQ_SLOTS)
}

export function mergeExecutivePage4(raw: unknown): ExecutivePage4 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutivePage4>) : {}
  return {
    sectionTitle:
      typeof o.sectionTitle === 'string' && o.sectionTitle.trim()
        ? o.sectionTitle.trim()
        : DEFAULT_EXECUTIVE_PAGE4.sectionTitle,
    sectionSubtitle:
      typeof o.sectionSubtitle === 'string' && o.sectionSubtitle.trim()
        ? o.sectionSubtitle.trim()
        : DEFAULT_EXECUTIVE_PAGE4.sectionSubtitle,
    faqItems: ensureFiveFaqItems(o.faqItems),
    ctaButtonLabel:
      typeof o.ctaButtonLabel === 'string' && o.ctaButtonLabel.trim()
        ? o.ctaButtonLabel.trim()
        : DEFAULT_EXECUTIVE_PAGE4.ctaButtonLabel,
    whatsappPhone: typeof o.whatsappPhone === 'string' ? o.whatsappPhone.replace(/\D/g, '') : '',
  }
}

export function executiveFaqSlotsForEditor(list: ExecutiveFaqItem[]): ExecutiveFaqItem[] {
  return ensureFiveFaqItems(list)
}

/** Página 5 — Por que nos escolher (até 8 cards) */
export const EXECUTIVE_WHY_CARD_SLOTS = 8

export type ExecutiveWhyCard = {
  iconKey: string
  title: string
  description: string
}

export type ExecutivePage5 = {
  sectionTitle: string
  cards: ExecutiveWhyCard[]
}

const DEFAULT_WHY_CARD: ExecutiveWhyCard = {
  iconKey: 'sparkles',
  title: '',
  description: '',
}

export const DEFAULT_EXECUTIVE_PAGE5: ExecutivePage5 = {
  sectionTitle: 'POR QUE NOS ESCOLHER?',
  cards: [
    {
      iconKey: 'trending-up',
      title: 'Para quem exige agilidade',
      description: 'Menos dispersão: organize tarefas, documentos e comunicação num só lugar.',
    },
    {
      iconKey: 'shield',
      title: 'Confiança e clareza',
      description: 'Veja o que importa com transparência e tome decisões com mais segurança.',
    },
    {
      iconKey: 'globe',
      title: 'Alcance amplo',
      description: 'Um hub unificado para o seu negócio, onde quer que você atue.',
    },
    {
      iconKey: 'bot',
      title: 'Menos trabalho manual',
      description: 'Automatize alertas e rotinas para focar no que realmente gera valor.',
    },
    ...Array.from({ length: EXECUTIVE_WHY_CARD_SLOTS - 4 }, () => ({ ...DEFAULT_WHY_CARD })),
  ],
}

function mergeWhyCard(raw: unknown): ExecutiveWhyCard {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutiveWhyCard>) : {}
  const iconKey =
    typeof o.iconKey === 'string' && o.iconKey.trim() ? o.iconKey.trim() : DEFAULT_WHY_CARD.iconKey
  return {
    iconKey,
    title: typeof o.title === 'string' ? o.title : '',
    description: typeof o.description === 'string' ? o.description : '',
  }
}

function ensureEightWhyCards(arr: unknown): ExecutiveWhyCard[] {
  const list = Array.isArray(arr) ? arr.map(mergeWhyCard) : []
  const out = [...list]
  while (out.length < EXECUTIVE_WHY_CARD_SLOTS) out.push({ ...DEFAULT_WHY_CARD })
  return out.slice(0, EXECUTIVE_WHY_CARD_SLOTS)
}

export function mergeExecutivePage5(raw: unknown): ExecutivePage5 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutivePage5>) : {}
  return {
    sectionTitle:
      typeof o.sectionTitle === 'string' && o.sectionTitle.trim()
        ? o.sectionTitle.trim()
        : DEFAULT_EXECUTIVE_PAGE5.sectionTitle,
    cards: ensureEightWhyCards(o.cards),
  }
}

export function executiveWhyCardsForEditor(list: ExecutiveWhyCard[]): ExecutiveWhyCard[] {
  return ensureEightWhyCards(list)
}

/** Página 6 — Contato + rodapé neon */
export const EXECUTIVE_CONTACT_TRUST_LINES = 3

export type ExecutivePage6 = {
  title: string
  subtitle: string
  plansButtonLabel: string
  whatsappButtonLabel: string
  whatsappPhone: string
  trustLines: [string, string, string]
  footerTagline: string
  /** Vazio na proposta = usa endereço da empresa */
  footerAddress: string
  /** Vazio na proposta = usa documento (CNPJ) da empresa */
  footerCnpj: string
  socialInstagram: string
  socialFacebook: string
  socialLinkedin: string
  socialYoutube: string
  socialTwitter: string
  socialWebsite: string
}

const DEFAULT_TRUST: [string, string, string] = [
  'Sem complicação para começar',
  'Atendimento humano quando precisar',
  'Processos pensados para o seu negócio',
]

export const DEFAULT_EXECUTIVE_PAGE6: ExecutivePage6 = {
  title: 'FALE CONOSCO',
  subtitle:
    'Estamos prontos para ajudar você a dar o próximo passo com clareza, suporte dedicado e soluções sob medida.',
  plansButtonLabel: 'VER PLANOS',
  whatsappButtonLabel: 'WHATSAPP',
  whatsappPhone: '',
  trustLines: [...DEFAULT_TRUST],
  footerTagline: 'Propostas e fechamentos com visual profissional.',
  footerAddress: '',
  footerCnpj: '',
  socialInstagram: '',
  socialFacebook: '',
  socialLinkedin: '',
  socialYoutube: '',
  socialTwitter: '',
  socialWebsite: '',
}

function ensureThreeTrustLines(raw: unknown): [string, string, string] {
  const list = Array.isArray(raw) ? raw.map((x) => (typeof x === 'string' ? x : '')) : []
  const slot = (i: number) => {
    if (i < list.length) return list[i]!.trim()
    return DEFAULT_TRUST[i]!
  }
  return [slot(0), slot(1), slot(2)]
}

export function mergeExecutivePage6(raw: unknown): ExecutivePage6 {
  const o = raw && typeof raw === 'object' ? (raw as Partial<ExecutivePage6>) : {}
  return {
    title:
      typeof o.title === 'string' && o.title.trim() ? o.title.trim() : DEFAULT_EXECUTIVE_PAGE6.title,
    subtitle:
      typeof o.subtitle === 'string' && o.subtitle.trim()
        ? o.subtitle.trim()
        : DEFAULT_EXECUTIVE_PAGE6.subtitle,
    plansButtonLabel:
      typeof o.plansButtonLabel === 'string' && o.plansButtonLabel.trim()
        ? o.plansButtonLabel.trim()
        : DEFAULT_EXECUTIVE_PAGE6.plansButtonLabel,
    whatsappButtonLabel:
      typeof o.whatsappButtonLabel === 'string' && o.whatsappButtonLabel.trim()
        ? o.whatsappButtonLabel.trim()
        : DEFAULT_EXECUTIVE_PAGE6.whatsappButtonLabel,
    whatsappPhone: typeof o.whatsappPhone === 'string' ? o.whatsappPhone.replace(/\D/g, '') : '',
    trustLines: ensureThreeTrustLines(o.trustLines),
    footerTagline:
      typeof o.footerTagline === 'string' && o.footerTagline.trim()
        ? o.footerTagline.trim()
        : DEFAULT_EXECUTIVE_PAGE6.footerTagline,
    footerAddress: typeof o.footerAddress === 'string' ? o.footerAddress.trim() : '',
    footerCnpj: typeof o.footerCnpj === 'string' ? o.footerCnpj.trim() : '',
    socialInstagram: typeof o.socialInstagram === 'string' ? o.socialInstagram.trim() : '',
    socialFacebook: typeof o.socialFacebook === 'string' ? o.socialFacebook.trim() : '',
    socialLinkedin: typeof o.socialLinkedin === 'string' ? o.socialLinkedin.trim() : '',
    socialYoutube: typeof o.socialYoutube === 'string' ? o.socialYoutube.trim() : '',
    socialTwitter: typeof o.socialTwitter === 'string' ? o.socialTwitter.trim() : '',
    socialWebsite: typeof o.socialWebsite === 'string' ? o.socialWebsite.trim() : '',
  }
}
