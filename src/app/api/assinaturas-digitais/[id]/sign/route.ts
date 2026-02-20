import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
  }

  const body = await request.json()
  const signatureDataUrl = body?.signature_data_url as string | undefined
  if (!signatureDataUrl || typeof signatureDataUrl !== 'string') {
    return NextResponse.json({ error: 'signature_data_url é obrigatório' }, { status: 400 })
  }

  const signedClientAt = typeof body?.signed_client_at === 'string' ? body.signed_client_at : null
  const latitude = body?.signed_latitude != null ? Number(body.signed_latitude) : null
  const longitude = body?.signed_longitude != null ? Number(body.signed_longitude) : null

  const supabase = createServiceRoleClient()
  
  const { data: doc, error: fetchError } = await supabase
    .from('signature_documents')
    .select('id, status')
    .or(`id.eq.${id},slug.eq.${id}`)
    .single()

  if (fetchError || !doc) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  }
  if (doc.status !== 'pending') {
    return NextResponse.json({ error: 'Documento já foi assinado' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('signature_documents')
    .update({
      status: 'signed',
      signature_data_url: signatureDataUrl,
      signed_at: new Date().toISOString(),
      signed_client_at: signedClientAt,
      signed_latitude: latitude,
      signed_longitude: longitude,
      updated_at: new Date().toISOString(),
    })
    .eq('id', doc.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
