'use client'

import { BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  acceptedPlanDisplayTitle,
  formatAcceptedPlanBRL,
  getAcceptedPlanFromContent,
} from '@/lib/proposalAcceptedPlan'

type Props = {
  content: unknown
  /** Lista “Aceitas”: bloco compacto */
  compact?: boolean
  className?: string
}

export function AcceptedPlanCallout({ content, compact, className }: Props) {
  const plan = getAcceptedPlanFromContent(content)
  if (!plan) return null

  const title = acceptedPlanDisplayTitle(plan)
  const priceStr = typeof plan.price === 'number' ? formatAcceptedPlanBRL(plan.price) : null

  if (compact) {
    return (
      <div
        className={cn(
          'mt-3 rounded-lg border border-indigo-200/80 bg-white/80 px-3 py-2.5',
          className
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-900">
          Plano aceito pelo cliente
        </p>
        <p className="mt-1 text-sm text-slate-800">
          <span className="font-semibold">{title}</span>
          {priceStr ? <span className="text-slate-600"> · {priceStr}</span> : null}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-indigo-100 bg-indigo-50/90 p-5 shadow-sm',
        className
      )}
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <BadgeCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-900">
            Plano aceito pelo cliente
          </p>
          <p className="mt-1.5 text-lg font-semibold text-slate-900">{title}</p>
          {priceStr ? <p className="mt-1 text-base font-medium text-indigo-800">{priceStr}</p> : null}
          {plan.description?.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-600 line-clamp-6 whitespace-pre-wrap">
              {plan.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
