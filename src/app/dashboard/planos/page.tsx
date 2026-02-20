'use client'

import { useState } from 'react'
import { Check, Zap, Sparkles, ChevronRight, Loader2 } from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import { PLANS, type PlanType } from '@/services/billing'
import { useAuth } from '@/contexts/AuthContext'
import { profileService } from '@/lib/services/profile'

export default function PlanosPage() {
  const {
    usage,
    isLoading,
    templatesUsed,
    templatesLimit,
    usagePercentage,
    isUnlimited,
    refetch,
  } = useBilling()

  const { profile, refreshProfile } = useAuth()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const currentPlanType = usage?.planType || profile?.plan || 'essential'

  const handleUpgrade = async (planId: PlanType) => {
    if (planId === currentPlanType) return
    
    setUpgrading(planId)
    try {
      await profileService.upgradePlan(planId)
      await refreshProfile()
      refetch()
      alert(`Seu plano foi atualizado para ${planId === 'pro' ? 'Pro' : 'Essential'}!`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao processar upgrade')
    } finally {
      setUpgrading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planos</h1>
        <p className="text-slate-500">Escolha o plano ideal para suas necessidades</p>
      </div>

      {/* Current Plan Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">Seu plano atual</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                currentPlanType === 'pro' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {currentPlanType === 'pro' && <Zap className="w-4 h-4" />}
                {currentPlanType === 'essential' && <Sparkles className="w-4 h-4" />}
                {currentPlanType.charAt(0).toUpperCase() + currentPlanType.slice(1)}
              </span>
              {usage?.planStatus && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  usage.planStatus === 'active' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {usage.planStatus === 'active' ? 'Ativo' : usage.planStatus}
                </span>
              )}
            </div>
          </div>
          {currentPlanType !== 'pro' && currentPlanType !== 'admin' && (
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={upgrading === 'pro'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {upgrading === 'pro' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Fazer Upgrade
            </button>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Templates usados</span>
            <span className="text-sm font-medium text-slate-900">
              {isUnlimited ? (
                <span className="text-emerald-600">Ilimitado</span>
              ) : (
                `${templatesUsed} / ${templatesLimit}`
              )}
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercentage >= 90
                    ? 'bg-red-500'
                    : usagePercentage >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          )}
          {!isUnlimited && usagePercentage >= 80 && (
            <p className="text-xs text-amber-600 mt-2">
              Você está próximo do limite. Considere fazer upgrade para o plano Pro.
            </p>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {Object.values(PLANS).map((plan) => {
          const isCurrentPlan = currentPlanType === plan.id
          const canUpgrade = currentPlanType === 'essential' && plan.id === 'pro'
          const isUpgrading = upgrading === plan.id

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${
                plan.popular
                  ? 'border-purple-300 shadow-lg shadow-purple-100'
                  : 'border-slate-200'
              } ${isCurrentPlan ? 'ring-2 ring-purple-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 right-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium">
                    Popular
                  </span>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
                    <Check className="w-3 h-3 mr-1" />
                    Plano Atual
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.id === 'pro' ? 'bg-purple-100' : 'bg-indigo-100'
                }`}>
                  {plan.id === 'pro' ? (
                    <Zap className="w-6 h-6 text-purple-600" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-indigo-600" />
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  R$ {plan.price}
                </span>
                <span className="text-slate-500 text-sm">/mês</span>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      plan.id === 'pro' ? 'bg-purple-100' : 'bg-indigo-100'
                    }`}>
                      <Check className={`w-3 h-3 ${
                        plan.id === 'pro' ? 'text-purple-600' : 'text-indigo-600'
                      }`} />
                    </div>
                    <span className="text-sm text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => canUpgrade && handleUpgrade(plan.id)}
                disabled={isCurrentPlan || !canUpgrade || isUpgrading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : canUpgrade
                    ? plan.id === 'pro'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : isCurrentPlan ? (
                  'Plano atual'
                ) : canUpgrade ? (
                  <>
                    Fazer Upgrade
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  'Não disponível'
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* FAQ or Info */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Perguntas frequentes</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-slate-700">Posso mudar de plano a qualquer momento?</p>
            <p className="text-slate-500 mt-1">
              Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor imediatamente.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">O que acontece se eu atingir o limite de templates?</p>
            <p className="text-slate-500 mt-1">
              Você receberá um aviso e não poderá criar novos templates até fazer upgrade ou excluir alguns existentes.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700">Como funciona o pagamento?</p>
            <p className="text-slate-500 mt-1">
              Em breve teremos integração com Stripe para pagamentos automáticos. Por enquanto, entre em contato para ativar seu plano.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
