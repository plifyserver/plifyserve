/** Tom médio do gradiente de fundo (perguntas do quiz). */
export const WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT = '#fff7ed'
/** Cor de destaque: botão Continuar, opções selecionadas, barra de progresso. */
export const WAKE_QUIZ_DEFAULT_QUIZ_ACCENT = '#f97316'

type Rgb = { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim())
  if (!m) return null
  const h = m[1]
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: Rgb): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** Aceita #RGB ou #RRGGBB; caso inválido devolve `fallback`. */
export function coerceHexColor(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback
  const s = raw.trim()
  const short = /^#([0-9a-fA-F]{3})$/.exec(s)
  if (short) {
    const [a, b, c] = short[1].split('')
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase()
  }
  const long = /^#([0-9a-fA-F]{6})$/.exec(s)
  if (long) return `#${long[1].toLowerCase()}`
  return fallback
}

export function mixHex(from: string, to: string, t: number): string {
  const A = hexToRgb(coerceHexColor(from, '#000000'))
  const B = hexToRgb(coerceHexColor(to, '#ffffff'))
  if (!A || !B) return coerceHexColor(from, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const u = Math.max(0, Math.min(1, t))
  return rgbToHex({
    r: A.r + (B.r - A.r) * u,
    g: A.g + (B.g - A.g) * u,
    b: A.b + (B.b - A.b) * u,
  })
}

export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(coerceHexColor(hex, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT))
  if (!rgb) return `rgba(249,115,22,${alpha})`
  const a = Math.max(0, Math.min(1, alpha))
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`
}

/** Fundo em gradiente (início, perguntas e resultado): branco → tom escolhido → ligeiramente mais escuro. */
export function buildQuizQuestionPageBackground(tintMidHex: string): string {
  const mid = coerceHexColor(tintMidHex, WAKE_QUIZ_DEFAULT_QUIZ_BG_TINT)
  const bottom = mixHex(mid, '#0f172a', 0.09)
  return `linear-gradient(160deg, #ffffff 0%, ${mid} 50%, ${bottom} 100%)`
}

/** Gradiente do botão principal e da barra de progresso. */
export function buildAccentGradient(accentHex: string): string {
  const a = coerceHexColor(accentHex, WAKE_QUIZ_DEFAULT_QUIZ_ACCENT)
  const b = mixHex(a, '#ffffff', 0.18)
  const c = mixHex(a, '#ffffff', 0.34)
  return `linear-gradient(135deg, ${a}, ${b}, ${c})`
}
