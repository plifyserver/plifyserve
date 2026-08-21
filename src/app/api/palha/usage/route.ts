import { NextResponse, type NextRequest } from 'next/server'
import { palhaApiAllowed, palhaApiForbidden } from '@/lib/palha/api-guard'
import { getPalhaUserFromRequest } from '@/lib/palha/auth-request'
import { decryptPalhaAlbumPassword } from '@/lib/palha/album-secret'
import { listPalhaR2Usage } from '@/lib/palha/r2'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { albumHasPassword, albumMediaCount } from '@/lib/palha/site-settings-shared'
import {
  formatPalhaPublishedAt,
  getPalhaSupabaseUsage,
  palhaAlbumCreatedAt,
  palhaAlbumStorageBytes,
  palhaUsageMeter,
  PALHA_R2_FREE_BYTES,
  PALHA_SUPABASE_DB_FREE_BYTES,
  PALHA_SUPABASE_STORAGE_FREE_BYTES,
} from '@/lib/palha/usage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  if (!palhaApiAllowed(request)) return palhaApiForbidden()
  const user = await getPalhaUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const [settings, objects, supabaseUsage] = await Promise.all([
      getPalhaSiteSettings(),
      listPalhaR2Usage(),
      getPalhaSupabaseUsage(),
    ])

    const r2Bytes = objects.reduce((total, object) => total + object.size, 0)
    const albums = settings.gallery.albums.map((album) => {
      const bytes = palhaAlbumStorageBytes(album, objects)
      const createdAt = palhaAlbumCreatedAt(album)
      const password = decryptPalhaAlbumPassword(album.accessSecret || '')
      const protectedAlbum = albumHasPassword(album)
      return {
        id: album.id,
        name: album.name || 'Álbum',
        eventDate: album.eventDate || '',
        publishedAt: createdAt,
        publishedLabel: formatPalhaPublishedAt(createdAt),
        bytes,
        sizeLabel: palhaUsageMeter(bytes, PALHA_R2_FREE_BYTES).usedLabel,
        files: albumMediaCount(album) + (album.coverUrl ? 1 : 0),
        passwordProtected: protectedAlbum,
        password: password || '',
        passwordLabel: password
          ? ''
          : protectedAlbum
            ? 'Senha ativa, mas ainda não visível. Defina de novo no álbum para aparecer aqui.'
            : 'Sem senha',
      }
    })

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        r2: {
          provider: 'Cloudflare R2',
          plan: 'Free 10 GB',
          ...palhaUsageMeter(r2Bytes, PALHA_R2_FREE_BYTES),
        },
        supabase: {
          provider: 'Supabase',
          database: {
            plan: 'Free 500 MB',
            ok: supabaseUsage.databaseOk,
            ...palhaUsageMeter(supabaseUsage.databaseBytes, PALHA_SUPABASE_DB_FREE_BYTES),
          },
          storage: {
            plan: 'Free 1 GB',
            ok: supabaseUsage.storageOk,
            ...palhaUsageMeter(supabaseUsage.storageBytes, PALHA_SUPABASE_STORAGE_FREE_BYTES),
          },
        },
        albums,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Não foi possível ler o uso de dados.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
