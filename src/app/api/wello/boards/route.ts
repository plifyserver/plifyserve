import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wello_boards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const body = await request.json()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wello_boards')
    .insert({
      user_id: userId,
      name: body.name ?? '',
      description: body.description ?? null,
      background_color: body.background_color ?? '#3B82F6',
      background_image: body.background_image ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
