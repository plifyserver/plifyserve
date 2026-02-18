'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

type Format = 'number' | 'currency' | 'percentage'

interface MetricsCardProps {
  title: string
  value: number
  change?: number
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  format?: Format
}

export default function MetricsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  format = 'number',
}: MetricsCardProps) {
  const isPositive = change !== undefined && change > 0

  const formatValue = () => {
    if (format === 'currency')
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    if (format === 'percentage') return `${value.toFixed(2)}%`
    return value.toLocaleString('pt-BR')
  }

  return (
    <Card className="p-6 rounded-2xl border-0 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-light text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-light text-slate-900 mb-2">{formatValue()}</h3>
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span
                className={`text-xs font-normal ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </Card>
  )
}
