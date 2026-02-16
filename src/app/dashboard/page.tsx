'use client'

import { useEffect, useState } from 'react'
import { FileText, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  total: number
  open: number
  accepted: number
  ignored: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, accepted: 0, ignored: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/proposals', { credentials: 'include' })
      if (!res.ok) return

      const proposals = await res.json()
      setStats({
        total: proposals.length,
        open: proposals.filter((p: { status: string }) => p.status === 'open').length,
        accepted: proposals.filter((p: { status: string }) => p.status === 'accepted').length,
        ignored: proposals.filter((p: { status: string }) => p.status === 'ignored').length,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  const cards = [
    { label: 'Total de Propostas', value: stats.total, icon: FileText, color: 'lime' },
    { label: 'Abertas', value: stats.open, icon: Clock, color: 'blue' },
    { label: 'Aceitas', value: stats.accepted, icon: CheckCircle, color: 'emerald' },
    { label: 'Ignoradas', value: stats.ignored, icon: XCircle, color: 'zinc' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div
              key={card.label}
              className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <card.icon
                  className={`w-8 h-8 ${
                    card.color === 'lime' ? 'text-avocado' :
                    card.color === 'blue' ? 'text-blue-400' :
                    card.color === 'emerald' ? 'text-emerald-400' : 'text-gray-500'
                  }`}
                />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-gray-500 text-sm">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Ações rápidas</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/templates"
              className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-avocado" />
                <div>
                  <p className="font-medium">Criar nova proposta</p>
                  <p className="text-sm text-gray-500">Escolha um template e personalize</p>
                </div>
              </div>
            </Link>
            <Link
              href="/dashboard/propostas"
              className="block p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-medium">Ver minhas propostas</p>
                  <p className="text-sm text-gray-500">Editar, duplicar ou excluir</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Dica do Plify</h2>
          <p className="text-gray-500 mb-4">
            Personalize o botão de confirmação da sua proposta! Use frases como &quot;Aceitar proposta&quot;, 
            &quot;Entre agora&quot; ou &quot;Contratar&quot; para aumentar a taxa de conversão.
          </p>
          <Link
            href="/dashboard/templates"
            className="text-avocado hover:text-avocado-light text-sm font-medium"
          >
            Ver templates →
          </Link>
        </div>
      </div>
    </div>
  )
}
