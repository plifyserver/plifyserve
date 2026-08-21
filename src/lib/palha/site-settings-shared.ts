import { DEFAULT_PALHA_ALBUM_THEME, mergePalhaAlbumTheme, type PalhaAlbumTheme } from '@/lib/palha/album-theme'

export const PALHA_SITE_BUCKET = 'palha-site'

export type PalhaPhotoSlot = 'hero' | 'terrace' | 'portrait' | 'beyond' | 'cta'

export type PalhaCopyBlock = {
  label: string
  title: string
  subtitle: string
  text: string
  button: string
}

export const PALHA_PAGE_BLOCKS: {
  id: 'hero' | 'promise' | 'beyond' | 'cta'
  label: string
  photos: { slot: PalhaPhotoSlot; label: string }[]
  fields: { key: keyof PalhaCopyBlock; label: string; multiline?: boolean }[]
}[] = [
  {
    id: 'hero',
    label: 'Bloco 1 — abertura',
    photos: [{ slot: 'hero', label: 'Foto principal' }],
    fields: [
      { key: 'label', label: 'Pré-título' },
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
      { key: 'text', label: 'Texto', multiline: true },
    ],
  },
  {
    id: 'promise',
    label: 'Bloco 2 — promessa artística',
    photos: [
      { slot: 'terrace', label: 'Foto do terraço' },
      { slot: 'portrait', label: 'Polaroid' },
    ],
    fields: [
      { key: 'label', label: 'Pré-título' },
      { key: 'title', label: 'Título' },
      { key: 'text', label: 'Texto', multiline: true },
    ],
  },
  {
    id: 'beyond',
    label: 'Bloco 3 — beyond the lens',
    photos: [{ slot: 'beyond', label: 'Foto' }],
    fields: [
      { key: 'label', label: 'Pré-título' },
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
      { key: 'text', label: 'Lista (um item por linha)', multiline: true },
    ],
  },
  {
    id: 'cta',
    label: 'Bloco 4 — convite final',
    photos: [{ slot: 'cta', label: 'Foto de fundo' }],
    fields: [
      { key: 'title', label: 'Título' },
      { key: 'subtitle', label: 'Subtítulo' },
      { key: 'button', label: 'Texto do botão' },
    ],
  },
]

export type PalhaSiteSettings = {
  instagramUrl: string
  facebookUrl: string
  whatsapp: string
  photos: Record<PalhaPhotoSlot, string>
  copy: Record<'hero' | 'promise' | 'beyond' | 'cta', PalhaCopyBlock>
  gallery: PalhaGallery
}

export type PalhaMediaKind = 'image' | 'video'

export type PalhaMediaItem = {
  id: string
  url: string
  kind: PalhaMediaKind
  caption: string
}

export type PalhaSubAlbum = {
  id: string
  name: string
  items: PalhaMediaItem[]
}

export type PalhaAlbum = {
  id: string
  name: string
  eventDate: string
  coverUrl: string
  theme: PalhaAlbumTheme
  subalbums: PalhaSubAlbum[]
  passwordProtected: boolean
  createdAt?: string
  passwordHash?: string
  accessSecret?: string
}

export type PalhaGallery = {
  title: string
  subtitle: string
  albums: PalhaAlbum[]
}

export function palhaAdminPrefix(pathname: string) {
  return pathname.startsWith('/palhaweddings') ? '/palhaweddings/admin' : '/admin'
}

export function palhaPublicPrefix(pathname: string) {
  return pathname.startsWith('/palhaweddings') ? '/palhaweddings' : ''
}

export function newPalhaId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createPalhaAlbum(name: string, eventDate: string): PalhaAlbum {
  return {
    id: newPalhaId('album'),
    name: name.trim() || 'Novo álbum',
    eventDate,
    coverUrl: '',
    theme: { ...DEFAULT_PALHA_ALBUM_THEME },
    passwordProtected: false,
    createdAt: new Date().toISOString(),
    subalbums: [{ id: newPalhaId('sub'), name: 'Destaques', items: [] }],
  }
}

export function albumHasPassword(album: PalhaAlbum) {
  return Boolean(album.passwordHash) || album.passwordProtected
}

export function stripAlbumSecrets(album: PalhaAlbum): PalhaAlbum {
  const { passwordHash: _passwordHash, accessSecret: _accessSecret, ...rest } = album
  return {
    ...rest,
    passwordProtected: albumHasPassword(album),
  }
}

export function redactLockedAlbum(album: PalhaAlbum): PalhaAlbum {
  const safe = stripAlbumSecrets(album)
  return {
    ...safe,
    subalbums: safe.subalbums.map((sub) => ({ ...sub, items: [] })),
  }
}

export function publicizeAlbum(album: PalhaAlbum, unlocked: boolean): PalhaAlbum {
  if (albumHasPassword(album) && !unlocked) return redactLockedAlbum(album)
  return stripAlbumSecrets(album)
}

