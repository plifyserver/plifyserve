import { whatsappHref } from '@/lib/empresarialContactLinks'

/** URL para abrir o WhatsApp (Web ou app). Aceita `https://wa.me/...` ou só dígitos do número. */
export function resolveCleanPromotionWhatsappHref(target: string): string {
  const t = target.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return whatsappHref(t)
}

/**
 * Href seguro para o botão flutuante, ou `null` se não houver link válido.
 * Evita mostrar botão com `href="#"` quando o utilizador não colocou dígitos no número.
 */
export function getCleanPromotionWhatsappButtonHref(target: string): string | null {
  const h = resolveCleanPromotionWhatsappHref(target)
  if (!h || h === '#') return null
  return h
}
