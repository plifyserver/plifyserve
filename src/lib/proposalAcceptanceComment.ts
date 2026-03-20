/** Comentário opcional deixado pelo cliente ao aceitar (gravado em `content.acceptanceClientComment`). */
export function getAcceptanceClientComment(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null
  const raw = (content as Record<string, unknown>).acceptanceClientComment
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.length > 0 ? t : null
}
