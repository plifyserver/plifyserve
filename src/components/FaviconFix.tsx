'use client'

import { useEffect } from 'react'

const FAVICON_HREF = '/icone-site.ico'

/**
 * Garante um único favicon fixo (icone-site.ico). Remove qualquer link para
 * favicon.ico (ex.: padrão Next/Vercel) que faça o ícone "piscar" ao navegar.
 */
export function FaviconFix() {
  useEffect(() => {
    const apply = () => {
      const all = document.querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']")
      all.forEach((l) => {
        if (l.href && (l.href.includes('favicon.ico') || l.href.includes('favicon.'))) l.remove()
      })
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        link.type = 'image/x-icon'
        document.head.appendChild(link)
      }
      link.type = 'image/x-icon'
      link.href = FAVICON_HREF
    }
    apply()
    const t = setTimeout(apply, 100)
    return () => clearTimeout(t)
  }, [])
  return null
}
