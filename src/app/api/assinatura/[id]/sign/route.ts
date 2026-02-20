import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = await createClient()

  // Buscar contrato
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (contractError || !contract) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  // Verificar se já foi assinado
  if (contract.status === 'signed') {
    return NextResponse.json({ error: 'Este contrato já foi assinado' }, { status: 400 })
  }

  // Verificar se expirou
  if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
    await supabase
      .from('contracts')
      .update({ status: 'expired' })
      .eq('id', id)
    return NextResponse.json({ error: 'Este contrato expirou' }, { status: 410 })
  }

  // Criar registro de assinatura
  const { error: signatureError } = await supabase
    .from('contract_signatures')
    .insert({
      contract_id: id,
      client_name: body.client_name,
      client_email: body.client_email || null,
      cpf: body.cpf,
      birth_date: body.birth_date || null,
      signature_image: body.signature_image,
      ip_address: body.ip_address || null,
      location: body.location || null,
      signed_at: body.signed_at || new Date().toISOString(),
    })

  if (signatureError) {
    console.error('Signature error:', signatureError)
    return NextResponse.json({ error: 'Erro ao registrar assinatura' }, { status: 500 })
  }

  // Atualizar signatários no contrato (se existirem)
  const signatories = contract.signatories || []
  const updatedSignatories = signatories.map((s: { name: string; email: string; signed: boolean }) => {
    if (!s.signed) {
      return {
        ...s,
        signed: true,
        signed_at: new Date().toISOString(),
        cpf: body.cpf,
        birth_date: body.birth_date,
        signature_url: body.signature_image,
        location: body.location,
      }
    }
    return s
  })

  // Verificar se todos assinaram
  const allSigned = updatedSignatories.length === 0 || updatedSignatories.every((s: { signed: boolean }) => s.signed)

  // Atualizar contrato
  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      signatories: updatedSignatories,
      status: allSigned ? 'signed' : 'pending',
      signed_at: allSigned ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (updateError) {
    console.error('Update error:', updateError)
    return NextResponse.json({ error: 'Erro ao atualizar contrato' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status: allSigned ? 'signed' : 'pending' })
}
