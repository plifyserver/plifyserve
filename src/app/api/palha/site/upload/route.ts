import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import {
  getPalhaSiteSettings,
  savePalhaSiteSettings,
  type PalhaPhotoSlot,
} from '@/lib/palha/site-settings'

const SLOTS = new Set<PalhaPhotoSlot>(['hero', 'terrace', 'portrait', 'beyond', 'cta'])

async function saveSlotUrl(slot: PalhaPhotoSlot, url: string) {
  const current = await getPalhaSiteSettings()
  const settings = await savePalhaSiteSettings({
    ...current,
    photos: { ...current.photos, [slot]: url },
  })
  return { url, settings }
}

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = (await request.json().catch(() => ({}))) as { slot?: string; url?: string }
      const slot = String(body.slot || '') as PalhaPhotoSlot
      const url = String(body.url || '').trim()
      if (!SLOTS.has(slot) || !url) {
        return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
      }
      return NextResponse.json(await saveSlotUrl(slot, url))
    }

    return NextResponse.json({ error: 'Envie a foto pelo armazenamento direto.' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
