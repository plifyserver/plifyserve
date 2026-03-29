'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { TemplateEditor } from '@/components/TemplateEditor'
import { ArrowLeft } from 'lucide-react'
import type { TemplateStructure } from '@/types'
import { toast } from 'sonner'
import { canUseProposalPreset, getPresetByIdOrSlug } from '@/config/proposal-presets'
import { resolveEffectivePlan } from '@/lib/plan-entitlements'

const DEFAULT_STRUCTURE: TemplateStructure = {
  companyName: 'Sua Empresa',
  companyPhone: '(11) 99999-9999',
  companyEmail: 'contato@empresa.com',
  proposalType: 'Proposta Comercial',
  serviceType: 'Consultoria',
  serviceDescription: 'Descrição do serviço que você oferece',
  includes: ['Item inclusivo 1', 'Item inclusivo 2', 'Suporte 30 dias'],
  proposalDate: new Date().toISOString().slice(0, 10),
  pricingMode: 'single',
}

export default function NovoProposalPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()

  const templateId = params.id as string
  const isPro = profile?.is_pro ?? false
  const editsRemaining = profile?.edits_remaining ?? 8

  useEffect(() => {
    if (!profile) return
    const preset = getPresetByIdOrSlug(templateId)
    if (!preset) return
    const plan = resolveEffectivePlan(profile)
    if (!canUseProposalPreset(plan, templateId)) {
      toast.error('Este modelo não está disponível no seu plano.')
      router.replace('/dashboard/templates')
    }
  }, [profile, templateId, router])

  const handleSave = async (
    content: TemplateStructure,
    confirmButtonText: string,
    colorPalette: string
  ) => {
    const proposalSlug = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        template_base_id: templateId,
        title: content.proposalType + ' - ' + content.serviceType,
        slug: proposalSlug,
        content,
        color_palette: colorPalette,
        confirm_button_text: confirmButtonText,
        client_name: content.clientName || null,
        client_email: content.clientEmail || null,
        client_phone: content.clientPhone || null,
        proposal_value: content.value || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error('Erro ao salvar: ' + (err.error || 'Erro desconhecido'))
      return
    }

    router.push('/dashboard/propostas')
    router.refresh()
  }

  return (
    <div>
      <Link
        href="/dashboard/templates"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos templates
      </Link>

      <h1 className="text-2xl font-bold mb-6">Nova proposta</h1>

      <TemplateEditor
        initialContent={{
          ...DEFAULT_STRUCTURE,
          companyLogo: undefined,
        }}
        onSave={handleSave}
        isPro={isPro}
        editsRemaining={editsRemaining}
      />
    </div>
  )
}
