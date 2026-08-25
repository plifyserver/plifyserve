'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PalhaReveal } from './PalhaReveal'
import { palhaInstagramHref, whatsappHref, DEFAULT_PALHA_SITE_SETTINGS, type PalhaSiteSettings } from '@/lib/palha/site-settings-shared'

const PRIMARY = [
  { href: '/', label: 'Inicio' },
  { href: '/albuns', label: 'Álbuns' },
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
  const albunsPath = palhaHref(prefix, '/albuns')
  const onAlbuns =
    href === '/albuns' &&
    (pathname === albunsPath ||
      pathname === '/albuns' ||
      pathname.startsWith(`${albunsPath}/`) ||
      pathname.startsWith('/albuns/'))
  const current =
    pathname === dest ||
    pathname === href ||
    onAlbuns ||
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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2.8A9.2 9.2 0 0 0 2.9 11.9c0 1.62.43 3.2 1.24 4.6L2 22l5.66-1.48a9.2 9.2 0 0 0 4.38 1.12h.01A9.2 9.2 0 0 0 21.2 12 9.2 9.2 0 0 0 12.04 2.8Zm0 16.84h-.01a7.64 7.64 0 0 1-3.89-1.06l-.28-.17-3.36.88.9-3.27-.18-.3a7.64 7.64 0 0 1-1.17-4.07 7.66 7.66 0 0 1 7.64-7.65 7.66 7.66 0 0 1 7.65 7.64 7.66 7.66 0 0 1-7.3 7.99Zm4.2-5.72c-.23-.12-1.36-.67-1.57-.75-.21-.08-.36-.12-.52.12-.15.23-.6.75-.73.9-.13.15-.27.17-.5.06-.23-.12-.97-.36-1.85-1.14-.68-.61-1.14-1.36-1.28-1.59-.13-.23-.01-.36.1-.47.1-.1.23-.27.34-.4.12-.13.15-.23.23-.38.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4h-.44c-.15 0-.4.06-.61.29-.21.23-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.61 2.46 3.9 3.45.55.24.97.38 1.3.48.55.18 1.05.15 1.44.09.44-.07 1.36-.55 1.55-1.09.19-.53.19-.99.13-1.08-.05-.1-.21-.15-.44-.27Z" />
    </svg>
  )
}

function SocialLinks({ settings }: { settings: PalhaSiteSettings }) {
  const wa = whatsappHref(settings.whatsapp)
  const instagram = palhaInstagramHref(settings.instagramUrl)
  return (
    <>
      {wa ? (
        <a href={wa} target="_blank" rel="noreferrer" className="palha-social-wa" aria-label="WhatsApp">
          <WhatsAppIcon />
        </a>
      ) : null}
      {instagram ? (
        <a href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
          <InstagramIcon />
        </a>
      ) : null}
    </>
  )
}

function PalhaFooter({ prefix, settings }: { prefix: string; settings: PalhaSiteSettings }) {
  const footer = settings.footer ?? DEFAULT_PALHA_SITE_SETTINGS.footer
  return (
    <footer className="palha-footer">
      <PalhaReveal>
        <div className="palha-footer-mark" aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        {footer.script.trim() ? <p className="palha-footer-script">{footer.script}</p> : null}
        <Link href={palhaHref(prefix, '/')} className="palha-footer-brand" aria-label="Palha Weddings">
          <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-footer-logo" />
        </Link>
        {footer.kicker.trim() ? <p className="palha-footer-kicker">{footer.kicker}</p> : null}
      </PalhaReveal>
      <PalhaReveal delay={140}>
        <div className="palha-footer-rule">
          <span className="palha-footer-rule-line" />
          <span className="palha-footer-diamond" aria-hidden="true" />
          <span className="palha-footer-rule-line" />
        </div>
      </PalhaReveal>
      <PalhaReveal delay={240}>
        <div className="palha-footer-socials" aria-label="Redes">
          <SocialLinks settings={settings} />
        </div>
        <p className="palha-footer-copy">© {new Date().getFullYear()} Palha Weddings</p>
      </PalhaReveal>
    </footer>
  )
}

function isPalhaAlbumPublic(pathname: string) {
  return /\/(?:albuns|portfolio)\/[^/]+\/?$/.test(pathname)
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
    return (
      <div className="palha-root palha-present-root">
        {children}
        <PalhaFooter prefix={prefix} settings={settings} />
      </div>
    )
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
      <PalhaFooter prefix={prefix} settings={settings} />
    </div>
  )
}
