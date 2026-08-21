'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENU = [
  { href: '/painel/pagina-inicial', label: 'Página inicial' },
  { href: '/painel/galeria', label: 'Galeria' },
  { href: '/painel/controle-de-dados', label: 'Controle de dados' },
]

export function PalhaAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = pathname.startsWith('/palhaweddings') ? '/palhaweddings/admin' : '/admin'

  return (
    <div className="palha-admin-shell">
      <aside className="palha-admin-side">
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
