import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import {
  sendContractSignLinkEmail,
  ContractSmtpNotConfiguredError,
} from '@/lib/mail/sendContractSignLinkEmail'

function getPublicBaseUrl(request: NextRequest): string | null {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (env) return env
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  const origin = request.headers.get('origin')
  if (origin?.startsWith('http')) return origin.replace(/\/$/, '')
  const host = request.headers.get('host')
  if (host) {
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    return `${proto}://${host}`.replace(/\/$/, '')
  }
  return null
}

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
          'Não foi possível montar o link público. Defina NEXT_PUBLIC_APP_URL (ex.: https://seudominio.com) no ambiente do servidor.',
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
