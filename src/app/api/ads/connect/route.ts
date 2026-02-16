import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      scopes: 'ads_read',
      redirectTo: `${request.nextUrl.origin}/dashboard/metricas`,
    },
  })

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/metricas?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  if (data.url) {
    return NextResponse.redirect(data.url)
  }

  return NextResponse.redirect(new URL('/dashboard/metricas', request.url))
}
