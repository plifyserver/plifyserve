'use client'

import { X, Plus, GripVertical, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface Plan {
  id: string
  name: string
  description: string
  benefits: string[]
  price: number
  priceType: 'unique' | 'monthly'
  highlighted?: boolean
}

interface PlanCardProps {
  plan: Plan
  onChange: (plan: Plan) => void
  onRemove: () => void
  accentColor?: string
  isEditing?: boolean
}

export function PlanCard({ 
  plan, 
  onChange, 
  onRemove, 
  accentColor = '#6366F1',
  isEditing = true 
}: PlanCardProps) {
  const updateField = <K extends keyof Plan>(field: K, value: Plan[K]) => {
    onChange({ ...plan, [field]: value })
  }

  const addBenefit = () => {
    updateField('benefits', [...plan.benefits, ''])
  }

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...plan.benefits]
    newBenefits[index] = value
    updateField('benefits', newBenefits)
  }

  const removeBenefit = (index: number) => {
    const newBenefits = plan.benefits.filter((_, i) => i !== index)
    updateField('benefits', newBenefits)
  }

  if (!isEditing) {
    return (
      <div 
        className={cn(
          'relative rounded-2xl border-2 p-6 transition-all',
          plan.highlighted 
            ? 'border-current shadow-lg scale-105' 
            : 'border-slate-200'
        )}
        style={plan.highlighted ? { borderColor: accentColor } : undefined}
      >
        {plan.highlighted && (
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: accentColor }}
          >
            Recomendado
          </div>
        )}
        <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
        <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
        <div className="mb-4">
          <span className="text-3xl font-bold text-slate-900">
            R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          {plan.priceType === 'monthly' && (
            <span className="text-slate-500 text-sm">/mês</span>
          )}
        </div>
        <ul className="space-y-2">
          {plan.benefits.filter(b => b.trim()).map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <GripVertical className="w-5 h-5 text-slate-300 cursor-grab" />
        <Input
          value={plan.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Nome do plano"
          className="flex-1 font-semibold border-0 bg-transparent p-0 h-auto text-lg focus:ring-0"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Descrição</label>
          <Input
            value={plan.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descreva o plano brevemente..."
            className="rounded-xl border-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Benefícios</label>
          <div className="space-y-2">
            {plan.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <Input
                  value={benefit}
                  onChange={(e) => updateBenefit(index, e.target.value)}
                  placeholder="Benefício incluído..."
                  className="flex-1 rounded-lg border-slate-200 h-9 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeBenefit(index)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addBenefit}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar benefício
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Valor (R$)</label>
            <Input
              type="number"
              value={plan.price || ''}
              onChange={(e) => updateField('price', Number(e.target.value))}
              placeholder="0,00"
              min={0}
              step={0.01}
              className="rounded-xl border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipo</label>
            <select
              value={plan.priceType}
              onChange={(e) => updateField('priceType', e.target.value as 'unique' | 'monthly')}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="unique">Valor único</option>
              <option value="monthly">Por mês</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id={`highlight-${plan.id}`}
            checked={plan.highlighted || false}
            onChange={(e) => updateField('highlighted', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor={`highlight-${plan.id}`} className="text-sm text-slate-600">
            Destacar como recomendado
          </label>
        </div>
      </div>
    </div>
  )
}

interface PlanListProps {
  plans: Plan[]
  onChange: (plans: Plan[]) => void
  accentColor?: string
}

export function PlanList({ plans, onChange, accentColor }: PlanListProps) {
  const addPlan = () => {
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: '',
      description: '',
      benefits: [''],
      price: 0,
      priceType: 'unique',
    }
    onChange([...plans, newPlan])
  }

  const updatePlan = (index: number, plan: Plan) => {
    const newPlans = [...plans]
    newPlans[index] = plan
    onChange(newPlans)
  }

  const removePlan = (index: number) => {
    onChange(plans.filter((_, i) => i !== index))
  }

  const getGridClass = () => {
    if (plans.length === 1) return 'max-w-md mx-auto'
    if (plans.length === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto'
    if (plans.length === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-4'
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
  }

  return (
    <div className="space-y-4">
      <div className={getGridClass()}>
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onChange={(p) => updatePlan(index, p)}
            onRemove={() => removePlan(index)}
            accentColor={accentColor}
          />
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addPlan}
          className="rounded-xl gap-2 border-dashed border-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar plano
        </Button>
      </div>
    </div>
  )
}
