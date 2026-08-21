import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { getPalhaServiceRoleKey } from '@/lib/palha/supabase/env'

function albumSecretKey() {
  const raw = process.env.PALHA_SECRETS_KEY?.trim() || getPalhaServiceRoleKey() || 'palha-album-secret'
  return scryptSync(raw, 'palha-album-access', 32)
}

export function encryptPalhaAlbumPassword(password: string) {
  const plain = password.trim()
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', albumSecretKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptPalhaAlbumPassword(stored: string) {
  const value = String(stored || '')
  if (!value) return ''
  const [version, ivHex, tagHex, dataHex] = value.split(':')
  if (version !== 'v1' || !ivHex || !tagHex || !dataHex) return ''
  try {
    const decipher = createDecipheriv('aes-256-gcm', albumSecretKey(), Buffer.from(ivHex, 'hex'))
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}
