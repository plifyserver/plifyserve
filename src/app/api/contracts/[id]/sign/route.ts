import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_r: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .select('id, title, file_url, client_name, signatories, status, created_at')
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { signatoryEmail, signatureData } = body
  
  if (!signatoryEmail || !signatureData) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError || !contract) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }
  
  const signatories = [...(contract.signatories || [])]
  const signatoryIndex = signatories.findIndex(
    (s: { email: string }) => s.email.toLowerCase() === signatoryEmail.toLowerCase()
  )
  
  if (signatoryIndex < 0) {
    return NextResponse.json({ error: 'Signatário não encontrado' }, { status: 404 })
  }
  
  if (signatories[signatoryIndex].signed) {
    return NextResponse.json({ error: 'Documento já assinado por este signatário' }, { status: 400 })
  }
  
  signatories[signatoryIndex] = {
    ...signatories[signatoryIndex],
    signed: true,
    signed_at: signatureData.signedAt,
    signature_url: signatureData.signatureImage,
    cpf: signatureData.cpf,
    birth_date: signatureData.birthDate,
    location: signatureData.location,
  }
  
  const allSigned = signatories.every((s: { signed: boolean }) => s.signed)
  
  const { data, error } = await supabase
    .from('contracts')
    .update({
      signatories,
      status: allSigned ? 'signed' : 'pending',
      signed_at: allSigned ? new Date().toISOString() : contract.signed_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
