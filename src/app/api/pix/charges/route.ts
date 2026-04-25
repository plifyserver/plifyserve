import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPaymentsEnabled } from '@/lib/cms/paymentsEnabled'
import { generateStaticPixQr } from '@/lib/pix/generateStaticPix'
const MAX_CHARGES = 80

function parseAmount(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number(raw.replace(',', '.').trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  if (!(await getPaymentsEnabled(supabase))) {
    return NextResponse.json({ error: 'Pagamentos não estão ativos.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('user_pix_charges')
    .select('id, amount, bank_name, payment_kind, description, br_code, qr_data_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ charges: data ?? [] })
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  if (!(await getPaymentsEnabled(supabase))) {
    return NextResponse.json({ error: 'Pagamentos não estão ativos.' }, { status: 403 })
  }

  let body: {
    amount?: unknown
    bank_name?: unknown
    description?: unknown
    payment_kind?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const amount = parseAmount(body.amount)
  if (amount == null || amount <= 0 || amount > 999_999.99) {
    return NextResponse.json({ error: 'Valor inválido (use um valor entre 0,01 e 999.999,99).' }, { status: 400 })
  }

  const bank_name = typeof body.bank_name === 'string' ? body.bank_name.trim().slice(0, 80) : ''
  if (bank_name.length < 2) {
    return NextResponse.json({ error: 'Selecione ou informe o banco.' }, { status: 400 })
  }

  const payment_kind = body.payment_kind === 'single' ? 'single' : body.payment_kind === 'reusable' ? 'reusable' : ''
  if (!payment_kind) {
    return NextResponse.json({ error: 'Tipo de pagamento inválido (single ou reusable).' }, { status: 400 })
  }

  const description =
    typeof body.description === 'string' ? body.description.trim().slice(0, 120) : ''

  const { count, error: countError } = await supabase
    .from('user_pix_charges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
  if ((count ?? 0) >= MAX_CHARGES) {
    return NextResponse.json({ error: `Limite de ${MAX_CHARGES} PIX gerados. Exclua alguns para continuar.` }, { status: 400 })
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_pix_settings')
    .select('pix_key, holder_name, merchant_city')
    .eq('user_id', userId)
    .maybeSingle()

  if (settingsError || !settings?.pix_key || !settings?.holder_name) {
    return NextResponse.json({ error: 'Configure sua chave PIX e dados do recebedor antes de gerar.' }, { status: 400 })
  }

  const infoParts = [`Plify`, bank_name, payment_kind === 'single' ? 'Unico' : 'Multiplo']
  if (description) infoParts.push(description)
  const infoAdicional = infoParts.join(' · ').slice(0, 80)

  const pix = await generateStaticPixQr({
    pixKey: settings.pix_key,
    merchantName: settings.holder_name,
    merchantCity: settings.merchant_city || 'SAO PAULO',
    amount,
    infoAdicional,
    isTransactionUnique: payment_kind === 'single',
  })

  if (!pix.ok) {
    return NextResponse.json({ error: pix.message }, { status: 400 })
  }

  const insert = {
    user_id: userId,
    amount,
    bank_name,
    payment_kind,
    description: description || null,
    br_code: pix.brCode,
    qr_data_url: pix.qrDataUrl,
  }

  const { data: row, error: insertError } = await supabase.from('user_pix_charges').insert(insert).select().single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ charge: row })
}
