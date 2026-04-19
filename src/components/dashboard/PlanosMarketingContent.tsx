'use client'

import Link from 'next/link'
import { Check, Star } from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import type { PlanType } from '@/services/billing'
import { useAuth } from '@/contexts/AuthContext'
import {
  PLAN_BULLETS_ESSENTIAL,
  PLAN_BULLETS_PRO,
  PLAN_COMPARISON_ROWS,
  PLAN_TAGLINE,
} from '@/lib/planMarketingCopy'
import { cn } from '@/lib/utils'

function CellContentDark({ value }: { value: string | 'check' | 'dash' }) {
  if (value === 'check') {
    return <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
  }
  if (value === 'dash') {
    return <span className="text-slate-500">—</span>
  }
  return <span className="text-white">{value}</span>
}

function CellContentLight({ value }: { value: string | 'check' | 'dash' }) {
  if (value === 'check') {
    return <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
  }
  if (value === 'dash') {
    return <span className="text-slate-400">—</span>
  }
  return <span className="text-slate-700 text-sm">{value}</span>
}

type Props = {
  /** Quando embutido em Configurações, omite o título principal da página de planos */
  embedded?: boolean
}

export function PlanosMarketingContent({ embedded = false }: Props) {
  const { usage, isLoading } = useBilling()
  const { profile } = useAuth()

  const currentPlanType: PlanType = (usage?.planType || profile?.plan || 'essential') as PlanType

  if (isLoading) {
    if (embedded) {
      return (
        <div className="min-h-[240px] flex items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      )
    }
    return (
      <div className="min-h-[280px] flex items-center justify-center rounded-3xl bg-slate-950 border border-white/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
      </div>
    )
  }

  if (embedded) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm shadow-sm"
              style={{ backgroundColor: 'var(--primary-color, #dc2626)' }}
              aria-hidden
            />
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Planos</h2>
              <p className="mt-1 text-sm text-slate-500 max-w-2xl leading-relaxed">
                Essential para começar com limites claros. Pro para escalar com marca, agenda no Google e suporte no
                WhatsApp.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-500">Plano atual</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                currentPlanType === 'pro'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-800'
              )}
            >
              {currentPlanType === 'pro' && <Star className="h-3.5 w-3.5 text-amber-500" />}
              {currentPlanType === 'essential' ? 'Essential' : 'Pro'}
            </span>
            {usage?.planStatus === 'active' && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Ativo
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-50/40 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 md:items-stretch">
            {/* Essential */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Essential</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{PLAN_TAGLINE.essential}</h3>
                </div>
                {currentPlanType === 'essential' ? (
                  <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Seu plano
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm text-slate-500 leading-snug">Para quem quer o núcleo do Plify com previsibilidade.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">R$&nbsp;49,90</span>
                <span className="text-sm text-slate-500">/mês</span>
              </div>
              <div className="mt-5 grow">
                {currentPlanType === 'essential' ? (
                  <span className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-500">
                    Plano atual
                  </span>
                ) : (
                  <Link
                    href="/checkout?plan=essential"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                  >
                    Mudar para Essential
                  </Link>
                )}
              </div>
              <div className="mt-8 border-t border-slate-100 pt-6">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">O que está incluído</p>
                <ul className="mt-4 space-y-3">
                  {PLAN_BULLETS_ESSENTIAL.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-slate-600 leading-snug">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.2} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pro — destaque */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border-2 border-[color:var(--primary-color,#dc2626)] bg-white shadow-md sm:p-0">
              <div
                className="px-3 py-2 text-center text-[11px] font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: 'var(--primary-color, #dc2626)' }}
              >
                Melhor oferta
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--primary-color, #dc2626)' }}
                    >
                      Pro
                    </p>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900">{PLAN_TAGLINE.pro}</h3>
                  </div>
                  {currentPlanType === 'pro' ? (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                      Seu plano
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-slate-500 leading-snug">Tudo ilimitado, marca própria e agenda no ecossistema Google.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">R$&nbsp;89,90</span>
                  <span className="text-sm text-slate-500">/mês</span>
                </div>
                <div className="mt-5">
                  {currentPlanType === 'essential' ? (
                    <Link
                      href="/checkout?plan=pro"
                      className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Fazer upgrade
                    </Link>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-500">
                      Plano atual
                    </span>
                  )}
                </div>
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--primary-color, #dc2626)' }}
                  >
                    O que está incluído
                  </p>
                  <ul className="mt-4 space-y-3">
                    {PLAN_BULLETS_PRO.map((item) => (
                      <li key={item} className="flex gap-3 text-sm text-slate-600 leading-snug">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.2} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-slate-800">Comparativo rápido</p>
              <p className="text-xs text-slate-400">Essential × Pro</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-[40%] p-3 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:p-4 sm:pl-5">
                      Recurso
                    </th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:p-4">
                      Essential
                    </th>
                    <th className="p-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:p-4">
                      <span className="inline-flex items-center justify-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        Pro
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PLAN_COMPARISON_ROWS.map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/60">
                      <td className="p-3 pl-4 text-slate-600 sm:p-4 sm:pl-5">{row.feature}</td>
                      <td className="p-3 text-center sm:p-4">
                        <div className="flex min-h-[22px] items-center justify-center">
                          <CellContentLight value={row.essential} />
                        </div>
                      </td>
                      <td className="p-3 text-center sm:p-4">
                        <div className="flex min-h-[22px] items-center justify-center">
                          <CellContentLight value={row.pro} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:px-6">
            <h3 className="text-sm font-semibold text-slate-900">Dúvidas rápidas</h3>
            <div className="mt-3 space-y-2.5 text-sm text-slate-600 leading-relaxed">
              <p>
                <span className="font-medium text-slate-800">Mudar de plano?</span> Pelo checkout; com cartão o Stripe
                ajusta a fatura no upgrade ou downgrade.
              </p>
              <p>
                <span className="font-medium text-slate-800">Pagamento?</span> Stripe — PIX por período ou cartão
                mensal.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-slate-950 border border-white/10 p-4 sm:p-6 lg:p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Planos</h1>
        <p className="text-white/70 text-sm max-w-2xl">
          <span className="text-white/90 font-medium">Essential</span> — no Plify, com limites.{' '}
          <span className="text-white/90 font-medium">Pro</span> — ilimitado + marca + Google Calendar e telemóvel.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">Seu plano atual:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
              currentPlanType === 'pro' ? 'bg-white text-slate-950' : 'bg-white/10 text-white'
            }`}
          >
            {currentPlanType === 'pro' && <Star className="w-4 h-4 text-amber-400" />}
            {currentPlanType === 'essential' ? 'Essential' : 'Pro'}
          </span>
          {usage?.planStatus === 'active' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/20">
              Ativo
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {currentPlanType === 'essential' && (
            <Link
              href="/checkout?plan=pro"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Upgrade para Pro (checkout / Stripe)
            </Link>
          )}
          {currentPlanType === 'pro' && (
            <Link
              href="/checkout?plan=essential"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/25 bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors"
            >
              Mudar para Essential
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/60">Plify Essential</p>
              <h3 className="text-xl font-semibold text-white mt-1 leading-snug">{PLAN_TAGLINE.essential}</h3>
            </div>
            {currentPlanType === 'essential' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/10">
                Seu plano
              </span>
            )}
          </div>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">R$ 49,90</span>
            <span className="text-sm text-white/60 mb-1">/mês</span>
          </div>
          <div className="mt-5 space-y-2.5">
            {PLAN_BULLETS_ESSENTIAL.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-white/80">
                <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-3xl border border-amber-400/25 bg-slate-900/50 p-5 sm:p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.10),0_20px_60px_-40px_rgba(251,191,36,0.45)]">
          <div className="absolute -top-3 right-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400 text-slate-950">
              <Star className="w-3.5 h-3.5 fill-slate-950" />
              Mais escolhido
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-white/60">Plify Pro</p>
              <h3 className="text-xl font-semibold text-white mt-1 leading-snug">{PLAN_TAGLINE.pro}</h3>
            </div>
            {currentPlanType === 'pro' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white text-slate-950 border border-white/10">
                Seu plano
              </span>
            )}
          </div>
          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-bold text-white">R$ 89,90</span>
            <span className="text-sm text-white/60 mb-1">/mês</span>
          </div>
          <div className="mt-5 space-y-2.5">
            {PLAN_BULLETS_PRO.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-white/80">
                <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </div>
          {currentPlanType === 'essential' && (
            <Link
              href="/checkout?plan=pro"
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 text-sm font-bold hover:bg-amber-300 transition-colors"
            >
              Ir para checkout — Pro
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden bg-slate-900/30">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Comparativo rápido</p>
          <p className="text-xs text-white/60">Essential × Pro</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-4 text-sm font-semibold text-white/75 bg-white/5 w-[44%]">Recurso</th>
                <th className="p-4 text-sm font-semibold text-white/75 bg-white/5 text-center">Essential</th>
                <th className="p-4 text-sm font-semibold text-white bg-white/5 text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Pro
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {PLAN_COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm text-white/75">{row.feature}</td>
                  <td className="p-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2 min-h-[24px]">
                      <CellContentDark value={row.essential} />
                    </div>
                  </td>
                  <td className="p-4 text-sm text-center">
                    <div className="flex items-center justify-center gap-2 min-h-[24px]">
                      <CellContentDark value={row.pro} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <h3 className="font-semibold text-white mb-3 text-sm">Dúvidas rápidas</h3>
        <div className="space-y-3 text-sm text-white/75">
          <p>
            <span className="text-white/90 font-medium">Mudar de plano?</span> Sim — pelo checkout; no cartão o Stripe
            ajusta a fatura (upgrade/downgrade).
          </p>
          <p>
            <span className="text-white/90 font-medium">Pagamento?</span> Stripe: PIX por período ou cartão mensal.
          </p>
        </div>
      </div>
    </div>
  )
}
