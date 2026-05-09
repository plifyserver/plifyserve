/** Slug público gerado pelo banco (`w-` + UUID sem hífens). */
export const WAKE_QUIZ_SLUG_REGEX = /^w-[0-9a-f]{32}$/i

export function isValidWakeQuizPublicSlug(slug: string): boolean {
  return WAKE_QUIZ_SLUG_REGEX.test(String(slug).trim())
}
