import type { Metadata } from 'next'
import { PalhaReveal } from './PalhaReveal'

export const metadata: Metadata = { title: 'Em breve' }

export default function PalhaComingSoonPage({ title }: { title: string }) {
  return (
    <main style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
      <div>
        <PalhaReveal>
          <p className="palha-label">{title}</p>
        </PalhaReveal>
        <PalhaReveal delay={180}>
          <h1 className="palha-kicker" style={{ fontSize: '2rem', marginTop: '0.8rem' }}>
            Em breve
          </h1>
        </PalhaReveal>
      </div>
    </main>
  )
}
