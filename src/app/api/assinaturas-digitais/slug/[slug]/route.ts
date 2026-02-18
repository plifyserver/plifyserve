import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug) {
    return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('signature_documents')
    .select('id, file_url, client_name, status, signature_data_url, signed_at, signed_client_at, signed_latitude, signed_longitude')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}
