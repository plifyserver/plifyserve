'use client'

import { useState } from 'react'
import { Check, Star, Loader2 } from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import type { PlanType } from '@/services/billing'
import { useAuth } from '@/contexts/AuthContext'
import { profileService } from '@/lib/services/profile'
import { SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { toast } from 'sonner'

const COMPARISON_ROWS: { feature: string; essential: string | 'check' | 'dash'; pro: string | 'check' | 'dash' }[] = [
  { feature: 'Preço', essential: 'R$ 49,90 / mês', pro: 'R$ 89,90 / mês' },
  { feature: 'Clientes', essential: 'Até 20', pro: 'Ilimitados' },
  { feature: 'Propostas por mês', essential: '5', pro: 'Ilimitadas' },
  { feature: 'Templates de propostas', essential: '1 template', pro: '2 templates' },
  { feature: 'Contratos por mês', essential: '5', pro: 'Ilimitados' },
  { feature: 'Dashboard', essential: 'Dashboard completo', pro: 'Dashboard completo + personalização' },
  { feature: 'Agenda', essential: 'Básica (sem integrações)', pro: 'Agenda com integrações' },
  { feature: 'Gestão de Projetos', essential: 'check', pro: 'check' },
  { feature: 'Gastos Pessoais', essential: 'check', pro: 'check' },
  { feature: 'Relatórios', essential: 'Relatórios completos', pro: 'Relatórios completos' },
  { feature: 'Mapa Mental Estratégico', essential: 'Até 5 mapas', pro: 'Ilimitados' },
  { feature: 'Gestão de Tarefas', essential: 'check', pro: 'check' },
  { feature: 'Indicadores de Performance', essential: 'dash', pro: 'check' },
  { feature: 'Gestão de Ads (Tráfego)', essential: 'dash', pro: 'check' },
  { feature: 'White Label', essential: 'dash', pro: 'Personalização completa' },
  { feature: 'Integrações avançadas', essential: 'dash', pro: 'check' },
  { feature: 'Suporte prioritário', essential: 'dash', pro: 'check' },
  { feature: 'Atualizações antecipadas', essential: 'dash', pro: 'check' },
  { feature: 'Novas funcionalidades', essential: 'dash', pro: 'Acesso antecipado' },
]

function CellContent({ value }: { value: string | 'check' | 'dash' }) {
  if (value === 'check') {
    return <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" strokeWidth={2.5} />
  }
  if (value === 'dash') {
    return <span className="text-slate-500">—</span>
  }
  return <span className="text-white">{value}</span>
}

export default function PlanosPage() {
  const { usage, isLoading, refetch } = useBilling()
  const { profile, refreshProfile } = useAuth()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const currentPlanType: PlanType = (usage?.planType || profile?.plan || 'essential') as PlanType
  const canUpgrade = currentPlanType === 'essential'

  const handleUpgrade = async () => {
    if (!canUpgrade) return
    setUpgrading('pro')
    try {
      await profileService.upgradePlan('pro')
      await refreshProfile()
      refetch()
      toast.success('Seu plano foi atualizado para Pro!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar upgrade')
    } finally {
      setUpgrading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400" />
      </div>
    )
  }

  return (
    <div className={SITE_CONTAINER_LG}>
      <div className="rounded-3xl bg-slate-950 border border-white/10 p-4 sm:p-6 lg:p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.75)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-white">Planos</h1>
          <p className="text-white/70">Escolha o plano ideal e compare recursos</p>
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
          {canUpgrade && (
            <button
              onClick={handleUpgrade}
              disabled={!!upgrading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Fazer upgrade para Pro
            </button>
          )}
        </div>

        {/* Cards separados (estilo mais “arejado”, mantendo fundo preto) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Essential */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-white/60">Plify Essential</p>
                <h2 className="text-xl font-semibold text-white mt-1">Essencial para começar</h2>
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
            <div className="mt-5 space-y-3">
              {[
                'Até 20 clientes',
                '5 propostas por mês',
                '1 template de proposta',
                'Até 5 mapas mentais',
                'Dashboard completo',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <span className="min-w-0">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
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
                <h2 className="text-xl font-semibold text-white mt-1">Completo para crescer</h2>
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
            <div className="mt-5 space-y-3">
              {[
                'Clientes ilimitados',
                'Propostas ilimitadas',
                'White Label',
                'Integrações avançadas',
                'Mapas mentais ilimitados',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/80">
                  <Check className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                  <span className="min-w-0">{item}</span>
                </div>
              ))}
            </div>
            {canUpgrade && (
              <button
                onClick={handleUpgrade}
                disabled={!!upgrading}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-400 text-slate-950 text-sm font-bold hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Fazer upgrade para Pro
              </button>
            )}
          </div>
        </div>

        {/* Comparativo detalhado (mantido), com mais respiro */}
        <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden bg-slate-900/30">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Comparativo detalhado</p>
            <p className="text-xs text-white/60">Essential vs Pro</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[720px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-sm font-semibold text-white/75 bg-white/5 w-[44%]">
                    Recurso
                  </th>
                  <th className="p-4 text-sm font-semibold text-white/75 bg-white/5 text-center">
                    Essential
                  </th>
                  <th className="p-4 text-sm font-semibold text-white bg-white/5 text-center">
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      Pro
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm text-white/75">{row.feature}</td>
                    <td className="p-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2 min-h-[24px]">
                        <CellContent value={row.essential} />
                      </div>
                    </td>
                    <td className="p-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-2 min-h-[24px]">
                        <CellContent value={row.pro} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h3 className="font-semibold text-white mb-4">Perguntas frequentes</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-white/90">Posso mudar de plano a qualquer momento?</p>
              <p className="text-white/70 mt-1">
                Sim. Você pode fazer upgrade ou downgrade a qualquer momento. As alterações entram em vigor imediatamente.
              </p>
            </div>
            <div>
              <p className="font-medium text-white/90">Como funciona o pagamento?</p>
              <p className="text-white/70 mt-1">
                Em breve teremos integração com Stripe para pagamentos automáticos. Por enquanto, entre em contato para ativar seu plano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
