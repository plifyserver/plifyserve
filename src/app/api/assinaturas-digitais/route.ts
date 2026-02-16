import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import crypto from 'crypto'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('signature_documents')
    .select('id, file_url, client_name, client_email, client_whatsapp, slug, status, signature_data_url, signed_at, signed_client_at, signed_latitude, signed_longitude, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { file_url, client_name, client_email, client_whatsapp } = body as {
    file_url?: string
    client_name?: string
    client_email?: string
    client_whatsapp?: string
  }

  if (!file_url || !client_name || !client_email) {
    return NextResponse.json(
      { error: 'Preencha: file_url, client_name e client_email' },
      { status: 400 }
    )
  }

  const slug = crypto.randomBytes(10).toString('base64url')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('signature_documents')
    .insert({
      user_id: userId,
      file_url,
      client_name,
      client_email,
      client_whatsapp: client_whatsapp || null,
      slug,
      status: 'pending',
    })
    .select('id, slug, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
