'use client'

import Link from 'next/link'

type Props = {
  showDashboardLink: boolean
}

const linkClass =
  'text-xs sm:text-sm text-gray-600 hover:text-red-600 font-medium transition-colors whitespace-nowrap'

/**
 * Cabeçalho do checkout: permite sair da conta sem pagar (trocar de usuário).
 * GET /api/auth/logout limpa cookies e redireciona para /login (igual ao painel).
 */
export function CheckoutHeaderAuth({ showDashboardLink }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 sm:gap-x-4 max-w-[min(100%,20rem)] sm:max-w-none">
      <a href="/api/auth/logout" className={linkClass}>
        Sair
      </a>
      {showDashboardLink ? (
        <>
          <span className="text-gray-300 select-none" aria-hidden>
            |
          </span>
          <Link href="/dashboard" className={linkClass}>
            Ir para o painel
          </Link>
        </>
      ) : (
        <>
          <span className="text-gray-300 select-none max-sm:hidden" aria-hidden>
            |
          </span>
          <span className="text-[11px] sm:text-xs text-gray-400 text-right leading-tight basis-full sm:basis-auto sm:max-w-[14rem] max-sm:pl-0 max-sm:text-left sm:text-right">
            Conclua o pagamento para acessar o painel
          </span>
        </>
      )}
    </div>
  )
}
