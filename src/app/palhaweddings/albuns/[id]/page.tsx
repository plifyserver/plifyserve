import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { isAlbumUnlocked } from '@/lib/palha/album-password'
import { publicizeAlbum, type PalhaAlbum } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { PalhaAlbumPublicClient } from './PalhaAlbumPublicClient'

type Props = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'
export const revalidate = 0

function albumShareImage(album: PalhaAlbum) {
  if (album.coverUrl) return album.coverUrl
  for (const sub of album.subalbums) {
    const photo = sub.items.find((item) => item.kind === 'image' && item.url)
    if (photo?.url) return photo.url
  }
  return ''
}

async function publicOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'palhaweddings.plify360.com.br'
  const proto = h.get('x-forwarded-proto') || 'https'
  return `${proto}://${host.split(',')[0].trim()}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  const origin = await publicOrigin()
  const title = album?.name || 'Álbum'
  const description = album?.summary?.trim() || 'Galeria de fotos e filmes de casamento.'
  const image = album ? albumShareImage(album) : ''
  const url = `${origin}/albuns/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Palha Weddings`,
      description,
      url,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Palha Weddings',
      images: image
        ? [
            {
              url: image,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} — Palha Weddings`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function PalhaAlbumPublicPage({ params }: Props) {
  const { id } = await params
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  if (!album) notFound()

  const unlocked = isAlbumUnlocked(album)

  return (
    <PalhaAlbumPublicClient
      albumId={id}
      initial={publicizeAlbum(album, unlocked)}
      locked={!unlocked}
    />
  )
}
