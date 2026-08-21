import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import {
  getPalhaSiteSettings,
  savePalhaSiteSettings,
  uploadPalhaSitePhoto,
  type PalhaPhotoSlot,
} from '@/lib/palha/site-settings'

const SLOTS = new Set<PalhaPhotoSlot>(['hero', 'terrace', 'portrait', 'beyond', 'cta'])
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB = 6

export async function POST(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  const slot = String(form.get('slot') ?? '')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: 'Use JPEG, PNG, WebP ou GIF.' }, { status: 400 })
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Tamanho máximo: ${MAX_MB} MB` }, { status: 400 })
  }

  try {
    if (!SLOTS.has(slot as PalhaPhotoSlot)) {
      return NextResponse.json({ error: 'Área de foto inválida' }, { status: 400 })
    }

    const url = await uploadPalhaSitePhoto(slot as PalhaPhotoSlot, file)
    const current = await getPalhaSiteSettings()
    const settings = await savePalhaSiteSettings({
      ...current,
      photos: { ...current.photos, [slot]: url },
    })
    return NextResponse.json({ url, settings })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha no envio'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
