import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { unlockedAlbumIdsFromRequest } from '@/lib/palha/album-password'
import { getPalhaSiteSettings, publicizeSiteSettings, savePalhaSiteSettings, type PalhaSiteSettings } from '@/lib/palha/site-settings'

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const settings = await getPalhaSiteSettings()
  const user = await getPalhaUserFromRequest(request)
  const unlockedIds = unlockedAlbumIdsFromRequest(request, settings)
  return NextResponse.json(publicizeSiteSettings(settings, unlockedIds, Boolean(user)), {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}

export async function PUT(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = (await request.json()) as PalhaSiteSettings
    const settings = await savePalhaSiteSettings(body)
    return NextResponse.json(publicizeSiteSettings(settings, [], true))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Falha ao salvar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
