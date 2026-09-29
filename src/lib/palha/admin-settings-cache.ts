import { syncAlbumPasswordFlags, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'

const KEY = 'palha-admin-site-settings'

export function rememberPalhaAdminSettings(settings: PalhaSiteSettings) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // sessionStorage pode estar indisponível.
  }
}

export function readPalhaAdminSettings(): PalhaSiteSettings | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as PalhaSiteSettings
  } catch {
    return null
  }
}

export function preferPalhaAdminSettings(
  remote: PalhaSiteSettings,
  albumId?: string,
): PalhaSiteSettings {
  const local = readPalhaAdminSettings()
  if (!local) {
    rememberPalhaAdminSettings(remote)
    return remote
  }
  if (albumId) {
    const remoteHas = remote.gallery.albums.some((album) => album.id === albumId)
    if (remoteHas) {
      rememberPalhaAdminSettings(remote)
      return remote
    }
    if (local.gallery.albums.some((album) => album.id === albumId)) {
      const synced = syncAlbumPasswordFlags(local, remote)
      rememberPalhaAdminSettings(synced)
      return synced
    }
  }
  if (local.gallery.albums.length > remote.gallery.albums.length) {
    const synced = syncAlbumPasswordFlags(local, remote)
    rememberPalhaAdminSettings(synced)
    return synced
  }
  rememberPalhaAdminSettings(remote)
  return remote
}
