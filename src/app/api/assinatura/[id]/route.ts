import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('id, title, file_url, client_name, company_name, company_logo, status, created_at, expires_at, signatories')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  if (data.status === 'expired') {
    return NextResponse.json({ error: 'Este contrato expirou' }, { status: 410 })
  }

  return NextResponse.json(data)
}
