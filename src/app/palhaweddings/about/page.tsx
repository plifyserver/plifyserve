import type { Metadata } from 'next'
import { PalhaReveal } from '../PalhaReveal'
import { PalhaRichText } from '../PalhaRichText'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { splitLines, splitParagraphs, whatsappHref } from '@/lib/palha/site-settings-shared'

export const metadata: Metadata = {
  title: 'About',
}

export default async function PalhaAboutPage() {
  const settings = await getPalhaSiteSettings()
  const { photos, copy } = settings
  const reserveHref = whatsappHref(settings.whatsapp)
  const beyondItems = splitLines(copy.beyond.text)
  const beyondMid = Math.ceil(beyondItems.length / 2)
  const ctaButton = copy.cta.button || 'Reserve minha data'

  return (
    <main>
      <section className="palha-about-hero">
        <div className="palha-about-hero-copy">
          {copy.hero.label ? (
            <PalhaReveal>
              <p className="palha-label">
                <PalhaRichText text={copy.hero.label} />
              </p>
            </PalhaReveal>
          ) : null}
          {copy.hero.title ? (
            <PalhaReveal delay={160}>
              <h1 className="palha-kicker palha-kicker-hero">
                <PalhaRichText text={copy.hero.title} />
              </h1>
            </PalhaReveal>
          ) : null}
          {copy.hero.subtitle ? (
            <PalhaReveal delay={280}>
              <p className="palha-script-lg palha-script-overlap">
                <PalhaRichText text={copy.hero.subtitle} />
              </p>
            </PalhaReveal>
          ) : null}
          {copy.hero.text ? (
            <PalhaReveal delay={420}>
              <div className="palha-about-hero-body">
                {splitParagraphs(copy.hero.text).map((paragraph) => (
                  <p key={paragraph} className="palha-copy">
                    <PalhaRichText text={paragraph} />
                  </p>
                ))}
              </div>
            </PalhaReveal>
          ) : null}
        </div>
        <PalhaReveal className="palha-about-hero-photo" delay={120}>
          <img src={photos.hero} alt="" />
        </PalhaReveal>
      </section>

      <section className="palha-promise-section">
        <PalhaReveal className="palha-promise-collage">
          <img className="palha-promise-main" src={photos.terrace} alt="" />
          <div className="palha-polaroid palha-promise-polaroid">
            <img src={photos.portrait} alt="" />
          </div>
        </PalhaReveal>
        <div className="palha-promise-copy">
          {copy.promise.label ? (
            <PalhaReveal>
              <p className="palha-label">
                <PalhaRichText text={copy.promise.label} />
              </p>
            </PalhaReveal>
          ) : null}
          {copy.promise.title ? (
            <PalhaReveal delay={160}>
              <h2 className="palha-kicker palha-kicker-promise">
                <PalhaRichText text={copy.promise.title} />
              </h2>
            </PalhaReveal>
          ) : null}
          {copy.promise.text ? (
            <PalhaReveal delay={320}>
              <div>
                {splitParagraphs(copy.promise.text).map((paragraph) => (
                  <p key={paragraph} className="palha-copy">
                    <PalhaRichText text={paragraph} />
                  </p>
                ))}
              </div>
            </PalhaReveal>
          ) : null}
        </div>
      </section>

      <section className="palha-beyond">
        <PalhaReveal>
          <img className="palha-photo is-tilt-left" src={photos.beyond} alt="" />
        </PalhaReveal>
        <div>
          <PalhaReveal delay={120}>
            {copy.beyond.label ? (
              <p className="palha-label">
                <PalhaRichText text={copy.beyond.label} />
              </p>
            ) : null}
            {copy.beyond.title ? (
              <h2 className="palha-kicker" style={{ fontSize: 'clamp(1.4rem, 3.4vw, 2.2rem)', margin: '0.75rem 0 0.5rem' }}>
                <PalhaRichText text={copy.beyond.title} />
              </h2>
            ) : null}
            {copy.beyond.subtitle ? (
              <p className="palha-script-lg" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', margin: '0.6rem 0 1.4rem' }}>
                <PalhaRichText text={copy.beyond.subtitle} />
              </p>
            ) : null}
          </PalhaReveal>
          {beyondItems.length ? (
            <PalhaReveal delay={280}>
              <div className="palha-lists">
                <ul className="palha-copy" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {beyondItems.slice(0, beyondMid).map((item) => (
                    <li key={item}>
                      <PalhaRichText text={item} />
                    </li>
                  ))}
                </ul>
                <ul className="palha-copy" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {beyondItems.slice(beyondMid).map((item) => (
                    <li key={item}>
                      <PalhaRichText text={item} />
                    </li>
                  ))}
                </ul>
              </div>
            </PalhaReveal>
          ) : null}
        </div>
      </section>

      <section
        className="palha-cta"
        style={{ ['--palha-cta-image' as string]: `url("${photos.cta}")` }}
      >
        <PalhaReveal>
          {copy.cta.title ? (
            <h2 className="palha-kicker" style={{ color: '#fff' }}>
              <PalhaRichText text={copy.cta.title} />
            </h2>
          ) : null}
          {copy.cta.subtitle ? (
            <p className="palha-script-lg" style={{ margin: '0.9rem 0 1.8rem' }}>
              <PalhaRichText text={copy.cta.subtitle} />
            </p>
          ) : null}
          {reserveHref ? (
            <a
              href={reserveHref}
              target="_blank"
              rel="noreferrer"
              className="palha-btn"
              style={{ color: '#fff', borderColor: '#fff' }}
            >
              <PalhaRichText text={ctaButton} />
            </a>
          ) : (
            <span className="palha-btn" style={{ color: '#fff', borderColor: '#fff' }}>
              <PalhaRichText text={ctaButton} />
            </span>
          )}
        </PalhaReveal>
      </section>
    </main>
  )
}
