import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { getPalhaSupabaseEnv, palhaAuthCookieOptions } from '@/lib/palha/supabase/env'

export async function getPalhaUserFromRequest(request: NextRequest) {
  const { url, anonKey } = getPalhaSupabaseEnv()
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: palhaAuthCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll() {},
    },
  })
  const { data } = await supabase.auth.getUser()
  return data.user
}
