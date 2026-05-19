import type { CSSProperties } from 'react'
import { coerceHexColor } from '@/lib/wakeQuizThemeColors'

export type WakeQuizFontKey = 'inter' | 'grotesk' | 'poppins' | 'dmSans' | 'playfair'

/** Estilo de texto por bloco (cor, fonte, tamanho, negrito, etc.). */
export type WakeQuizBlockTypography = {
  fontKey?: WakeQuizFontKey
  fontSizePx?: number
  color?: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

const FONT_STACK: Record<WakeQuizFontKey, string> = {
  inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  grotesk: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  poppins: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  dmSans: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  playfair: "'Playfair Display', Georgia, serif",
}

export function wakeQuizFontStack(key: WakeQuizFontKey | undefined): string {
  const k = key && FONT_STACK[key] ? key : 'grotesk'
  return FONT_STACK[k]
}

export function parseWakeQuizBlockTypography(raw: unknown): WakeQuizBlockTypography | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const out: WakeQuizBlockTypography = {}
  if (
    o.fontKey === 'inter' ||
    o.fontKey === 'grotesk' ||
    o.fontKey === 'poppins' ||
    o.fontKey === 'dmSans' ||
    o.fontKey === 'playfair'
  ) {
    out.fontKey = o.fontKey
  }
  if (typeof o.fontSizePx === 'number' && Number.isFinite(o.fontSizePx)) {
    out.fontSizePx = Math.round(Math.min(120, Math.max(8, o.fontSizePx)))
  }
  if (typeof o.color === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(o.color.trim())) {
    out.color = coerceHexColor(o.color, '#000000')
  }
  if (typeof o.bold === 'boolean') out.bold = o.bold
  if (typeof o.italic === 'boolean') out.italic = o.italic
  if (typeof o.underline === 'boolean') out.underline = o.underline
  return Object.keys(out).length > 0 ? out : undefined
}

/** Converte tipografia guardada em estilos inline (só chaves definidas). */
export function typographyToStyle(t: WakeQuizBlockTypography | undefined): CSSProperties {
  if (!t) return {}
  const st: CSSProperties = {}
  if (t.fontKey) st.fontFamily = wakeQuizFontStack(t.fontKey)
  if (typeof t.fontSizePx === 'number') st.fontSize = `${t.fontSizePx}px`
  if (t.color) st.color = coerceHexColor(t.color, '#000000')
  if (t.bold !== undefined) st.fontWeight = t.bold ? 700 : 500
  if (t.italic !== undefined) st.fontStyle = t.italic ? 'italic' : 'normal'
  if (t.underline !== undefined) st.textDecoration = t.underline ? 'underline' : 'none'
  return st
}
