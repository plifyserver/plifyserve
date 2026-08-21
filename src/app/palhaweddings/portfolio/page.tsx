import type { Metadata } from 'next'
import { PalhaReveal } from '../PalhaReveal'
import { PalhaRichText } from '../PalhaRichText'
import { PalhaGalleryAlbums } from './PalhaGalleryAlbums'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { publicizeSiteSettings } from '@/lib/palha/site-settings-shared'

export const metadata: Metadata = {
  title: 'Gallery',
}

export default async function PalhaGalleryPage() {
  const { gallery } = publicizeSiteSettings(await getPalhaSiteSettings())

  return (
    <main className="palha-gallery-page">
      <header className="palha-gallery-intro">
        {gallery.title ? (
          <PalhaReveal>
            <h1 className="palha-kicker">
              <PalhaRichText text={gallery.title} />
            </h1>
          </PalhaReveal>
        ) : null}
        {gallery.subtitle ? (
          <PalhaReveal delay={160}>
            <p className="palha-script-lg">
              <PalhaRichText text={gallery.subtitle} />
            </p>
          </PalhaReveal>
        ) : null}
      </header>
      <PalhaGalleryAlbums gallery={gallery} />
    </main>
  )
}
