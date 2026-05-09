export type WakeQuizPillar = { icon: string; label: string }

export type WakeQuizHeroEditSection =
  | 'logo'
  | 'badge'
  | 'title'
  | 'subtitle'
  | 'pillars'
  | 'cta'
  | 'footer'
  | 'result_title'
  | 'result_contact'
  | 'result_whatsapp'
  | 'result_badge'
  | 'result_icon'
  | 'result_stats'
  | 'result_footer'

export type WakeQuizResultStat = {
  icon: string
  label: string
  value: string
  barPct: number
}

export type WakeQuizHeroContent = {
  /** Texto estilo logo quando não há imagem */
  logoText?: string
  /** Altura máxima (px) da imagem da logo — só quando há `wake_quiz_logo_url` */
  logoImageMaxHeightPx?: number
  /** Altura máxima (px) da logo no cabeçalho das perguntas (não afeta a hero) */
  questionHeaderLogoMaxHeightPx?: number
  /** Linha pequena abaixo do logo */
  tagline?: string
  /** Emoji ou carácter para o ícone do badge (ex.: ⚡) */
  badgeIcon?: string
  badgeText?: string
  badgeFontSizePx?: number
  /** Nome lógico da fonte (mapeado em CSS) */
  badgeFontKey?: 'inter' | 'grotesk' | 'poppins' | 'dmSans' | 'playfair'
  badgeBold?: boolean
  badgeItalic?: boolean
  badgeUnderline?: boolean
  badgeTextColor?: string
  titleLine1?: string
  titleLine2?: string
  subtitle?: string
  pillars?: WakeQuizPillar[]
  ctaLabel?: string
  footerIcon?: string
  footerText?: string

  /** Tela final (carregamento + resultado): textos e CTA */
  resultTitleLine1?: string
  resultTitleLine2?: string
  resultSubtitle?: string
  resultContactTitle?: string
  resultContactBody?: string
  whatsappCountry?: 'BR' | 'PT' | 'US' | 'MX' | 'AR' | 'CL' | 'CO'
  whatsappNumber?: string
  whatsappButtonLabel?: string
  whatsappMessage?: string

  resultBadgeIcon?: string
  resultBadgeText?: string
  resultTopIcon?: string
  resultStats?: WakeQuizResultStat[]
  resultAfterWhatsappText?: string
  resultFooterSmallText?: string
}

export const WAKE_QUIZ_HERO_DEFAULTS: WakeQuizHeroContent = {
  logoText: 'SILVA YARIN',
  logoImageMaxHeightPx: 88,
  questionHeaderLogoMaxHeightPx: 44,
  tagline: 'Wake Aceleradora Digital',
  badgeIcon: '⚡',
  badgeText: 'Quiz Exclusivo para Salões • 2 min',
  badgeFontSizePx: 14,
  badgeFontKey: 'grotesk',
  badgeBold: true,
  badgeItalic: false,
  badgeUnderline: false,
  badgeTextColor: '#f97316',
  titleLine1: 'Descubra como',
  titleLine2: 'lotar sua agenda',
  subtitle:
    'Responda em 2 minutos e receba uma estratégia personalizada de marketing para o seu salão de beleza.',
  pillars: [
    { icon: '💈', label: 'Salões' },
    { icon: '🚀', label: 'Crescimento' },
    { icon: '📈', label: 'Resultados' },
  ],
  ctaLabel: 'Quero ter previsibilidade no salão',
  footerIcon: '🎯',
  footerText: '+150 salões já transformados pela Wake',

  resultTitleLine1: 'Montamos um plano exclusivo',
  resultTitleLine2: 'para lotar seu salão 💈',
  resultSubtitle:
    'Com base nas suas respostas, vamos elevar o marketing do seu salão e lotar sua agenda com previsibilidade.',
  resultContactTitle: '📞 Em breve entraremos em contato!',
  resultContactBody:
    'Nossa equipe vai entrar em contato com você em até 24h para marcar nossa reunião gratuita de diagnóstico.',
  whatsappCountry: 'BR',
  whatsappNumber: '',
  whatsappButtonLabel: 'Falar no WhatsApp Agora',
  whatsappMessage:
    'Olá! Acabei de fazer o quiz e quero saber mais sobre como lotar meu salão.',

  resultBadgeIcon: '🎉',
  resultBadgeText: 'Seu plano está pronto!',
  resultTopIcon: '✨',
  resultStats: [
    { icon: '📈', label: 'Potencial de crescimento', value: '+39%', barPct: 86 },
    { icon: '👥', label: 'Novos clientes estimados/mês', value: '30+', barPct: 76 },
    { icon: '⚡', label: 'Tempo para primeiros resultados', value: '30 dias', barPct: 66 },
  ],
  resultAfterWhatsappText: 'Ou aguarde — entraremos em contato em até 24h para marcar sua reunião 📅',
  resultFooterSmallText: '🔒 Seus dados estão seguros',
}

