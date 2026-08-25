import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { isAlbumUnlocked } from '@/lib/palha/album-password'
import { palhaAlbumShareImage, publicizeAlbum } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { PalhaAlbumPublicClient } from './PalhaAlbumPublicClient'

type Props = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'
export const revalidate = 0

function shareVersion(url: string) {
  const name = url.split('/').pop() || 'capa'
  return name.replace(/[^\w.-]+/g, '').slice(0, 40) || 'capa'
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
  const source = album ? palhaAlbumShareImage(album) : ''
  const image = source ? `${origin}/api/palha/og/${encodeURIComponent(id)}?v=${shareVersion(source)}` : ''
  const url = `${origin}/albuns/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
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
              secureUrl: image,
              width: 1200,
              height: 630,
              type: 'image/jpeg',
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
