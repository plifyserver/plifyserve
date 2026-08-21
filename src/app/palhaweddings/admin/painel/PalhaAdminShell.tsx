'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { href: '/painel/pagina-inicial', label: 'Página Inicial' },
  { href: '/painel/galeria', label: 'Galeria' },
]

export function PalhaAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = pathname.startsWith('/palhaweddings') ? '/palhaweddings/admin' : '/admin'

  return (
    <div className="palha-admin-shell">
      <aside className="palha-admin-side">
        <p className="palha-admin-brand">Painel</p>
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
      </aside>
      <div className="palha-admin-main">
        <header className="palha-admin-bar">
          <img src="/palhaweddings/logo.png" alt="Palha Weddings" className="palha-admin-logo" />
          <a href="/api/palha/auth/logout" className="palha-btn is-ghost">
            Sair
          </a>
        </header>
        {children}
      </div>
    </div>
  )
}
