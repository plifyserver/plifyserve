import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserId } from '@/lib/auth'
import { getPaymentsEnabled } from '@/lib/cms/paymentsEnabled'

function sanitizeCity(s: string): string {
  const t = s.trim().slice(0, 40)
  return t || 'SAO PAULO'
}

function sanitizeName(s: string): string {
  return s.trim().slice(0, 80)
}

function sanitizeKey(s: string): string {
  return s.trim().slice(0, 120)
}

function normalizeAndValidatePixKey(input: string):
  | { ok: true; key: string }
  | { ok: false; error: string } {
  const raw = input.trim()
  if (!raw) return { ok: false, error: 'Chave PIX é obrigatória.' }

  // e-mail
  if (raw.includes('@')) {
    const email = raw.toLowerCase()
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    return emailOk ? { ok: true, key: email } : { ok: false, error: 'E-mail inválido para chave PIX.' }
  }

  // chave aleatória (UUID)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return { ok: true, key: raw.toLowerCase() }
  }

  // CPF / CNPJ / telefone: remove pontuação
  const digits = raw.replace(/\D/g, '')

  // CPF
  if (digits.length === 11) return { ok: true, key: digits }
  // CNPJ
  if (digits.length === 14) return { ok: true, key: digits }

  // telefone: aceita com DDI 55 (13 dígitos) ou sem DDI (10-11)
  if (digits.length === 13 && digits.startsWith('55')) return { ok: true, key: `+${digits}` }
  if (digits.length === 10 || digits.length === 11) return { ok: true, key: `+55${digits}` }

  return {
    ok: false,
    error:
      'Chave PIX inválida. Use e-mail, CPF/CNPJ (apenas números), telefone (com DDD) ou chave aleatória (UUID).',
  }
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  if (!(await getPaymentsEnabled(supabase))) {
    return NextResponse.json({ error: 'Pagamentos não estão ativos.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('user_pix_settings')
    .select('pix_key, holder_name, merchant_city, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    settings: data ?? null,
  })
}

export async function PUT(request: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = await createClient()
  if (!(await getPaymentsEnabled(supabase))) {
    return NextResponse.json({ error: 'Pagamentos não estão ativos.' }, { status: 403 })
  }

  let body: { pix_key?: unknown; holder_name?: unknown; merchant_city?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const pix_key_raw = typeof body.pix_key === 'string' ? sanitizeKey(body.pix_key) : ''
  const normalized = normalizeAndValidatePixKey(pix_key_raw)
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 })
  }
  const pix_key = normalized.key
  const holder_name = typeof body.holder_name === 'string' ? sanitizeName(body.holder_name) : ''
  const merchant_city =
    typeof body.merchant_city === 'string' && body.merchant_city.trim() !== ''
      ? sanitizeCity(body.merchant_city)
      : 'SAO PAULO'

  if (!pix_key || !holder_name) {
    return NextResponse.json({ error: 'Chave PIX e nome do recebedor são obrigatórios.' }, { status: 400 })
  }

  const row = {
    user_id: userId,
    pix_key,
    holder_name,
    merchant_city,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from('user_pix_settings').upsert(row, { onConflict: 'user_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ settings: data })
}
