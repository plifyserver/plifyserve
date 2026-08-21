import { unstable_noStore as noStore } from 'next/cache'
import { createPalhaServiceClient } from '@/lib/palha/supabase/server'
import {
  DEFAULT_PALHA_SITE_SETTINGS,
  PALHA_SITE_BUCKET,
  mergePalhaSiteSettings,
  preserveAlbumPasswordHashes,
  publicizeSiteSettings,
  type PalhaPhotoSlot,
  type PalhaSiteSettings,
} from '@/lib/palha/site-settings-shared'
import { hashPalhaAlbumPassword } from '@/lib/palha/album-password'
import { encryptPalhaAlbumPassword } from '@/lib/palha/album-secret'
import { createPalhaR2SignedUpload, purgeRemovedPalhaR2Media, uploadPalhaR2Object } from '@/lib/palha/r2'

export {
  DEFAULT_PALHA_SITE_SETTINGS,
  PALHA_PAGE_BLOCKS,
  PALHA_SITE_BUCKET,
  mergePalhaSiteSettings,
  publicizeSiteSettings,
  splitLines,
  splitParagraphs,
  whatsappHref,
  type PalhaPhotoSlot,
  type PalhaSiteSettings,
} from '@/lib/palha/site-settings-shared'

const SETTINGS_PATH = 'settings.json'

let settingsWrite: Promise<unknown> = Promise.resolve()

function enqueueSettingsWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = settingsWrite.then(fn, fn)
  settingsWrite = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function ensureBucket() {
  const supabase = createPalhaServiceClient()
  const { data } = await supabase.storage.listBuckets()
  if (data?.some((bucket) => bucket.name === PALHA_SITE_BUCKET)) return supabase
  await supabase.storage.createBucket(PALHA_SITE_BUCKET, { public: true })
  return supabase
}

async function readPalhaSiteSettings(): Promise<PalhaSiteSettings> {
  const supabase = createPalhaServiceClient()
  const { data, error } = await supabase.storage.from(PALHA_SITE_BUCKET).download(SETTINGS_PATH)
  if (error || !data) return DEFAULT_PALHA_SITE_SETTINGS
  const text = await data.text()
  return mergePalhaSiteSettings(JSON.parse(text) as unknown)
}

export async function getPalhaSiteSettings(): Promise<PalhaSiteSettings> {
  noStore()
  try {
    return await readPalhaSiteSettings()
  } catch {
    return DEFAULT_PALHA_SITE_SETTINGS
  }
}

async function writePalhaSiteSettings(merged: PalhaSiteSettings) {
  const supabase = await ensureBucket()
  const body = JSON.stringify(merged, null, 2)
  const { error } = await supabase.storage
    .from(PALHA_SITE_BUCKET)
    .upload(SETTINGS_PATH, new Blob([body], { type: 'application/json' }), {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0',
    })
  if (error) throw new Error(error.message)
  return merged
}

export async function savePalhaSiteSettings(settings: PalhaSiteSettings) {
  return enqueueSettingsWrite(async () => {
    const current = await readPalhaSiteSettings()
    const merged = mergePalhaSiteSettings({
      ...current,
      ...settings,
      photos: { ...current.photos, ...settings.photos },
      copy: settings.copy ?? current.copy,
      gallery: settings.gallery ?? current.gallery,
    })
    merged.gallery.albums = preserveAlbumPasswordHashes(merged.gallery.albums, current.gallery.albums)
    const saved = await writePalhaSiteSettings(merged)
    try {
      await purgeRemovedPalhaR2Media(current, saved)
    } catch {
      // A exclusão no R2 não pode desfazer o save.
    }
    return saved
  })
}

export async function setPalhaAlbumPassword(albumId: string, password: string) {
  return enqueueSettingsWrite(async () => {
    const current = await readPalhaSiteSettings()
    const album = current.gallery.albums.find((item) => item.id === albumId)
    if (!album) throw new Error('Álbum não encontrado')
    const trimmed = password.trim()
    const passwordHash = trimmed ? await hashPalhaAlbumPassword(trimmed) : ''
    const accessSecret = trimmed ? encryptPalhaAlbumPassword(trimmed) : ''
    const next: PalhaSiteSettings = {
      ...current,
      gallery: {
        ...current.gallery,
        albums: current.gallery.albums.map((item) =>
          item.id === albumId
            ? { ...item, passwordHash, accessSecret, passwordProtected: Boolean(passwordHash) }
            : item,
        ),
      },
    }
    return writePalhaSiteSettings(next)
  })
}

export async function uploadPalhaSitePhoto(slot: PalhaPhotoSlot, file: File) {
  return uploadPalhaR2Object(`photos/${slot}`, file)
}

export async function createPalhaSignedUpload(folder: string, filename: string, contentType?: string) {
  return createPalhaR2SignedUpload(folder, filename, contentType)
}
