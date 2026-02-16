'use client'

import { useEffect, useState } from 'react'
import {
  BarChart3,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AdMetrics {
  impressions: number
  reach: number
  clicks: number
  cpc: number
  cpm: number
  ctr: number
  spend: number
  leads: number
  conversions: number
  frequency: number
}

const METRICS: { key: keyof AdMetrics; label: string; icon: typeof Eye; format: (v: number) => string }[] = [
  { key: 'impressions', label: 'Impressões', icon: Eye, format: (v) => v.toLocaleString('pt-BR') },
  { key: 'reach', label: 'Alcance', icon: BarChart3, format: (v) => v.toLocaleString('pt-BR') },
  { key: 'clicks', label: 'Cliques', icon: MousePointer, format: (v) => v.toLocaleString('pt-BR') },
  { key: 'cpc', label: 'CPC', icon: Target, format: (v) => `R$ ${v.toFixed(2)}` },
  { key: 'cpm', label: 'CPM', icon: TrendingUp, format: (v) => `R$ ${v.toFixed(2)}` },
  { key: 'ctr', label: 'CTR', icon: BarChart3, format: (v) => `${v.toFixed(2)}%` },
  { key: 'spend', label: 'Valor gasto', icon: DollarSign, format: (v) => `R$ ${v.toFixed(2)}` },
  { key: 'leads', label: 'Leads', icon: Target, format: (v) => v.toLocaleString('pt-BR') },
  { key: 'conversions', label: 'Conversões', icon: TrendingUp, format: (v) => v.toLocaleString('pt-BR') },
  { key: 'frequency', label: 'Frequência', icon: BarChart3, format: (v) => v.toFixed(2) },
]

const emptyMetrics: AdMetrics = {
  impressions: 0,
  reach: 0,
  clicks: 0,
  cpc: 0,
  cpm: 0,
  ctr: 0,
  spend: 0,
  leads: 0,
  conversions: 0,
  frequency: 0,
}

export default function MetricasPage() {
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [metrics, setMetrics] = useState<AdMetrics>(emptyMetrics)
  const [lineData, setLineData] = useState<{ date: string; impressions: number; clicks: number; spend: number }[]>([])
  const [barData, setBarData] = useState<{ name: string; value: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/ads/metrics?date_start=${dateStart}&date_end=${dateEnd}`,
          { credentials: 'include' }
        )
        const data = await res.json()

        if (res.ok && data.metrics) {
          setMetrics(data.metrics)
          setLineData(data.lineData || [])
          setBarData(data.barData || [])
          setConnected(data.connected ?? false)
        } else {
          // Dados simulados para demonstração
          const simulated: AdMetrics = {
            impressions: 45230,
            reach: 28100,
            clicks: 1203,
            cpc: 0.85,
            cpm: 12.50,
            ctr: 2.66,
            spend: 1022.55,
            leads: 48,
            conversions: 12,
            frequency: 1.61,
          }
          setMetrics(simulated)
          const days: { date: string; impressions: number; clicks: number; spend: number }[] = []
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            days.push({
              date: d.toISOString().slice(0, 10),
              impressions: Math.floor(45230 * (0.8 + Math.random() * 0.4) / 7),
              clicks: Math.floor(1203 * (0.8 + Math.random() * 0.4) / 7),
              spend: 1022.55 / 7,
            })
          }
          setLineData(days)
          setBarData([
            { name: 'Impressões', value: 45230 },
            { name: 'Cliques', value: 1203 },
            { name: 'Leads', value: 48 },
            { name: 'Conversões', value: 12 },
          ])
        }
      } catch {
        setMetrics(emptyMetrics)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [dateStart, dateEnd])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Métricas Meta Ads</h1>
      <p className="text-gray-500 mb-6">
        Conecte sua conta de anúncios Meta para ver métricas em tempo real. Dados salvos em snapshots.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Data início</label>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-300"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Data fim</label>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-300"
          />
        </div>
        {!connected && (
          <div className="flex items-end">
            <a
              href="/api/ads/connect"
              className="px-4 py-2 rounded-lg bg-[#1877f2] hover:bg-[#166fe5] text-white text-sm font-medium"
            >
              Conectar Meta Ads
            </a>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-avocado" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {METRICS.slice(0, 10).map((m) => (
              <div
                key={m.key}
                className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <m.icon className="w-4 h-4" />
                  <span className="text-sm">{m.label}</span>
                </div>
                <p className="text-xl font-bold">{m.format(metrics[m.key] ?? 0)}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-4">Evolução (período)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                    />
                    <Line type="monotone" dataKey="impressions" stroke="#568203" strokeWidth={2} />
                    <Line type="monotone" dataKey="clicks" stroke="#6b9e0a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
              <h3 className="font-semibold mb-4">Principais métricas</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                    />
                    <Bar dataKey="value" fill="#568203" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
