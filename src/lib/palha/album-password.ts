import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import type { NextRequest } from 'next/server'
import { albumHasPassword, type PalhaAlbum, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'
import { getPalhaServiceRoleKey } from '@/lib/palha/supabase/env'

const scrypt = promisify(scryptCb)
const UNLOCK_MAX_AGE = 60 * 60 * 24 * 30

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

function unlockSigningKey() {
  return process.env.PALHA_SECRETS_KEY?.trim() || getPalhaServiceRoleKey() || 'palha-album-unlock'
}

export function albumUnlockToken(album: PalhaAlbum) {
  if (!album.passwordHash) return ''
  return createHmac('sha256', unlockSigningKey()).update(`palha-unlock:${album.id}:${album.passwordHash}`).digest('hex')
}

export function albumUnlockCookieMatches(album: PalhaAlbum, cookieValue?: string | null) {
  const expected = albumUnlockToken(album)
  if (!expected || !cookieValue) return false
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(cookieValue)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function isAlbumUnlocked(album: PalhaAlbum, cookieValue?: string | null) {
  if (!albumHasPassword(album)) return true
  return albumUnlockCookieMatches(album, cookieValue)
}

export function unlockedAlbumIdsFromRequest(request: NextRequest, settings: PalhaSiteSettings) {
  return settings.gallery.albums
    .filter((album) => isAlbumUnlocked(album, request.cookies.get(albumUnlockCookieName(album.id))?.value))
    .map((album) => album.id)
}

function albumUnlockCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

export function palhaAlbumUnlockCookie(album: PalhaAlbum) {
  return {
    name: albumUnlockCookieName(album.id),
    value: albumUnlockToken(album),
    options: albumUnlockCookieOptions(UNLOCK_MAX_AGE),
  }
}

export function palhaAlbumLockCookie(albumId: string) {
  return {
    name: albumUnlockCookieName(albumId),
    value: '',
    options: albumUnlockCookieOptions(0),
  }
}