const FONT_STACK: Record<NonNullable<WakeQuizHeroContent['badgeFontKey']>, string> = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  grotesk: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  poppins: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  dmSans: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
}

export function badgeFontStack(key: WakeQuizHeroContent['badgeFontKey']): string {
  const k = key && FONT_STACK[key] ? key : 'grotesk'
  return FONT_STACK[k]
}

export const WAKE_QUIZ_SECTION_LABELS: Record<WakeQuizHeroEditSection, string> = {
  logo: 'Logo',
  badge: 'Faixa (ícone e texto)',
  title: 'Título principal',
  subtitle: 'Subtítulo',
  pillars: 'Três ícones',
  cta: 'Botão laranja',
  footer: 'Rodapé',
  result_title: 'Resultado — título e descrição',
  result_contact: 'Resultado — bloco de contato',
  result_whatsapp: 'Resultado — WhatsApp',
  result_badge: 'Resultado — selo (badge)',
  result_icon: 'Resultado — ícone laranja',
  result_stats: 'Resultado — cards de estatísticas',
  result_footer: 'Resultado — rodapé',
}

export function mergeWakeQuizHero(stored: unknown): WakeQuizHeroContent {
  const base = { ...WAKE_QUIZ_HERO_DEFAULTS }
  if (!stored || typeof stored !== 'object') return base
  const s = stored as Record<string, unknown>
  const pillarsRaw = s.pillars
  let pillars: WakeQuizPillar[] | undefined
  if (Array.isArray(pillarsRaw)) {
    pillars = pillarsRaw
      .map((p) => {
        if (!p || typeof p !== 'object') return null
        const o = p as Record<string, unknown>
        return {
          icon: typeof o.icon === 'string' ? o.icon : '✨',
          label: typeof o.label === 'string' ? o.label : '',
        }
      })
      .filter(Boolean) as WakeQuizPillar[]
    if (pillars.length !== 3) pillars = undefined
  }

  const statsRaw = s.resultStats
  let resultStats: WakeQuizResultStat[] | undefined
  if (Array.isArray(statsRaw)) {
    const parsed = statsRaw
      .map((it) => {
        if (!it || typeof it !== 'object') return null
        const o = it as Record<string, unknown>
        const icon = typeof o.icon === 'string' ? o.icon.slice(0, 8) : '✨'
        const label = typeof o.label === 'string' ? o.label.trim().slice(0, 120) : ''
        const value = typeof o.value === 'string' ? o.value.trim().slice(0, 80) : ''
        const barPct = typeof o.barPct === 'number' && Number.isFinite(o.barPct) ? o.barPct : 70
        if (!label) return null
        return { icon, label, value, barPct: Math.max(0, Math.min(100, Math.round(barPct))) }
      })
      .filter(Boolean) as WakeQuizResultStat[]
    if (parsed.length === 3) resultStats = parsed
  }

  return {
    ...base,
    ...(typeof s.logoText === 'string' ? { logoText: s.logoText } : {}),
    ...(typeof s.logoImageMaxHeightPx === 'number' &&
    !Number.isNaN(s.logoImageMaxHeightPx) &&
    s.logoImageMaxHeightPx >= 40 &&
    s.logoImageMaxHeightPx <= 280
      ? { logoImageMaxHeightPx: Math.round(s.logoImageMaxHeightPx) }
      : {}),
    ...(typeof s.questionHeaderLogoMaxHeightPx === 'number' &&
    !Number.isNaN(s.questionHeaderLogoMaxHeightPx) &&
    s.questionHeaderLogoMaxHeightPx >= 24 &&
    s.questionHeaderLogoMaxHeightPx <= 96
      ? { questionHeaderLogoMaxHeightPx: Math.round(s.questionHeaderLogoMaxHeightPx) }
      : {}),
    ...(typeof s.tagline === 'string' ? { tagline: s.tagline } : {}),
    ...(typeof s.badgeIcon === 'string' ? { badgeIcon: s.badgeIcon } : {}),
    ...(typeof s.badgeText === 'string' ? { badgeText: s.badgeText } : {}),
    ...(typeof s.badgeFontSizePx === 'number' && s.badgeFontSizePx > 8 && s.badgeFontSizePx < 48
      ? { badgeFontSizePx: s.badgeFontSizePx }
      : {}),
    ...(s.badgeFontKey === 'inter' ||
    s.badgeFontKey === 'grotesk' ||
    s.badgeFontKey === 'poppins' ||
    s.badgeFontKey === 'dmSans' ||
    s.badgeFontKey === 'playfair'
      ? { badgeFontKey: s.badgeFontKey }
      : {}),
    ...(typeof s.badgeBold === 'boolean' ? { badgeBold: s.badgeBold } : {}),
    ...(typeof s.badgeItalic === 'boolean' ? { badgeItalic: s.badgeItalic } : {}),
    ...(typeof s.badgeUnderline === 'boolean' ? { badgeUnderline: s.badgeUnderline } : {}),
    ...(typeof s.badgeTextColor === 'string' ? { badgeTextColor: s.badgeTextColor } : {}),
    ...(typeof s.titleLine1 === 'string' ? { titleLine1: s.titleLine1 } : {}),
    ...(typeof s.titleLine2 === 'string' ? { titleLine2: s.titleLine2 } : {}),
    ...(typeof s.subtitle === 'string' ? { subtitle: s.subtitle } : {}),
    ...(pillars ? { pillars } : {}),
    ...(typeof s.ctaLabel === 'string' ? { ctaLabel: s.ctaLabel } : {}),
    ...(typeof s.footerIcon === 'string' ? { footerIcon: s.footerIcon } : {}),
    ...(typeof s.footerText === 'string' ? { footerText: s.footerText } : {}),

    ...(typeof s.resultTitleLine1 === 'string' ? { resultTitleLine1: s.resultTitleLine1 } : {}),
    ...(typeof s.resultTitleLine2 === 'string' ? { resultTitleLine2: s.resultTitleLine2 } : {}),
    ...(typeof s.resultSubtitle === 'string' ? { resultSubtitle: s.resultSubtitle } : {}),
    ...(typeof s.resultContactTitle === 'string' ? { resultContactTitle: s.resultContactTitle } : {}),
    ...(typeof s.resultContactBody === 'string' ? { resultContactBody: s.resultContactBody } : {}),
    ...(s.whatsappCountry === 'BR' ||
    s.whatsappCountry === 'PT' ||
    s.whatsappCountry === 'US' ||
    s.whatsappCountry === 'MX' ||
    s.whatsappCountry === 'AR' ||
    s.whatsappCountry === 'CL' ||
    s.whatsappCountry === 'CO'
      ? { whatsappCountry: s.whatsappCountry }
      : {}),
    ...(typeof s.whatsappNumber === 'string' ? { whatsappNumber: s.whatsappNumber } : {}),
    ...(typeof s.whatsappButtonLabel === 'string' ? { whatsappButtonLabel: s.whatsappButtonLabel } : {}),
    ...(typeof s.whatsappMessage === 'string' ? { whatsappMessage: s.whatsappMessage } : {}),
    ...(typeof s.resultBadgeIcon === 'string' ? { resultBadgeIcon: s.resultBadgeIcon } : {}),
    ...(typeof s.resultBadgeText === 'string' ? { resultBadgeText: s.resultBadgeText } : {}),
    ...(typeof s.resultTopIcon === 'string' ? { resultTopIcon: s.resultTopIcon } : {}),
    ...(resultStats ? { resultStats } : {}),
    ...(typeof s.resultAfterWhatsappText === 'string' ? { resultAfterWhatsappText: s.resultAfterWhatsappText } : {}),
    ...(typeof s.resultFooterSmallText === 'string' ? { resultFooterSmallText: s.resultFooterSmallText } : {}),
  }
}
