import type { Metadata } from 'next'
import { PalhaReveal } from '../PalhaReveal'
import { PalhaRichText } from '../PalhaRichText'
import { PalhaGalleryAlbums } from './PalhaGalleryAlbums'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { publicizeSiteSettings } from '@/lib/palha/site-settings-shared'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Álbuns',
}

export default async function PalhaAlbunsPage() {
  const { gallery } = publicizeSiteSettings(await getPalhaSiteSettings())

  return (
    <main className="palha-gallery-page">
      <div className="palha-gallery-atmosphere" aria-hidden="true" />
      <header className="palha-gallery-intro">
        <PalhaReveal>
          <div className="palha-gallery-intro-ornament" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
        </PalhaReveal>
        {gallery.title ? (
          <PalhaReveal delay={80}>
            <h1 className="palha-kicker">
              <PalhaRichText text={gallery.title} />
            </h1>
          </PalhaReveal>
        ) : null}
        {gallery.subtitle ? (
          <PalhaReveal delay={180}>
            <p className="palha-script-lg palha-gallery-intro-script">
              <PalhaRichText text={gallery.subtitle} />
            </p>
          </PalhaReveal>
        ) : null}
      </header>
      <PalhaGalleryAlbums gallery={gallery} />
    </main>
  )
}
