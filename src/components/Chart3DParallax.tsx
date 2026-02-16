'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

const chartData = [
  { name: 'Jan', impressões: 12000, cliques: 340, conversões: 28 },
  { name: 'Fev', impressões: 18500, cliques: 520, conversões: 42 },
  { name: 'Mar', impressões: 22100, cliques: 680, conversões: 55 },
  { name: 'Abr', impressões: 28900, cliques: 820, conversões: 71 },
  { name: 'Mai', impressões: 35200, cliques: 980, conversões: 89 },
  { name: 'Jun', impressões: 41800, cliques: 1150, conversões: 102 },
]

const barData = [
  { métrica: 'Impressões', valor: 41800 },
  { métrica: 'Cliques', valor: 1150 },
  { métrica: 'Leads', valor: 156 },
  { métrica: 'Conversões', valor: 102 },
]

function ChartCard({
  children,
  title,
  subtitle,
  className = '',
}: {
  children: React.ReactNode
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden transition-all duration-500 ${className}`}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
      }}
    >
      <h3 className="text-lg font-semibold mb-6 text-avocado">{title}</h3>
      <div className="h-64 min-h-64">{children}</div>
      <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
    </div>
  )
}

export function Chart3DParallax({ animationKey }: { animationKey: number }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <ChartCard title="Evolução mensal" subtitle="Impressões nos últimos 6 meses">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} key={animationKey}>
            <defs>
              <linearGradient id={`grad1-${animationKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#568203" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#568203" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Area
              type="monotone"
              dataKey="impressões"
              stroke="#568203"
              fill={`url(#grad1-${animationKey})`}
              strokeWidth={2}
              isAnimationActive
              animationDuration={1200}
              animationBegin={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Performance geral" subtitle="Visão consolidada do período">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 20 }} key={animationKey}>
            <XAxis type="number" stroke="#6b7280" fontSize={12} />
            <YAxis dataKey="métrica" type="category" stroke="#6b7280" fontSize={12} width={90} />
            <Bar
              dataKey="valor"
              fill="#568203"
              radius={[0, 4, 4, 0]}
              isAnimationActive
              animationDuration={1000}
              animationBegin={0}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="lg:col-span-2">
        <ChartCard title="Cliques e conversões" subtitle="Série temporal">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} key={animationKey}>
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Line
                type="monotone"
                dataKey="cliques"
                stroke="#568203"
                strokeWidth={2}
                dot={{ fill: '#568203' }}
                isAnimationActive
                animationDuration={1200}
                animationBegin={0}
              />
              <Line
                type="monotone"
                dataKey="conversões"
                stroke="#6b9e0a"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#6b9e0a' }}
                isAnimationActive
                animationDuration={1200}
                animationBegin={100}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
