import type { Metadata } from 'next'
import { Fraunces, Outfit, Cormorant_Garamond, Oswald, Raleway } from 'next/font/google'
import { PalhaChrome } from './PalhaChrome'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { publicizeSiteSettings } from '@/lib/palha/site-settings-shared'
import './palha.css'

const display = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-palha-display',
  display: 'swap',
})

const sans = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-palha-sans',
  display: 'swap',
})

const elegant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-palha-elegant',
  display: 'swap',
})

const impact = Oswald({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-palha-impact',
  display: 'swap',
})

const airy = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-palha-airy',
  display: 'swap',
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Palha Weddings',
    template: '%s — Palha Weddings',
  },
  description: 'Galerias de fotos e filmes de casamento.',
  manifest: undefined,
  icons: {
    icon: '/palhaweddings/logo.png',
    shortcut: '/palhaweddings/logo.png',
    apple: '/palhaweddings/logo.png',
  },
}

export default async function PalhaWeddingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = publicizeSiteSettings(await getPalhaSiteSettings())
  return (
    <div className={`${display.variable} ${sans.variable} ${elegant.variable} ${impact.variable} ${airy.variable}`}>
      <PalhaChrome settings={settings}>{children}</PalhaChrome>
    </div>
  )
}
