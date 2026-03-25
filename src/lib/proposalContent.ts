/** Verifica se HTML de descrição tem texto visível (ignora tags e &nbsp;). */
export function proposalHtmlHasVisibleText(html: string | undefined | null): boolean {
  if (!html || typeof html !== 'string') return false
  const stripped = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > 0
}
