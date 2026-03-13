'use client'

import { useState } from 'react'
import { Check, Star, Loader2 } from 'lucide-react'
import { useBilling } from '@/hooks/useBilling'
import type { PlanType } from '@/services/billing'
import { useAuth } from '@/contexts/AuthContext'
import { profileService } from '@/lib/services/profile'
import { toast } from 'sonner'

const COMPARISON_ROWS: { feature: string; essential: string | 'check' | 'dash'; pro: string | 'check' | 'dash' }[] = [
  { feature: 'Preço', essential: 'R$ 49,90 / mês', pro: 'R$ 89,90 / mês' },
  { feature: 'Usuários', essential: '1 usuário', pro: 'Até 5 usuários' },
  { feature: 'Clientes', essential: 'Até 20', pro: 'Ilimitados' },
  { feature: 'Propostas por mês', essential: '5', pro: 'Ilimitadas' },
  { feature: 'Templates de propostas', essential: '1 template', pro: '2 templates' },
  { feature: 'Contratos por mês', essential: '5', pro: 'Ilimitados' },
  { feature: 'Dashboard', essential: 'Dashboard completo', pro: 'Dashboard completo + personalização' },
  { feature: 'Agenda', essential: 'Básica (sem integrações)', pro: 'Agenda com integrações' },
  { feature: 'Gestão de Projetos', essential: 'check', pro: 'check' },
  { feature: 'Controle Financeiro', essential: 'check', pro: 'check' },
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planos</h1>
        <p className="text-slate-500">Compare os planos Essential e Pro</p>
      </div>

      {/* Seu plano atual + CTA upgrade */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Seu plano atual:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
            currentPlanType === 'pro' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {currentPlanType === 'pro' && <Star className="w-4 h-4 text-amber-400" />}
            {currentPlanType === 'essential' ? 'Essential' : 'Pro'}
          </span>
          {usage?.planStatus === 'active' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Ativo</span>
          )}
        </div>
        {canUpgrade && (
          <button
            onClick={handleUpgrade}
            disabled={!!upgrading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Fazer upgrade para Pro
          </button>
        )}
      </div>

      {/* Tabela comparativa corporativa */}
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-4 text-sm font-semibold text-slate-300 bg-slate-800/80 w-[40%]">
                Recurso
              </th>
              <th className="p-4 text-sm font-semibold text-slate-300 bg-slate-800/80 text-center">
                Essential
              </th>
              <th className="p-4 text-sm font-semibold text-white bg-slate-800 text-center">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Pro
                </span>
                <span className="block text-xs font-normal text-amber-400 mt-0.5">Mais escolhido</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {COMPARISON_ROWS.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-sm text-slate-300">{row.feature}</td>
                <td className="p-4 text-sm text-center">
                  <div className="flex items-center justify-center gap-2 min-h-[24px]">
                    <CellContent value={row.essential} />
                  </div>
                </td>
                <td className="p-4 text-sm text-center bg-slate-800/30">
                  <div className="flex items-center justify-center gap-2 min-h-[24px]">
                    <CellContent value={row.pro} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Perguntas frequentes</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-slate-700">Posso mudar de plano a qualquer momento?</p>
            <p className="text-slate-500 mt-1">
              Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações entram em vigor imediatamente.
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