export function publicizeSiteSettings(
  settings: PalhaSiteSettings,
  unlockedIds: Iterable<string> = [],
  admin = false,
): PalhaSiteSettings {
  const unlocked = new Set(unlockedIds)
  return {
    ...settings,
    gallery: {
      ...settings.gallery,
      albums: settings.gallery.albums.map((album) => {
        if (admin || unlocked.has(album.id) || !albumHasPassword(album)) {
          return stripAlbumSecrets(album)
        }
        return redactLockedAlbum(album)
      }),
    },
  }
}

export function preserveAlbumPasswordHashes(incoming: PalhaAlbum[], current: PalhaAlbum[]): PalhaAlbum[] {
  const previous = new Map(
    current.map((album) => [
      album.id,
      {
        passwordHash: album.passwordHash || '',
        accessSecret: album.accessSecret || '',
        createdAt: album.createdAt || '',
      },
    ]),
  )
  return incoming.map((album) => {
    const saved = previous.get(album.id)
    const passwordHash = album.passwordHash || saved?.passwordHash || ''
    return {
      ...album,
      passwordHash,
      accessSecret: album.accessSecret || saved?.accessSecret || '',
      createdAt: album.createdAt || saved?.createdAt || '',
      passwordProtected: Boolean(passwordHash),
    }
  })
}

export function albumMediaCount(album: PalhaAlbum) {
  return album.subalbums.reduce((total, sub) => total + sub.items.length, 0)
}

export function collectPalhaMediaUrls(settings: PalhaSiteSettings) {
  const urls = new Set<string>()
  for (const url of Object.values(settings.photos)) {
    if (url) urls.add(url)
  }
  for (const album of settings.gallery.albums) {
    if (album.coverUrl) urls.add(album.coverUrl)
    for (const sub of album.subalbums) {
      for (const item of sub.items) {
        if (item.url) urls.add(item.url)
      }
    }
  }
  return urls
}


export function mediaKindFromMime(mime: string): PalhaMediaKind {
  return mime.startsWith('video/') ? 'video' : 'image'
}

export function formatPalhaEventDate(value: string) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const emptyCopy = (): PalhaCopyBlock => ({
  label: '',
  title: '',
  subtitle: '',
  text: '',
  button: '',
})

export const DEFAULT_PALHA_SITE_SETTINGS: PalhaSiteSettings = {
  instagramUrl: '',
  facebookUrl: '',
  whatsapp: '',
  photos: {
    hero: '/palhaweddings/hero.webp',
    terrace: '/palhaweddings/terrace.webp',
    portrait: '/palhaweddings/portrait.jpg',
    beyond: '/palhaweddings/beyond.jpg',
    cta: '/palhaweddings/cta.jpg',
  },
  copy: {
    hero: {
      label: "Hello, I'm PALHA.",
      title: 'A storyteller *for* the wildly in love',
      subtitle: 'the woman behind the lens...',
      text: "I believe that your love story is a work of art, and I am endlessly inspired by the honor of preserving it. For as long as I can remember, I have been drawn to the quiet, graceful moments—the kinds that often go unnoticed but hold the most meaning. It's the gentle squeeze of a hand, a tear brushed away during the vows, the shared glance across a candlelit room. This is where the magic lives, and this is what I seek to capture.\n\nMy journey into photography was born from a love of classic novels and art history, where every detail has a purpose and every frame tells a story. I bring that same intentionality to your wedding day, creating images that are not only beautiful today but will become more precious with every passing year.",
      button: '',
    },
    promise: {
      label: 'My artistic promise',
      title: 'Timeless imagery *for* the modern romantic',
      subtitle: '',
      text: 'My style is a delicate blend of fine art and photojournalism. For your portraits, I offer gentle guidance to help you feel comfortable and look your most beautiful, creating elegant, artfully composed images. For the rest of your day, I take a documentary approach, capturing authentic moments as they unfold naturally. The result is a gallery filled with light, emotion, and an effortless sophistication that will stand the test of time.',
      button: '',
    },
    beyond: {
      label: 'Beyond the lens',
      title: "When I'm not behind camera",
      subtitle: 'a few of my favorite things...',
      text: "My weekly visit to the farmer's market for fresh flowers.\nPlanning my next trip to the English countryside or the coast of Italy.\nCurling up with my golden retriever, Leo, and a classic film.\nStarting the day slowly with a cup of tea and my journal.\nWandering through a new city with no destination in mind.\nThe scent of peonies and old books.",
      button: '',
    },
    cta: {
      label: '',
      title: 'Lets start your chapter',
      subtitle: 'make magic happen.',
      text: '',
      button: 'Reserve minha data',
    },
  },
  gallery: {
    title: 'Galeria',
    subtitle: 'Momentos que merecem ser revistos.',
    albums: [],
  },
}

export function whatsappHref(raw: string, message = '') {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return ''
  const waUrl = trimmed.match(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s]+/i)
  if (waUrl) return waUrl[0]
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 10) return ''
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  const href = `https://wa.me/${withCountry}`
  const text = message.trim()
  return text ? `${href}?text=${encodeURIComponent(text)}` : href
}

