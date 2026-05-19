/** Comprimento mínimo do identificador público do quiz (ex.: bio do Instagram). */
export const WAKE_QUIZ_SLUG_MIN_LENGTH = 3
/** Comprimento máximo (cobre slugs antigos `w-` + 32 hex ≈ 34 caracteres). */
export const WAKE_QUIZ_SLUG_MAX_LENGTH = 40

/**
 * Slugs reservados (rotas da app, pastas comuns). Comparação em minúsculas após normalizar.
 */
export const RESERVED_WAKE_QUIZ_PUBLIC_SLUGS = new Set([
  'admin',
  'api',
  'assinatura',
  'atualizar-senha',
  'auth',
  'billing',
  'cadastro',
  'checkout',
  'conta',
  'conta-bloqueada',
  'contrato',
  'crm',
  'dashboard',
  'documentos',
  'download',
  'empresa',
  'esqueci-senha',
  'favicon',
  'help',
  'hooks',
  'ingest',
  'legal',
  'login',
  'manifest',
  'p',
  'pricing',
  'privacy',
  'proposta',
  'q',
  'quiz',
  'robots',
  'settings',
  'signup',
  'sign-up',
  'static',
  'suporte',
  'sitemap',
  'terms',
  'termos-privacidade',
  'termos-uso',
  'webhook',
  'wake',
  '_next',
])

/**
 * Normaliza o input do utilizador para um candidato a slug (minúsculas, hífens, sem acentos).
 */
export function normalizeWakeQuizPublicSlugInput(input: string): string {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type ValidateWakeQuizPublicSlugResult =
  | { ok: true; slug: string }
  | { ok: false; error: string }

/**
 * Valida o identificador do link público `/q/wake/[slug]`.
 * Aceita slugs antigos (`w-` + 32 hex) e novos (mais curtos ou personalizados).
 */
export function validateWakeQuizPublicSlug(input: string): ValidateWakeQuizPublicSlugResult {
  const slug = normalizeWakeQuizPublicSlugInput(input)
  if (slug.length < WAKE_QUIZ_SLUG_MIN_LENGTH) {
    return {
      ok: false,
      error: `O identificador deve ter pelo menos ${WAKE_QUIZ_SLUG_MIN_LENGTH} caracteres.`,
    }
  }
  if (slug.length > WAKE_QUIZ_SLUG_MAX_LENGTH) {
    return {
      ok: false,
      error: `O identificador pode ter no máximo ${WAKE_QUIZ_SLUG_MAX_LENGTH} caracteres.`,
    }
  }
  if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    return {
      ok: false,
      error:
        'Use apenas letras, números e hífen. Comece com uma letra e não termine com hífen.',
    }
  }
  if (RESERVED_WAKE_QUIZ_PUBLIC_SLUGS.has(slug)) {
    return { ok: false, error: 'Este identificador é reservado. Escolha outro.' }
  }
  return { ok: true, slug }
}

export function isValidWakeQuizPublicSlug(slug: string): boolean {
  return validateWakeQuizPublicSlug(slug).ok
}

const SHORT_RANDOM_LEN = 8
const SLUG_RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

/** Slug curto por defeito, ex.: `w-x7k2m9ab` (compatível com a regra de validação). */
export function generateRandomWakeQuizPublicSlug(): string {
  const bytes = new Uint8Array(SHORT_RANDOM_LEN)
  crypto.getRandomValues(bytes)
  let suffix = ''
  for (let i = 0; i < SHORT_RANDOM_LEN; i++) {
    suffix += SLUG_RANDOM_ALPHABET[bytes[i]! % SLUG_RANDOM_ALPHABET.length]
  }
  return `w-${suffix}`
}
