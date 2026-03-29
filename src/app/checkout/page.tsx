'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, CreditCard, Loader2, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/services/billing'
import { SITE_GUTTER_X } from '@/lib/siteLayout'
import { cn } from '@/lib/utils'
import { useBilling, BILLING_USAGE_KEY } from '@/hooks/useBilling'
import { toast } from 'sonner'
import { CheckoutMarketingLayout } from '@/components/CheckoutMarketingLayout'

const ACCENT = '#dc2626'
const VALID = ['essential', 'pro'] as const
type CheckoutPlanId = (typeof VALID)[number]

function formatBrl(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDatePt(iso: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')
  const canceled = searchParams.get('canceled')
  const paymentRequired = searchParams.get('payment_required') === '1'
  const queryClient = useQueryClient()
  const { usage, isLoading: usageLoading } = useBilling()

  const initialPlan: CheckoutPlanId =
    planParam && VALID.includes(planParam as CheckoutPlanId) ? (planParam as CheckoutPlanId) : 'essential'

  const [plan, setPlan] = useState<CheckoutPlanId>(initialPlan)
  const [cardLoading, setCardLoading] = useState(false)
  const [changingSub, setChangingSub] = useState(false)

  const isStaff =
    usage?.accountType === 'admin' || usage?.accountType === 'socio'
  const currentKind: CheckoutPlanId = usage?.planType === 'pro' ? 'pro' : 'essential'
  const hasPaid = !usageLoading && !!usage && usage.hasActivePaidAccess === true
  /** Só uma faixa de preço quando o site manda ?plan=pro (upgrade) ou ?plan=essential (downgrade). */
  const upgradeCheckoutFlow =
    hasPaid && !isStaff && currentKind === 'essential' && planParam === 'pro'
  const downgradeCheckoutFlow =
    hasPaid && !isStaff && currentKind === 'pro' && planParam === 'essential'
  const restrictPlanChoice = upgradeCheckoutFlow || downgradeCheckoutFlow

  useEffect(() => {
    if (usageLoading || !usage) return
    const staff = usage.accountType === 'admin' || usage.accountType === 'socio'
    const paid = usage.hasActivePaidAccess === true
    const cur: CheckoutPlanId = usage.planType === 'pro' ? 'pro' : 'essential'
    const p = searchParams.get('plan')
    if (paid && !staff && cur === 'essential' && p === 'pro') {
      setPlan('pro')
      return
    }
    if (paid && !staff && cur === 'pro' && p === 'essential') {
      setPlan('essential')
      return
    }
    if (p === 'essential' || p === 'pro') setPlan(p)
  }, [usageLoading, usage, searchParams])

  const visiblePlans: CheckoutPlanId[] = upgradeCheckoutFlow
    ? ['pro']
    : downgradeCheckoutFlow
      ? ['essential']
      : ['essential', 'pro']

  const hasCardSubscription =
    !!usage?.subscriptionId && usage.planStatus !== 'cancelled'

  const prepaidPeriodActive =
    !usage?.subscriptionId &&
    usage?.planStatus === 'active' &&
    !!usage?.planExpiresAt &&
    new Date(usage.planExpiresAt) > new Date()

  const samePlanSelected = plan === currentKind
  const blockNewCheckout = samePlanSelected && prepaidPeriodActive

  const selected = PLANS[plan]

  const invalidateBilling = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BILLING_USAGE_KEY })
  }, [queryClient])

  const startCardCheckout = useCallback(async () => {
    setCardLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan, paymentKind: 'card' }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento')
      }
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error('URL de checkout ausente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao abrir checkout')
    } finally {
      setCardLoading(false)
    }
  }, [plan])

  const applySubscriptionChange = useCallback(async () => {
    setChangingSub(true)
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetPlan: plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível alterar o plano')
      }
      toast.success(data.message || 'Plano atualizado.')
      invalidateBilling()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao alterar plano')
    } finally {
      setChangingSub(false)
    }
  }, [plan, invalidateBilling])

  const showNewPayment = !hasCardSubscription && !blockNewCheckout
  const showSubscriptionChange = hasCardSubscription && !samePlanSelected
  const showAlreadyOnPlanCard = hasCardSubscription && samePlanSelected
  const showAlreadyPrepaid = !hasCardSubscription && blockNewCheckout

  const showDashboardShortcut = !usageLoading && usage?.hasActivePaidAccess === true

  return (
    <CheckoutMarketingLayout showDashboardLink={showDashboardShortcut}>
      <div className={cn('flex-1 py-5 sm:py-12', SITE_GUTTER_X)}>
        <div className="max-w-xl mx-auto w-full">
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              Assinatura — escolha o plano
            </h1>
            <p className="mt-2 text-gray-600 text-sm leading-relaxed">
              Pagamento seguro com <span className="font-medium text-gray-800">cartão de crédito</span>, cobrança
              mensal. Quem já tem assinatura no cartão pode mudar de plano com ajuste proporcional na fatura
              (Stripe).
            </p>

            {paymentRequired && (
              <div className="mt-5 rounded-sm border border-red-200 bg-red-50 px-3 py-3 sm:px-4 text-sm text-red-950">
                <p className="font-semibold">Pagamento necessário</p>
                <p className="mt-1 text-red-900/90 leading-relaxed">
                  Para usar o painel e os recursos do Plify, conclua a assinatura abaixo. Depois do pagamento
                  confirmado pelo Stripe, o acesso é liberado automaticamente.
                </p>
              </div>
            )}

            {canceled && (
              <div className="mt-6 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Pagamento cancelado. Você pode tentar de novo quando quiser.
              </div>
            )}

            <div className="mt-6 flex items-start gap-3 rounded-sm border border-gray-200 bg-neutral-50 px-4 py-3 text-sm text-gray-700">
              <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-medium text-gray-900">Checkout protegido</p>
                <p className="mt-1 text-gray-600 leading-relaxed">
                  Você será redirecionado para a página oficial do Stripe para inserir o cartão. Dados sensíveis
                  não passam pelos nossos servidores.
                </p>
              </div>
            </div>

            {!usageLoading && usage && (
              <div className="mt-6 rounded-sm border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                <span className="text-gray-500">Plano atual na conta: </span>
                <span className="font-semibold text-gray-900">
                  {currentKind === 'pro' ? 'Pro' : 'Essential'}
                </span>
                {hasCardSubscription && (
                  <span className="block mt-1 text-xs text-gray-500">
                    Assinatura ativa no cartão. Para mudar de plano, use a opção abaixo quando selecionar outro
                    plano.
                  </span>
                )}
                {prepaidPeriodActive && !hasCardSubscription && usage.planExpiresAt && (
                  <span className="block mt-1 text-xs text-gray-500">
                    Acesso pago até {formatDatePt(usage.planExpiresAt)}. Para outro plano, escolha acima e conclua
                    uma nova assinatura.
                  </span>
                )}
              </div>
            )}

            <div className="mt-6 sm:mt-8 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Plano</p>
              {restrictPlanChoice && (
                <p className="text-xs text-gray-600 leading-relaxed -mt-1">
                  {upgradeCheckoutFlow
                    ? 'Sua conta já está no Essential. Neste fluxo só aparece o valor do Pro (upgrade).'
                    : 'Sua conta já está no Pro. Neste fluxo só aparece o valor do Essential (downgrade).'}
                </p>
              )}
              <div
                className={cn(
                  'grid gap-3',
                  visiblePlans.length === 1 ? 'grid-cols-1' : 'grid-cols-1 min-[420px]:grid-cols-2'
                )}
              >
                {visiblePlans.map((id) => {
                  const p = PLANS[id]
                  const active = plan === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPlan(id)}
                      className={cn(
                        'rounded-sm border p-3.5 sm:p-4 text-left transition-all outline-none min-h-[4.5rem] sm:min-h-0',
                        active
                          ? 'border-red-600 bg-white shadow-md ring-2 ring-red-600/20'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      )}
                    >
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">{p.name}</p>
                      <p className="mt-1 text-base sm:text-lg font-bold text-gray-900">
                        {formatBrl(p.price)}
                        <span className="text-xs sm:text-sm font-normal text-gray-500">/mês</span>
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {usageLoading ? (
              <div className="mt-10 flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {showAlreadyOnPlanCard && (
                  <div className="mt-10 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                    Este já é o plano da sua assinatura no cartão. Se quiser outro valor, selecione o outro plano
                    acima e confirme a alteração.
                  </div>
                )}

                {showAlreadyPrepaid && (
                  <div className="mt-10 rounded-sm border border-gray-200 bg-neutral-50 px-4 py-4 text-sm text-gray-800">
                    Este plano já está ativo até {formatDatePt(usage?.planExpiresAt ?? null)}. Para renovar ou
                    mudar, escolha outro plano ou aguarde o fim do período.
                  </div>
                )}

                {showSubscriptionChange && (
                  <div className="mt-8 sm:mt-10 space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Sua assinatura no cartão
                    </p>
                    <div className="rounded-sm border border-gray-300 bg-neutral-50 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3">
                        <div
                          className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-sm text-white mx-auto sm:mx-0"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <ArrowRightLeft className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 text-center sm:text-left">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">
                            Alterar para {selected.name}
                          </p>
                          <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                            O Stripe aplica ajuste proporcional na próxima fatura (upgrade ou downgrade).
                          </p>
                          <button
                            type="button"
                            disabled={changingSub}
                            onClick={applySubscriptionChange}
                            className="mt-4 w-full rounded-sm bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                          >
                            {changingSub ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Confirmar alteração na assinatura
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showNewPayment && (
                  <div className="mt-8 sm:mt-10 space-y-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Pagamento</p>
                    <button
                      type="button"
                      disabled={cardLoading}
                      onClick={startCardCheckout}
                      className="w-full flex flex-col sm:flex-row items-stretch sm:items-start gap-3 sm:gap-4 rounded-sm border border-gray-300 bg-white p-4 sm:p-5 text-left hover:border-gray-400 transition-colors disabled:opacity-60"
                    >
                      <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-sm bg-gray-900 text-white mx-auto sm:mx-0 sm:mt-0.5">
                        {cardLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CreditCard className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-center sm:text-left">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">Cartão de crédito</p>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {formatBrl(selected.price)} por mês, renovação automática. Cancele quando quiser no painel
                          do Stripe ou entre em contato.
                        </p>
                        <span
                          className="mt-3 sm:mt-3 inline-flex w-full sm:w-auto justify-center items-center rounded-sm px-4 py-2.5 sm:py-2.5 text-sm font-semibold text-white"
                          style={{ backgroundColor: ACCENT }}
                        >
                          {cardLoading ? 'Abrindo checkout…' : 'Continuar para pagamento'}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}

            <p className="mt-6 sm:mt-8 text-[11px] sm:text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-5 sm:pt-6">
              Dúvidas sobre cobrança? Consulte os{' '}
              <Link href="/termos-uso" className="text-red-600 hover:text-red-700 font-medium">
                termos de uso
              </Link>{' '}
              ou{' '}
              <Link href="/suporte" className="text-red-600 hover:text-red-700 font-medium">
                suporte
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </CheckoutMarketingLayout>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <CheckoutMarketingLayout showDashboardLink={false}>
          <div className={cn('flex-1 flex items-center justify-center py-16 sm:py-24', SITE_GUTTER_X)}>
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CheckoutMarketingLayout>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
