'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'

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
        alert(data.error || 'Erro ao ativar Pro')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao processar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-2">Assinar Plify Pro</h1>
        <p className="text-zinc-400 mb-8">
          Propostas ilimitadas por apenas R$ 4,90/mês
        </p>

        <div className="p-8 rounded-2xl bg-white border-2 border-avocado/50 shadow-sm mb-6">
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
