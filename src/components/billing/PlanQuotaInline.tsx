'use client'

import Link from 'next/link'
import { useBilling } from '@/hooks/useBilling'

export type PlanQuotaKind =
  | 'clients'
  | 'proposalsThisMonth'
  | 'contractsThisMonth'
  | 'mindMaps'
  | 'kanbanBoards'

const LABELS: Record<PlanQuotaKind, string> = {
  clients: 'Clientes cadastrados',
  proposalsThisMonth: 'Propostas criadas neste mês',
  contractsThisMonth: 'Contratos criados neste mês',
  mindMaps: 'Mapas mentais',
  kanbanBoards: 'Quadros Kanban',
}

export function PlanQuotaInline({ kind, className = '' }: { kind: PlanQuotaKind; className?: string }) {
  const { usage, isLoading } = useBilling()
  if (isLoading || !usage?.quotas) return null
  const q = usage.quotas[kind]
  if (!q) return null
  const full = q.used >= q.limit
  return (
    <p className={`text-sm ${full ? 'text-amber-800' : 'text-slate-600'} ${className}`}>
      <span className="font-medium text-slate-700">{LABELS[kind]}:</span>{' '}
      <span className="tabular-nums font-semibold">
        {q.used}/{q.limit}
      </span>
      <span className="text-slate-500"> no Essential.</span>{' '}
      <Link href="/dashboard/planos" className="text-indigo-600 hover:underline font-medium">
        Ver planos
      </Link>
    </p>
  )
}

/** Para desabilitar botões “Novo” no Essential quando o limite foi atingido. */
export function usePlanQuotaFull(kind: PlanQuotaKind): boolean {
  const { usage, isLoading } = useBilling()
  if (isLoading || !usage?.quotas) return false
  const q = usage.quotas[kind]
  if (!q) return false
  return q.used >= q.limit
}
