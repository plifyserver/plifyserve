import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const body = await request.json()
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  const payload = {
    user_id: userId,
    app_name: body.app_name ?? null,
    logo_url: body.logo_url ?? null,
    favicon_url: body.favicon_url ?? null,
    primary_color: body.primary_color ?? '#3B82F6',
    secondary_color: body.secondary_color ?? '#1E293B',
    theme: body.theme ?? 'light',
    custom_domain: body.custom_domain ?? null,
    hide_branding: body.hide_branding ?? false,
    updated_at: new Date().toISOString(),
  }
  if (existing?.id) {
    const { data, error } = await supabase
      .from('app_settings')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
  const { data, error } = await supabase
    .from('app_settings')
    .insert(payload)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
