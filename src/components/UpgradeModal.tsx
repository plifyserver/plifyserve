'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { profileService } from '@/lib/services/profile'
import { Sparkles, Crown, Zap, Check, Loader2 } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  type?: 'socio' | 'plan'
}

export function UpgradeModal({ open, onClose, type = 'plan' }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'pro' | null>(null)
  const { refreshProfile, profile } = useAuth()

  const handleUpgradeToSocio = async () => {
    setLoading(true)
    try {
      await profileService.upgradeToSocio()
      await refreshProfile()
      onClose()
      alert('Parabéns! Agora você é um sócio.')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao processar upgrade')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradePlan = async (plan: 'essential' | 'pro') => {
    setLoading(true)
    setSelectedPlan(plan)
    try {
      await profileService.upgradePlan(plan)
      await refreshProfile()
      onClose()
      alert(`Seu plano foi atualizado para ${plan === 'pro' ? 'Pro' : 'Essential'}!`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao processar upgrade')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  if (type === 'socio') {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl">Virar Sócio</DialogTitle>
            <DialogDescription className="text-slate-600">
              Tenha acesso a recursos exclusivos e ajude a plataforma a crescer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">Benefícios de Sócio</h4>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600" />
                  Acesso antecipado a novos recursos
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600" />
                  Badge exclusivo de sócio
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600" />
                  Participação nas decisões da plataforma
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600" />
                  Suporte prioritário
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handleUpgradeToSocio} 
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Crown className="w-4 h-4 mr-2" />
              )}
              Virar Sócio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Escolha seu Plano</DialogTitle>
          <DialogDescription className="text-slate-600">
            Selecione o plano ideal para suas necessidades.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Essential Plan */}
          <div 
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              profile?.plan === 'essential' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
            onClick={() => !loading && profile?.plan !== 'essential' && handleUpgradePlan('essential')}
          >
            {profile?.plan === 'essential' && (
              <span className="absolute -top-3 left-4 px-2 py-0.5 bg-indigo-500 text-white text-xs font-medium rounded-full">
                Plano Atual
              </span>
            )}
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Essential</h3>
            <p className="text-3xl font-bold text-slate-900 mb-4">
              R$ 29<span className="text-base font-normal text-slate-500">/mês</span>
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600" />
                Até 50 templates
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600" />
                Upload de imagens
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600" />
                Suporte por email
              </li>
            </ul>
            {selectedPlan === 'essential' && loading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div 
            className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
              profile?.plan === 'pro' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
            }`}
            onClick={() => !loading && profile?.plan !== 'pro' && handleUpgradePlan('pro')}
          >
            {profile?.plan === 'pro' && (
              <span className="absolute -top-3 left-4 px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">
                Plano Atual
              </span>
            )}
            <div className="absolute -top-3 right-4 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
              Popular
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Pro</h3>
            <p className="text-3xl font-bold text-slate-900 mb-4">
              R$ 79<span className="text-base font-normal text-slate-500">/mês</span>
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Templates ilimitados
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Upload de imagens ilimitado
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Suporte prioritário
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-600" />
                Recursos exclusivos
              </li>
            </ul>
            {selectedPlan === 'pro' && loading && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            )}
          </div>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full rounded-xl">
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
