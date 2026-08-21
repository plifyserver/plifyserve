'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function PalhaAdminPainelIndex() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const prefix = pathname.startsWith('/palhaweddings') ? '/palhaweddings/admin' : '/admin'
    router.replace(`${prefix}/painel/pagina-inicial`)
  }, [pathname, router])

  return <p className="palha-copy">Abrindo Página Inicial…</p>
}
