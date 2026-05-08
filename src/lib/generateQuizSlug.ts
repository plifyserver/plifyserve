function sanitizeSlugPart(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 32)
}

export function generateQuizSlug(title: string): string {
  const base = sanitizeSlugPart(title) || 'quiz'
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

