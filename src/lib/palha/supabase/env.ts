export const PALHA_AUTH_COOKIE = 'palha-auth'

export function getPalhaSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_PALHA_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://placeholder.supabase.co'
  const anonKey =
    process.env.NEXT_PUBLIC_PALHA_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key-for-build'
  return { url, anonKey }
}

export function getPalhaServiceRoleKey() {
  return process.env.PALHA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
}

export const palhaAuthCookieOptions = {
  name: PALHA_AUTH_COOKIE,
  path: '/',
  sameSite: 'lax' as const,
}
