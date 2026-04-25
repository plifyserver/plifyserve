import { createStaticPix, hasError, parsePix, isStaticPix } from 'pix-utils'

function stripDiacritics(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function sanitizeMerchantCity(city: string): string {
  const u = stripDiacritics(city)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 15)
  return u || 'SAO PAULO'
}

function sanitizeMerchantName(name: string): string {
  return stripDiacritics(name)
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 25) || 'RECEBEDOR'
}

export type GenerateStaticPixResult =
  | { ok: true; brCode: string; qrDataUrl: string }
  | { ok: false; message: string }

export async function generateStaticPixQr(params: {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount: number
  infoAdicional?: string
  /** true = transação única (uso típico: um pagamento); false = vários pagadores podem usar o mesmo QR */
  isTransactionUnique: boolean
}): Promise<GenerateStaticPixResult> {
  const amount = Number(params.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Valor inválido.' }
  }

  const pix = createStaticPix({
    merchantName: sanitizeMerchantName(params.merchantName),
    merchantCity: sanitizeMerchantCity(params.merchantCity),
    pixKey: params.pixKey.trim(),
    transactionAmount: amount,
    isTransactionUnique: params.isTransactionUnique,
    infoAdicional: params.infoAdicional?.trim().slice(0, 80) || undefined,
  })

  if (hasError(pix)) {
    return { ok: false, message: pix.message || 'Não foi possível gerar o PIX.' }
  }

  try {
    const brCode = pix.toBRCode()
    // valida o payload final (pegamos casos raros de encoding/CRC antes de salvar)
    const parsed = parsePix(brCode)
    if (hasError(parsed) || !isStaticPix(parsed)) {
      return { ok: false, message: 'PIX gerado inválido (payload inconsistente).' }
    }
    const qrDataUrl = await pix.toImage()
    return { ok: true, brCode, qrDataUrl }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : 'Erro ao gerar imagem do QR Code.',
    }
  }
}