function mergeCopy(raw: unknown, fallback: PalhaCopyBlock): PalhaCopyBlock {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<PalhaCopyBlock>
  return {
    ...emptyCopy(),
    ...fallback,
    ...data,
  }
}

function mergeMedia(raw: unknown, index: number): PalhaMediaItem | null {
  if (!raw || typeof raw !== 'object' || !('url' in raw)) return null
  const item = raw as Partial<PalhaMediaItem> & { caption?: string }
  return {
    id: String(item.id || `media-${index}`),
    url: String(item.url),
    kind: item.kind === 'video' ? 'video' : 'image',
    caption: String(item.caption ?? ''),
  }
}

function mergeSubalbum(raw: unknown, index: number): PalhaSubAlbum | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<PalhaSubAlbum>
  const items = Array.isArray(data.items)
    ? data.items.map((item, itemIndex) => mergeMedia(item, itemIndex)).filter((item): item is PalhaMediaItem => Boolean(item))
    : []
  return {
    id: String(data.id || `sub-${index}`),
    name: String(data.name || 'Destaques'),
    items,
  }
}

function mergeAlbum(raw: unknown, index: number): PalhaAlbum | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<PalhaAlbum>
  const subalbums = Array.isArray(data.subalbums)
    ? data.subalbums.map((sub, subIndex) => mergeSubalbum(sub, subIndex)).filter((sub): sub is PalhaSubAlbum => Boolean(sub))
    : []
  const passwordHash = String(data.passwordHash || '')
  return {
    id: String(data.id || `album-${index}`),
    name: String(data.name || 'Álbum'),
    eventDate: String(data.eventDate || ''),
    coverUrl: String(data.coverUrl || ''),
    createdAt: String(data.createdAt || ''),
    theme: mergePalhaAlbumTheme(data.theme),
    passwordHash,
    accessSecret: String(data.accessSecret || ''),
    passwordProtected: Boolean(passwordHash),
    subalbums: subalbums.length ? subalbums : [{ id: `destaques-${index}`, name: 'Destaques', items: [] }],
  }
}

function mergeGallery(raw: unknown, fallback: PalhaGallery): PalhaGallery {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<PalhaGallery> & {
    items?: unknown[]
  }
  const albums = Array.isArray(data.albums)
    ? data.albums.map((album, index) => mergeAlbum(album, index)).filter((album): album is PalhaAlbum => Boolean(album))
    : null
  const legacyItems = Array.isArray(data.items)
    ? data.items.map((item, index) => mergeMedia(item, index)).filter((item): item is PalhaMediaItem => Boolean(item))
    : []

  return {
    title: String(data.title ?? fallback.title),
    subtitle: String(data.subtitle ?? fallback.subtitle),
    albums:
      albums ??
      (legacyItems.length
        ? [
            {
              id: 'album-legado',
              name: 'Destaques',
              eventDate: '',
              coverUrl: legacyItems[0]?.url || '',
              createdAt: '',
              theme: { ...DEFAULT_PALHA_ALBUM_THEME },
              passwordProtected: false,
              subalbums: [{ id: 'destaques', name: 'Destaques', items: legacyItems }],
            },
          ]
        : fallback.albums),
  }
}

export function palhaInstagramHref(raw: string) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const handle = value.replace(/^@/, '')
  if (/^[a-zA-Z0-9._]{1,30}$/.test(handle) && !handle.includes('://')) {
    return `https://www.instagram.com/${handle}/`
  }
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    if (host !== 'instagram.com' && host !== 'instagr.am') return ''
    const path = url.pathname.replace(/\/+$/, '')
    if (!path || path === '/') return ''
    return `https://www.instagram.com${path}/`
  } catch {
    return ''
  }
}

export function mergePalhaSiteSettings(raw: unknown): PalhaSiteSettings {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<PalhaSiteSettings> & {
    copy?: Partial<PalhaSiteSettings['copy']>
  }
  return {
    instagramUrl: palhaInstagramHref(String(data.instagramUrl ?? '')),
    facebookUrl: '',
    whatsapp: String(data.whatsapp ?? ''),
    photos: {
      ...DEFAULT_PALHA_SITE_SETTINGS.photos,
      ...(data.photos ?? {}),
    },
    copy: {
      hero: mergeCopy(data.copy?.hero, DEFAULT_PALHA_SITE_SETTINGS.copy.hero),
      promise: mergeCopy(data.copy?.promise, DEFAULT_PALHA_SITE_SETTINGS.copy.promise),
      beyond: mergeCopy(data.copy?.beyond, DEFAULT_PALHA_SITE_SETTINGS.copy.beyond),
      cta: mergeCopy(data.copy?.cta, DEFAULT_PALHA_SITE_SETTINGS.copy.cta),
    },
    gallery: mergeGallery(data.gallery, DEFAULT_PALHA_SITE_SETTINGS.gallery),
  }
}

export function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function splitLines(text: string) {
  return text
    .split('\n')
    .map((part) => part.trim())
    .filter(Boolean)
}
