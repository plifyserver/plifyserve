import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPublicBaseUrl } from '@/lib/publicBaseUrl'
import {
  sendContractSignLinkEmail,
  ContractSmtpNotConfiguredError,
} from '@/lib/mail/sendContractSignLinkEmail'

type SignatoryRow = { name?: string; email?: string }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  let body: { signatoryEmail?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const rawEmail = typeof body.signatoryEmail === 'string' ? body.signatoryEmail.trim() : ''
  if (!rawEmail || !rawEmail.includes('@')) {
    return NextResponse.json({ error: 'E-mail do signatário é obrigatório.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, title, signatories')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
  }

  const signatories = (contract.signatories ?? []) as SignatoryRow[]
  const normalized = rawEmail.toLowerCase()
  const match = signatories.find((s) => (s.email?.trim().toLowerCase() ?? '') === normalized)
  if (!match) {
    return NextResponse.json(
      { error: 'Este e-mail não consta como signatário neste contrato.' },
      { status: 400 }
    )
  }

  const base = getPublicBaseUrl(request)
  if (!base) {
    return NextResponse.json(
      {
        error:
          'Não foi possível montar o link do contrato. Defina NEXT_PUBLIC_APP_URL na Vercel com o seu domínio público (ex.: https://www.plify360.com.br). Evite links em *.vercel.app nos e-mails — o cliente pode ver o login da Vercel em vez da assinatura.',
      },
      { status: 503 }
    )
  }

  const signUrl = `${base}/contrato/${contract.id}/assinar?email=${encodeURIComponent(rawEmail)}`

  try {
    await sendContractSignLinkEmail({
      to: rawEmail,
      signatoryName: match.name,
      contractTitle: typeof contract.title === 'string' ? contract.title : 'Documento',
      signUrl,
    })
  } catch (e) {
    if (e instanceof ContractSmtpNotConfiguredError) {
      return NextResponse.json(
        {
          error:
            'Envio por e-mail não configurado. Defina CONTRACT_SMTP_USER e CONTRACT_SMTP_PASS (no Gmail use uma senha de app).',
        },
        { status: 503 }
      )
    }
    console.error('sendContractSignLinkEmail', e)
    return NextResponse.json(
      { error: 'Falha ao enviar e-mail. Verifique as credenciais SMTP e a conta remetente.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
