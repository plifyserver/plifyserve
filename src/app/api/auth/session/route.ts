import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { userProfileHasProPlan } from '@/lib/calendar/calendarAccess'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null, profile: null })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile: profile ? { ...profile, is_pro: userProfileHasProPlan(profile) } : null,
  })
}
