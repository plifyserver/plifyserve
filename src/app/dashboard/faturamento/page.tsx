'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react'

interface BillingData {
  month: string
  accepted: number
  totalValue: number
  proposals: { title: string; value: number; accepted_at: string }[]
}

function getAcceptedValue(p: { proposal_value?: number | null; content?: { acceptedPlan?: { price?: number } } }): number {
  const v = p.proposal_value
  if (v != null && !Number.isNaN(Number(v))) return Number(v)
  const plan = p.content?.acceptedPlan
  if (plan && typeof plan.price === 'number') return plan.price
  return 0
}

export default function FaturamentoPage() {
  const [data, setData] = useState<BillingData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBilling = async () => {
      const res = await fetch('/api/proposals', { credentials: 'include' })
      if (!res.ok) return

      const all = await res.json()
      const accepted = all.filter((p: { status: string }) => p.status === 'accepted')

      const byMonth: Record<string, BillingData> = {}
      accepted.forEach((p: { accepted_at: string; title: string; proposal_value?: number | null; content?: { acceptedPlan?: { price?: number } } }) => {
        const date = new Date(p.accepted_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!byMonth[key]) {
          byMonth[key] = {
            month: key,
            accepted: 0,
            totalValue: 0,
            proposals: [],
          }
        }
        const value = getAcceptedValue(p)
        byMonth[key].accepted += 1
        byMonth[key].totalValue += value
        byMonth[key].proposals.push({
          title: p.title,
          value,
          accepted_at: p.accepted_at,
        })
      })

      const sorted = Object.values(byMonth).sort(
        (a, b) => b.month.localeCompare(a.month)
      )

      if (sorted.length === 0) {
        const now = new Date()
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        sorted.unshift({
          month: currentKey,
          accepted: 0,
          totalValue: 0,
          proposals: [],
        })
      }

      setData(sorted)
      setLoading(false)
    }
    fetchBilling()
  }, [])

  const current = data[selectedMonth] || {
    month: '-',
    accepted: 0,
    totalValue: 0,
    proposals: [],
  }

  const formatMonth = (m: string) => {
    const [y, month] = m.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${months[parseInt(month) - 1]} ${y}`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Faturamento</h1>
      <p className="text-gray-500 mb-6">
        Acompanhe o valor das propostas aceitas por mês
      </p>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      ) : (
        <>
          {/* Seletor de mês */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setSelectedMonth(Math.min(selectedMonth + 1, data.length - 1))}
              disabled={selectedMonth >= data.length - 1}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">{formatMonth(current.month)}</h2>
            <button
              onClick={() => setSelectedMonth(Math.max(selectedMonth - 1, 0))}
              disabled={selectedMonth <= 0}
              className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Cards de resumo */}
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="p-6 rounded-xl bg-gray-100 border border-gray-200">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Faturado no mês</span>
              </div>
              <p className="text-3xl font-bold">
                R$ {current.totalValue.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-100 border border-gray-200">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Propostas aceitas</span>
              </div>
              <p className="text-3xl font-bold">{current.accepted}</p>
            </div>
          </div>

          {/* Lista de propostas */}
          <div className="rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold">Propostas aceitas em {formatMonth(current.month)}</h3>
            </div>
            {current.proposals.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma proposta aceita neste mês</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {current.proposals.map((p, i) => (
                  <div
                    key={i}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(p.accepted_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <p className="font-semibold text-emerald-400">
                      R$ {p.value.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
