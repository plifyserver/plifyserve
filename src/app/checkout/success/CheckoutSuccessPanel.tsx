'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Loader2 } from 'lucide-react'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { cn } from '@/lib/utils'
import { LOGO_PRETO } from '@/lib/logo'

const POLL_MS = 2000
const MAX_ATTEMPTS = 35

export function CheckoutSuccessPanel() {
  const [accessReady, setAccessReady] = useState(false)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    let cancelled = false
    let attempt = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    async function check() {
      try {
        const res = await fetch('/api/billing/usage', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.hasActivePaidAccess === true) {
            if (!cancelled) {
              setAccessReady(true)
              setPolling(false)
            }
            return
          }
        }
      } catch {
        /* ignore */
      }
      attempt += 1
      if (cancelled || attempt >= MAX_ATTEMPTS) {
        if (!cancelled) setPolling(false)
        return
      }
      timer = setTimeout(check, POLL_MS)
    }

    check()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <div className={cn('flex-1 py-6 sm:py-16', SITE_GUTTER_X)}>
      <div className="max-w-xl mx-auto w-full">
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-5 sm:p-10 text-center">
          <div className="flex justify-center mb-2">
            <Image
              src={LOGO_PRETO}
              alt="Plify"
              width={120}
              height={34}
              className="h-7 sm:h-8 w-auto object-contain mx-auto"
            />
          </div>
          <div className="flex justify-center mb-3 sm:mb-4 mt-5 sm:mt-6">
            <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-emerald-600" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 px-1">Pagamento recebido</h1>
          <p className="mt-3 text-gray-600 text-sm leading-relaxed px-1">
            Obrigado! Assim que o Stripe confirmar a assinatura, liberamos o painel automaticamente.
          </p>
          {accessReady ? (
            <Link
              href="/dashboard"
              className="mt-6 sm:mt-8 inline-flex w-full justify-center rounded-sm bg-red-600 px-4 py-3 sm:py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Ir para o painel
            </Link>
          ) : !polling ? (
            <div className="mt-6 space-y-3">
              <p className="text-xs sm:text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2.5">
                A confirmação ainda não apareceu aqui. Atualize a página em alguns instantes ou abra o painel — se
                o pagamento foi concluído, o acesso será liberado.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex w-full justify-center rounded-sm border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                Tentar ir para o painel
              </Link>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-2 py-1">
              <Loader2 className="h-8 w-8 text-red-600/70 animate-spin" aria-hidden />
              <p className="text-xs sm:text-sm text-gray-500">Confirmando seu acesso…</p>
            </div>
          )}
          <p className="mt-5 sm:mt-6 text-xs text-gray-500">
            <Link href="/termos-privacidade" className="text-red-600 hover:text-red-700">
              Privacidade
            </Link>
            {' · '}
            <Link href="/termos-uso" className="text-red-600 hover:text-red-700">
              Termos de uso
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
