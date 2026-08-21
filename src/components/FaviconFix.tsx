'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const PLIFY_FAVICON = '/icone-site.ico'
const PALHA_FAVICON = '/palhaweddings/logo.png'

/**
 * Garante um único favicon. Na Palha usa a logo; no restante, icone-site.ico.
 */
export function FaviconFix() {
  const pathname = usePathname()

  useEffect(() => {
    const palha =
      window.location.hostname.includes('palhaweddings') || pathname.startsWith('/palhaweddings')
    const href = palha ? PALHA_FAVICON : PLIFY_FAVICON
    const type = palha ? 'image/png' : 'image/x-icon'

    const apply = () => {
      document
        .querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']")
        .forEach((link) => {
          if (link.href && (link.href.includes('favicon.ico') || link.href.includes('favicon.'))) {
            link.remove()
          }
        })
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.type = type
      link.href = href
    }
    apply()
    const t = setTimeout(apply, 100)
    return () => clearTimeout(t)
  }, [pathname])
  return null
}
