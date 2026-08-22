'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const MENU = [
  { href: '/painel/pagina-inicial', label: 'Página inicial' },
  { href: '/painel/galeria', label: 'Galeria' },
  { href: '/painel/controle-de-dados', label: 'Controle de dados' },
]

export function PalhaAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = pathname.startsWith('/palhaweddings') ? '/palhaweddings/admin' : '/admin'
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <div className={`palha-admin-shell${menuOpen ? ' is-menu-open' : ''}`}>
      <header className="palha-admin-mobilebar">
        <button
          type="button"
          className="palha-admin-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="palha-admin-side"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Fechar' : 'Menu'}
        </button>
        <Link href={`${prefix}/painel/pagina-inicial`} className="palha-admin-mobile-brand" aria-label="Palha Weddings">
          <img src="/palhaweddings/logo.png" alt="" />
        </Link>
        <a href="/api/palha/auth/logout" className="palha-admin-mobile-sair">
          Sair
        </a>
      </header>
      {menuOpen ? (
        <button
          type="button"
          className="palha-admin-menu-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <aside id="palha-admin-side" className="palha-admin-side">
        <div className="palha-admin-side-mid">
          <Link href={`${prefix}/painel/pagina-inicial`} className="palha-admin-side-brand" aria-label="Palha Weddings">
            <img src="/palhaweddings/logo.png" alt="Palha Weddings" />
            <span>studio</span>
          </Link>
          <nav>
            {MENU.map((item) => {
              const dest = `${prefix}${item.href}`
              const current = pathname === dest || pathname.startsWith(`${dest}/`)
              return (
                <Link key={item.href} href={dest} aria-current={current ? 'page' : undefined}>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <a href="/api/palha/auth/logout" className="palha-admin-signout">
          Sair
        </a>
      </aside>
      <div className="palha-admin-main">{children}</div>
    </div>
  )
}
