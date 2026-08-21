import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getPalhaServiceRoleKey, getPalhaSupabaseEnv, palhaAuthCookieOptions } from './env'

export async function createPalhaServerClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getPalhaSupabaseEnv()

  return createServerClient(url, anonKey, {
    cookieOptions: palhaAuthCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Component
        }
      },
    },
  })
}

export function createPalhaServiceClient() {
  const key = getPalhaServiceRoleKey()
  if (!key) throw new Error('PALHA_SUPABASE_SERVICE_ROLE_KEY is required')
  const { url } = getPalhaSupabaseEnv()
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
