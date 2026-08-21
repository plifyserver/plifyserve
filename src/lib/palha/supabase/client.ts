import { createBrowserClient } from '@supabase/ssr'
import { getPalhaSupabaseEnv, palhaAuthCookieOptions } from './env'

export function createPalhaBrowserClient() {
  const { url, anonKey } = getPalhaSupabaseEnv()
  return createBrowserClient(url, anonKey, {
    cookieOptions: palhaAuthCookieOptions,
  })
}
