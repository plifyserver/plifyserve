import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import type { NextRequest } from 'next/server'
import { albumHasPassword, type PalhaAlbum, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'

const scrypt = promisify(scryptCb)

export const PALHA_ALBUM_COOKIE_PREFIX = 'palha-album-'

export function albumUnlockCookieName(albumId: string) {
  return `${PALHA_ALBUM_COOKIE_PREFIX}${albumId}`
}

export async function hashPalhaAlbumPassword(password: string) {
  const salt = randomBytes(16)
  const key = (await scrypt(password, salt, 32)) as Buffer
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPalhaAlbumPassword(password: string, stored: string) {
  const [scheme, saltHex, keyHex] = stored.split(':')
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false
  const key = (await scrypt(password, Buffer.from(saltHex, 'hex'), 32)) as Buffer
  const expected = Buffer.from(keyHex, 'hex')
  if (key.length !== expected.length) return false
  return timingSafeEqual(key, expected)
}

export function isAlbumUnlocked(album: PalhaAlbum) {
  return !albumHasPassword(album)
}

export function unlockedAlbumIdsFromRequest(_request: NextRequest, settings: PalhaSiteSettings) {
  return settings.gallery.albums.filter((album) => !albumHasPassword(album)).map((album) => album.id)
}

export function palhaAlbumLockCookie(albumId: string) {
  return {
    name: albumUnlockCookieName(albumId),
    value: '',
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    },
  }
}
