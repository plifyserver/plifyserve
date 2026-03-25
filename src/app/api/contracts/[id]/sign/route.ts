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

function getClientIp(request: NextRequest): string | null {
  const headers = request.headers
  const forwarded = headers.get('x-forwarded-for') || headers.get('x-vercel-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-client-ip') ||
    null
  )
}

function getClientUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent') || null
}

function hasSelfieUrl(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { signatoryEmail, signatureData } = body
  
  if (!signatoryEmail || !signatureData) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  if (!hasSelfieUrl(signatureData.selfieImage)) {
    return NextResponse.json({ error: 'Selfie obrigatória para registrar a assinatura.' }, { status: 400 })
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
  
  const ipAddress = getClientIp(request)
  const userAgent = getClientUserAgent(request)
  
  signatories[signatoryIndex] = {
    ...signatories[signatoryIndex],
    signed: true,
    signed_at: signatureData.signedAt,
    signature_url: signatureData.signatureImage,
    selfie_url: String(signatureData.selfieImage).trim(),
    cpf: signatureData.cpf,
    birth_date: signatureData.birthDate,
    location: signatureData.location,
    ip_address: ipAddress ?? signatureData.ip_address ?? null,
    user_agent: userAgent ?? signatureData.user_agent ?? null,
  }
  
  const allSigned = signatories.every(
    (s: { signed: boolean; selfie_url?: string | null }) => s.signed && hasSelfieUrl(s.selfie_url)
  )
  
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
