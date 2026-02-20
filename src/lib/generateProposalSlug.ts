export function generateProposalSlug(title: string, clientName: string): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 20)

  const titleSlug = sanitize(title || 'proposta')
  const clientSlug = sanitize(clientName || 'cliente').substring(0, 15)
  const randomSuffix = Math.random().toString(36).substring(2, 8)

  return `${titleSlug}-${clientSlug}-${randomSuffix}`
}

export function generateShortSlug(): string {
  return Math.random().toString(36).substring(2, 10)
}
