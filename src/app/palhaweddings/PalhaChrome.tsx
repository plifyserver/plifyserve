'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PalhaReveal } from './PalhaReveal'
import { whatsappHref, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'

const PRIMARY = [
  { href: '/', label: 'Inicio' },
  { href: '/portfolio', label: 'Albuns' },
]

function usePalhaPrefix() {
  const pathname = usePathname()
  return pathname.startsWith('/palhaweddings') ? '/palhaweddings' : ''
}

function palhaHref(prefix: string, href: string) {
  if (href === '/') return prefix || '/'
  return `${prefix}${href}`
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function AdminLockLink() {
  const prefix = usePalhaPrefix()
  return (
    <Link href={palhaHref(prefix, '/admin')} className="palha-lock" aria-label="Área restrita">
      <LockIcon />
    </Link>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const prefix = usePalhaPrefix()
  const dest = palhaHref(prefix, href)
  const home = dest === prefix || dest === '/'
  const current =
    pathname === dest ||
    pathname === href ||
    (home && (pathname === `${prefix}/about` || pathname === '/about'))
  return (
    <Link href={dest} aria-current={current ? 'page' : undefined}>
      {label}
    </Link>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M14.5 8H17V5h-2.5C12 5 11 6.7 11 9v2H8v3h3v8h3v-8h2.7l.3-3H14V9.2c0-.6.4-1.2 1.2-1.2H14.5Z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12.04 3C7.35 3 3.54 6.74 3.54 11.35c0 1.85.54 3.58 1.47 5.03L3 21l4.78-1.94c1.37.74 2.94 1.16 4.26 1.16 4.69 0 8.5-3.74 8.5-8.35S16.73 3 12.04 3Zm0 15.28c-1.13 0-2.48-.37-3.55-.99l-.25-.14-2.84 1.15.98-2.7-.16-.27a6.7 6.7 0 0 1-1.12-3.73c0-3.7 3.08-6.71 6.94-6.71 3.86 0 6.94 3.01 6.94 6.71 0 3.7-3.08 6.68-6.94 6.68Zm3.8-4.96c-.21-.1-1.23-.6-1.42-.67-.19-.07-.33-.1-.47.1-.14.21-.54.67-.66.81-.12.14-.24.15-.45.05-.21-.1-.88-.32-1.67-.99-.62-.54-1.03-1.2-1.15-1.41-.12-.21-.01-.32.09-.42.09-.09.21-.24.31-.35.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.36-.05-.1-.47-1.12-.64-1.53-.17-.41-.34-.35-.47-.35h-.4c-.14 0-.36.05-.55.26-.19.21-.72.7-.72 1.7s.74 1.97.84 2.11c.1.14 1.45 2.32 3.58 3.16.5.21.89.33 1.2.42.5.16.96.14 1.32.08.4-.06 1.23-.5 1.4-.98.17-.48.17-.89.12-.98-.05-.08-.19-.14-.4-.24Z" />
    </svg>
  )
}

function SocialLinks({ settings }: { settings: PalhaSiteSettings }) {
  const wa = whatsappHref(settings.whatsapp)
  return (
    <>
      {settings.instagramUrl ? (
        <a href={settings.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
          <InstagramIcon />
        </a>
      ) : null}
      {settings.facebookUrl ? (
        <a href={settings.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook">
          <FacebookIcon />
        </a>
      ) : null}
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <WhatsAppIcon />
        </a>
      ) : null}
    </>
  )
}

function isPalhaAlbumPublic(pathname: string) {
  return /\/portfolio\/[^/]+\/?$/.test(pathname)
}

function isPalhaAdminPath(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/palhaweddings/admin' ||
    pathname.startsWith('/palhaweddings/admin/')
  )
}

export function PalhaChrome({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: PalhaSiteSettings
}) {
  const prefix = usePalhaPrefix()
  const pathname = usePathname()

  if (isPalhaAdminPath(pathname)) {
    return <div className="palha-root palha-admin-root">{children}</div>
  }

  if (isPalhaAlbumPublic(pathname)) {
    return <div className="palha-root palha-present-root">{children}</div>
  }

  return (
    <div className="palha-root">
      <header className="palha-header">
        <nav className="palha-nav">
          {PRIMARY.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <Link href={palhaHref(prefix, '/')} className="palha-logo-link" aria-label="Palha Weddings">
          <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-logo" />
        </Link>
        <div className="palha-socials" aria-label="Redes">
          <AdminLockLink />
          <SocialLinks settings={settings} />
        </div>
      </header>
      {children}
      <footer className="palha-footer">
        <PalhaReveal>
          <div className="palha-footer-top">
            <Link href={palhaHref(prefix, '/')} className="palha-footer-brand" aria-label="Palha Weddings">
              <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-footer-logo" />
            </Link>
          </div>
        </PalhaReveal>
        <PalhaReveal delay={160}>
          <div className="palha-footer-rule">
            <span>01</span>
            <span className="palha-footer-rule-line" />
            <span className="palha-footer-always">Always, Forever</span>
            <span className="palha-footer-rule-line" />
            <span>04</span>
          </div>
        </PalhaReveal>
        <PalhaReveal delay={280}>
          <div className="palha-footer-socials" aria-label="Redes">
            <SocialLinks settings={settings} />
          </div>
        </PalhaReveal>
      </footer>
    </div>
  )
}
