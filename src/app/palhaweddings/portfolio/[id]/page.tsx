import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isAlbumUnlocked } from '@/lib/palha/album-password'
import { publicizeAlbum } from '@/lib/palha/site-settings-shared'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { PalhaAlbumPublicClient } from './PalhaAlbumPublicClient'

type Props = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { gallery } = await getPalhaSiteSettings()
  const album = gallery.albums.find((item) => item.id === id)
  return { title: album?.name || 'Álbum' }
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
