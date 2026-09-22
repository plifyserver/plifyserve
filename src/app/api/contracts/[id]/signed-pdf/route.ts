import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { generateSignedPDF, type SignatoryForPDF } from '@/lib/pdf-generator'

export const maxDuration = 60

type StoredSignatory = {
  name?: string
  email?: string
  signed?: boolean | string
  signed_at?: string | null
  signature_url?: string | null
  selfie_url?: string | null
  signature_placement?: SignatoryForPDF['signature_placement']
  cpf?: string | null
  birth_date?: string | null
  location?: SignatoryForPDF['location']
  ip_address?: string | null
  user_agent?: string | null
  browser?: string | null
}

function toSignatoryForPdf(s: StoredSignatory): SignatoryForPDF {
  return {
    name: String(s.name || ''),
    email: String(s.email || ''),
    signed: s.signed === true || s.signed === 'true',
    signed_at: s.signed_at ?? null,
    signature_url: s.signature_url ?? null,
    selfie_url: s.selfie_url ?? null,
    signature_placement: s.signature_placement ?? null,
    cpf: s.cpf ?? null,
    birth_date: s.birth_date ?? null,
    location: s.location ?? null,
    ip_address: s.ip_address ?? undefined,
    browser: s.browser ?? s.user_agent ?? undefined,
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, title, file_url, status, created_at, sent_at, signed_at, signatories, user_id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }
  if (!contract.file_url) {
    return NextResponse.json({ error: 'Contrato sem PDF anexado.' }, { status: 400 })
  }

  const signatures = ((contract.signatories || []) as StoredSignatory[]).map(toSignatoryForPdf)
  const hasSignedMedia = signatures.some((s) => s.signed && (s.signature_url || s.selfie_url))
  if (!hasSignedMedia) {
    return NextResponse.json(
      { error: 'Este contrato ainda não tem assinatura ou selfie gravadas.' },
      { status: 400 }
    )
  }

  try {
    const pdfBytes = await generateSignedPDF(
      {
        id: contract.id,
        title: contract.title,
        file_url: contract.file_url,
        status: contract.status,
        created_at: contract.created_at,
        sent_at: contract.sent_at,
        signed_at: contract.signed_at,
      },
      signatures
    )

    const safeName = String(contract.title || 'contrato')
      .slice(0, 40)
      .replace(/[^\w.\- ]+/g, '_')
      .trim() || 'contrato'

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-assinado-${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('signed-pdf error', err)
    const message = err instanceof Error ? err.message : 'Não foi possível gerar o PDF assinado.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
