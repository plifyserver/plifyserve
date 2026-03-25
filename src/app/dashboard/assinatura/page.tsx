'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DASH_SURFACE_CARD, SITE_CONTAINER_SM } from '@/lib/siteLayout'

export default function AssinaturaPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribeSimulated = async () => {
    setLoading(true)
    try {
      // MVP: simular assinatura via flag no banco (sem Stripe)
      const res = await fetch('/api/subscription/simulate-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        router.push('/dashboard?subscription=success')
        router.refresh()
      } else {
        toast.error(data.error || 'Erro ao ativar Pro')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao processar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={SITE_CONTAINER_SM}>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-3xl font-bold mb-2">Assinar Plify Pro</h1>
        <p className="text-zinc-400 mb-8">
          Propostas ilimitadas por apenas R$ 4,90/mês
        </p>

        <div className={`${DASH_SURFACE_CARD} p-8 border-avocado/50 border-2 mb-6`}>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold">R$ 4,90</span>
            <span className="text-zinc-400">/mês</span>
          </div>
          <ul className="space-y-4 mb-8">
            {[
              'Propostas ilimitadas',
              'Todos os templates',
              'Links personalizados',
              'Dashboard de métricas',
              'Mini-site da empresa',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribeSimulated}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-avocado hover:bg-avocado-light text-white font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ativando...
              </>
            ) : (
              'Ativar Pro (simulado)'
            )}
          </button>
        </div>

        <p className="text-center text-sm text-zinc-500">
          MVP: assinatura simulada. Stripe será integrado em breve.
        </p>
      </div>
    </div>
  )
}
