import { createPalhaServiceClient } from '@/lib/palha/supabase/server'
import { palhaR2KeyFromUrl, type PalhaR2ObjectUsage } from '@/lib/palha/r2'
import type { PalhaAlbum } from '@/lib/palha/site-settings-shared'

export const PALHA_R2_FREE_BYTES = 10 * 1024 * 1024 * 1024
export const PALHA_SUPABASE_DB_FREE_BYTES = 500 * 1024 * 1024
export const PALHA_SUPABASE_STORAGE_FREE_BYTES = 1 * 1024 * 1024 * 1024

export function formatPalhaBytes(bytes: number) {
  const value = Math.max(0, Number(bytes) || 0)
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  const digits = size >= 100 || unit === 0 ? 0 : size >= 10 ? 1 : 2
  return `${size.toFixed(digits).replace('.', ',')} ${units[unit]}`
}

export function palhaUsageMeter(usedBytes: number, limitBytes: number) {
  const used = Math.max(0, Number(usedBytes) || 0)
  const limit = Math.max(1, Number(limitBytes) || 1)
  const remaining = Math.max(0, limit - used)
  return {
    usedBytes: used,
    limitBytes: limit,
    remainingBytes: remaining,
    percent: Math.min(100, Math.round((used / limit) * 1000) / 10),
    usedLabel: formatPalhaBytes(used),
    remainingLabel: formatPalhaBytes(remaining),
    limitLabel: formatPalhaBytes(limit),
  }
}

export function palhaAlbumCreatedAt(album: Pick<PalhaAlbum, 'id' | 'createdAt'>) {
  if (album.createdAt) {
    const date = new Date(album.createdAt)
    if (!Number.isNaN(date.getTime())) return date.toISOString()
  }
  const match = /^album-([0-9a-z]+)-/i.exec(album.id)
  if (!match) return ''
  const ms = Number.parseInt(match[1], 36)
  if (!Number.isFinite(ms) || ms < 1.6e12 || ms > Date.now() + 8.64e7) return ''
  return new Date(ms).toISOString()
}

export function formatPalhaPublishedAt(iso: string) {
  if (!iso) return 'Data não registrada'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Data não registrada'
  return date.toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function palhaAlbumStorageBytes(album: PalhaAlbum, objects: PalhaR2ObjectUsage[]) {
  const sizes = new Map(objects.map((object) => [object.key, object.size]))
  const keys = new Set<string>()
  const prefix = `gallery/${album.id}/`
  for (const object of objects) {
    if (object.key.startsWith(prefix)) keys.add(object.key)
  }
  const urls = [album.coverUrl, ...album.subalbums.flatMap((sub) => sub.items.map((item) => item.url))]
  for (const url of urls) {
    const key = palhaR2KeyFromUrl(url)
    if (key) keys.add(key)
  }
  return [...keys].reduce((total, key) => total + (sizes.get(key) || 0), 0)
}

export async function getPalhaSupabaseUsage() {
  const empty = { databaseBytes: 0, storageBytes: 0, databaseOk: false, storageOk: false }
  try {
    const supabase = createPalhaServiceClient()
    const { data, error } = await supabase.rpc('palha_usage_stats')
    if (!error && data) {
      const stats = (typeof data === 'string' ? JSON.parse(data) : data) as {
        databaseBytes?: number
        storageBytes?: number
      }
      return {
        databaseBytes: Number(stats.databaseBytes || 0),
        storageBytes: Number(stats.storageBytes || 0),
        databaseOk: true,
        storageOk: true,
      }
    }
  } catch {
    // Continua no fallback do Storage.
  }

  try {
    const supabase = createPalhaServiceClient()
    const { data, error } = await supabase.schema('storage').from('objects').select('metadata')
    if (error) return empty
    const storageBytes = (data || []).reduce((total, row) => {
      const metadata = row.metadata as { size?: number } | null
      return total + Number(metadata?.size || 0)
    }, 0)
    return { ...empty, storageBytes, storageOk: true }
  } catch {
    return empty
  }
}
