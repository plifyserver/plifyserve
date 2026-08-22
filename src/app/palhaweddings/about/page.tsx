import type { Metadata } from 'next'
import { PalhaReveal } from '../PalhaReveal'
import { PalhaRichText } from '../PalhaRichText'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { splitLines, splitParagraphs, whatsappHref } from '@/lib/palha/site-settings-shared'

export const metadata: Metadata = {
  title: {
    absolute: 'Palha Weddings',
  },
}

export default async function PalhaAboutPage() {
  const settings = await getPalhaSiteSettings()
  const { photos, copy } = settings
  const reserveHref = whatsappHref(settings.whatsapp, 'Olá! Gostaria de reservar uma data.')
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
            <p className="palha-kicker palha-cta-sub">
              <PalhaRichText text={copy.cta.subtitle} />
            </p>
          ) : null}
          {reserveHref ? (
            <a
              href={reserveHref}
              target="_blank"
              rel="noreferrer"
              className="palha-btn palha-cta-btn"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2.8A9.2 9.2 0 0 0 2.9 11.9c0 1.62.43 3.2 1.24 4.6L2 22l5.66-1.48a9.2 9.2 0 0 0 4.38 1.12h.01A9.2 9.2 0 0 0 21.2 12 9.2 9.2 0 0 0 12.04 2.8Zm0 16.84h-.01a7.64 7.64 0 0 1-3.89-1.06l-.28-.17-3.36.88.9-3.27-.18-.3a7.64 7.64 0 0 1-1.17-4.07 7.66 7.66 0 0 1 7.64-7.65 7.66 7.66 0 0 1 7.65 7.64 7.66 7.66 0 0 1-7.3 7.99Zm4.2-5.72c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.52.12-.15.23-.6.75-.73.9-.13.15-.27.17-.5.06-.23-.12-.97-.36-1.85-1.14-.68-.61-1.14-1.36-1.28-1.59-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.12-.13.15-.23.23-.38.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4h-.44c-.15 0-.4.06-.61.29-.21-.23-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.61 2.46 3.9 3.45.55.24.97.38 1.3.48.55.18 1.05.15 1.44.09.44-.07 1.36-.55 1.55-1.09.19-.53.19-.99.13-1.08-.05-.1-.21-.15-.44-.27Z" />
              </svg>
              <span>
                <PalhaRichText text={ctaButton} />
              </span>
            </a>
          ) : (
            <span className="palha-btn palha-cta-btn">
              <PalhaRichText text={ctaButton} />
            </span>
          )}
        </PalhaReveal>
      </section>
    </main>
  )
}
