import type { Metadata } from 'next'
import { PalhaChrome } from './PalhaChrome'
import { getPalhaSiteSettings } from '@/lib/palha/site-settings'
import { publicizeSiteSettings } from '@/lib/palha/site-settings-shared'
import './palha.css'

/**
 * Evita next/font/google no build Turbopack: o Google às vezes devolve
 * URLs /l/font?kit=...&skey=... que quebram com
 * "next/font/google queries have exactly one entry".
 */
const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600',
    'family=Fraunces:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700',
    'family=Great+Vibes',
    'family=Oswald:wght@500;700',
    'family=Outfit:wght@300;400;500;700',
    'family=Raleway:wght@300;400;500',
    'display=swap',
  ].join('&')

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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={GOOGLE_FONTS_HREF} rel="stylesheet" />
      <div className="palha-font-root">
        <PalhaChrome settings={settings}>{children}</PalhaChrome>
      </div>
    </>
  )
}
