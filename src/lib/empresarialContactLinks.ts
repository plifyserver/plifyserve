/** Apenas dígitos (útil para wa.me e tel). */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

export function normalizeExternalUrl(url: string): string {
  const t = url.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  if (/^mailto:/i.test(t) || /^tel:/i.test(t)) return t
  return `https://${t}`
}

export function mailtoHref(email: string): string {
  const e = email.trim()
  if (!e) return '#'
  return `mailto:${e}`
}

/** tel: preserva + se existir; senão usa dígitos com prefixo + */
export function telHref(phone: string): string {
  const p = phone.trim()
  if (!p) return '#'
  const noSpace = p.replace(/\s/g, '')
  if (noSpace.startsWith('+')) return `tel:${noSpace}`
  const d = digitsOnly(p)
  return d ? `tel:+${d}` : `tel:${encodeURIComponent(p)}`
}

/** Abre conversa no WhatsApp (web ou app). */
export function whatsappHref(whatsapp: string): string {
  const d = digitsOnly(whatsapp)
  if (!d) return '#'
  return `https://wa.me/${d}`
}
