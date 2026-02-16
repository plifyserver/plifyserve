import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      edits_remaining: 999,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: 'pro',
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ success: true })
}
