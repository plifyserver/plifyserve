'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PenTool, FolderOpen, TrendingUp, BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { startOfWeek, format, subWeeks } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SignatureDoc = {
  id: string
  status: 'pending' | 'signed'
  signed_at: string | null
  created_at: string
}

type Proposal = {
  id: string
  status: string
  accepted_at: string | null
  created_at: string
}

function groupByWeek<T>(items: T[], dateKey: keyof T): { week: string; count: number }[] {
  const map = new Map<string, number>()
  items.forEach((item) => {
    const raw = item[dateKey]
    if (raw == null || typeof raw !== 'string') return
    const d = new Date(raw)
    const weekStart = startOfWeek(d, { weekStartsOn: 0 })
    const key = format(weekStart, 'yyyy-MM-dd')
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  const entries = Array.from(map.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
  return entries.length ? entries : [{ week: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), count: 0 }]
}

export default function RelatoriosPage() {
  const [signatures, setSignatures] = useState<SignatureDoc[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sigRes, propRes] = await Promise.all([
          fetch('/api/assinaturas-digitais', { credentials: 'include' }),
          fetch('/api/proposals', { credentials: 'include' }),
        ])
        if (sigRes.ok) {
          const data = await sigRes.json()
          setSignatures(Array.isArray(data) ? data : [])
        }
        if (propRes.ok) {
          const data = await propRes.json()
          setProposals(Array.isArray(data) ? data : [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const signedDocs = signatures.filter((s) => s.status === 'signed' && s.signed_at)
  const acceptedProposals = proposals.filter((p) => p.status === 'accepted' && p.accepted_at)

  const signatureWeeklyData = groupByWeek(
    signedDocs.map((s) => ({ ...s, signed_at: s.signed_at! })),
    'signed_at'
  ).map(({ week, count }) => {
    const d = new Date(week)
    return {
      semana: isNaN(d.getTime()) ? week : format(d, 'dd/MM', { locale: ptBR }),
      assinaturas: count,
    }
  })

  const proposalsWeeklyData = groupByWeek(
    acceptedProposals.map((p) => ({ ...p, accepted_at: p.accepted_at! })),
    'accepted_at'
  ).map(({ week, count }) => {
    const d = new Date(week)
    return {
      semana: isNaN(d.getTime()) ? week : format(d, 'dd/MM', { locale: ptBR }),
      aceitas: count,
    }
  })

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const lastWeekStart = subWeeks(thisWeekStart, 1)
  const signedThisWeek = signedDocs.filter((s) => s.signed_at && startOfWeek(new Date(s.signed_at), { weekStartsOn: 0 }).getTime() === thisWeekStart.getTime()).length
  const signedLastWeek = signedDocs.filter((s) => s.signed_at && startOfWeek(new Date(s.signed_at), { weekStartsOn: 0 }).getTime() === lastWeekStart.getTime()).length
  const acceptedThisWeek = acceptedProposals.filter((p) => p.accepted_at && startOfWeek(new Date(p.accepted_at), { weekStartsOn: 0 }).getTime() === thisWeekStart.getTime()).length
  const acceptedLastWeek = acceptedProposals.filter((p) => p.accepted_at && startOfWeek(new Date(p.accepted_at), { weekStartsOn: 0 }).getTime() === lastWeekStart.getTime()).length

  const signatureGrowth = signedLastWeek === 0 ? (signedThisWeek > 0 ? 100 : 0) : Math.round(((signedThisWeek - signedLastWeek) / signedLastWeek) * 100)
  const proposalsGrowth = acceptedLastWeek === 0 ? (acceptedThisWeek > 0 ? 100 : 0) : Math.round(((acceptedThisWeek - acceptedLastWeek) / acceptedLastWeek) * 100)

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Relatórios</h1>
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-avocado" />
        Relatórios
      </h1>
      <p className="text-gray-500 mb-8">Acompanhe assinaturas digitais e propostas aceitas ao longo do tempo.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <PenTool className="w-5 h-5 text-avocado" />
            <span className="font-medium">Assinaturas digitais</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{signedDocs.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total assinados</p>
          <p className="text-sm mt-2">
            Esta semana: <strong>{signedThisWeek}</strong>
            {signatureGrowth !== 0 && (
              <span className={signatureGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}({signatureGrowth > 0 ? '+' : ''}{signatureGrowth}% vs semana anterior)
              </span>
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <FolderOpen className="w-5 h-5 text-avocado" />
            <span className="font-medium">Propostas aceitas</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{acceptedProposals.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total aceitas</p>
          <p className="text-sm mt-2">
            Esta semana: <strong>{acceptedThisWeek}</strong>
            {proposalsGrowth !== 0 && (
              <span className={proposalsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {' '}({proposalsGrowth > 0 ? '+' : ''}{proposalsGrowth}% vs semana anterior)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-avocado" />
            Assinaturas por semana
          </h2>
          <div className="h-64">
            {signatureWeeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signatureWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [value, 'Assinaturas']} />
                  <Bar dataKey="assinaturas" fill="var(--avocado)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm flex items-center justify-center h-full">Nenhuma assinatura ainda</p>
            )}
          </div>
          <Link href="/dashboard/assinaturas-digitais" className="text-avocado text-sm mt-2 inline-block hover:underline">
            Ver assinaturas digitais
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-avocado" />
            Propostas aceitas por semana
          </h2>
          <div className="h-64">
            {proposalsWeeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={proposalsWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [value, 'Aceitas']} />
                  <Line type="monotone" dataKey="aceitas" stroke="var(--avocado)" strokeWidth={2} dot={{ fill: 'var(--avocado)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm flex items-center justify-center h-full">Nenhuma proposta aceita ainda</p>
            )}
          </div>
          <Link href="/dashboard/propostas" className="text-avocado text-sm mt-2 inline-block hover:underline">
            Ver propostas
          </Link>
        </div>
      </div>
    </div>
  )
}
