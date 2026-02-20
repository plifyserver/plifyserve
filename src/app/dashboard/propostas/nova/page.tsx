'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  Image as ImageIcon,
  Minus,
  Palette,
  ChevronDown,
  Check,
  Calendar,
  Building2,
  User,
  CreditCard,
  FileText,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ImageUploader } from '@/components/proposals/ImageUploader'
import { RichTextEditor } from '@/components/proposals/RichTextEditor'
import { PlanList, type Plan } from '@/components/proposals/PlanCard'
import { ProposalPreview, type ProposalData, type ContentBlock, type ColorPalette } from '@/components/proposals/ProposalPreview'

type TemplateType = 'modern' | 'executive' | 'simple'
type ProposalStatus = 'draft' | 'published' | 'accepted'

const colorPalettes: { name: string; colors: ColorPalette }[] = [
  {
    name: 'Índigo Profissional',
    colors: {
      primary: '#6366F1',
      secondary: '#1E293B',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Verde Confiança',
    colors: {
      primary: '#10B981',
      secondary: '#064E3B',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Roxo Premium',
    colors: {
      primary: '#8B5CF6',
      secondary: '#1E1B4B',
      accent: '#EC4899',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Azul Corporativo',
    colors: {
      primary: '#3B82F6',
      secondary: '#1E3A5F',
      accent: '#F59E0B',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
  {
    name: 'Laranja Energético',
    colors: {
      primary: '#F59E0B',
      secondary: '#78350F',
      accent: '#6366F1',
      background: '#FFFFFF',
      text: '#334155',
    },
  },
]

const sections = [
  { id: 'client', label: 'Cliente', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'payment', label: 'Pagamento', icon: CreditCard },
  { id: 'delivery', label: 'Entrega', icon: Calendar },
  { id: 'content', label: 'Conteúdo', icon: FileText },
  { id: 'blocks', label: 'Blocos', icon: Layers },
  { id: 'style', label: 'Estilo', icon: Palette },
]

function NovaPropostaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateParam = searchParams.get('template') as TemplateType | null

  const [activeSection, setActiveSection] = useState('client')
  const [showPreview, setShowPreview] = useState(true)
  const [status, setStatus] = useState<ProposalStatus>('draft')
  const [isSaving, setIsSaving] = useState(false)
  const [showPaletteSelector, setShowPaletteSelector] = useState(false)

  const [proposalData, setProposalData] = useState<ProposalData>({
    template: templateParam || 'modern',
    clientName: '',
    company: {
      name: '',
      document: '',
      logo: null,
      address: '',
      email: '',
      phone: '',
    },
    paymentType: 'plans',
    plans: [
      {
        id: 'plan-1',
        name: 'Básico',
        description: 'Ideal para começar',
        benefits: ['Benefício 1', 'Benefício 2'],
        price: 997,
        priceType: 'unique',
      },
    ],
    singlePrice: 0,
    deliveryType: 'immediate',
    deliveryDate: '',
    description: '',
    blocks: [],
    colorPalette: colorPalettes[0].colors,
  })

  const updateField = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    setProposalData((prev) => ({ ...prev, [field]: value }))
  }

  const updateCompany = <K extends keyof ProposalData['company']>(
    field: K, 
    value: ProposalData['company'][K]
  ) => {
    setProposalData((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }))
  }

  const addBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'divider' ? '' : type === 'heading' ? 'Novo título' : '',
    }
    updateField('blocks', [...proposalData.blocks, newBlock])
  }

  const updateBlock = (id: string, content: string) => {
    updateField(
      'blocks',
      proposalData.blocks.map((b) => (b.id === id ? { ...b, content } : b))
    )
  }

  const removeBlock = (id: string) => {
    updateField('blocks', proposalData.blocks.filter((b) => b.id !== id))
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    setStatus('draft')
    await new Promise((r) => setTimeout(r, 1000))
    setIsSaving(false)
    alert('Rascunho salvo com sucesso!')
  }

  const handlePublish = async () => {
    if (!proposalData.clientName.trim()) {
      alert('Por favor, preencha o nome do cliente.')
      setActiveSection('client')
      return
    }
    if (!proposalData.company.name.trim()) {
      alert('Por favor, preencha o nome da empresa.')
      setActiveSection('company')
      return
    }

    setIsSaving(true)
    setStatus('published')
    await new Promise((r) => setTimeout(r, 1500))
    setIsSaving(false)
    
    const proposalId = `prop-${Date.now()}`
    alert(`Proposta publicada!\n\nLink: ${window.location.origin}/p/${proposalId}`)
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'client':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Dados do Cliente</h3>
              <p className="text-sm text-slate-500">Informe os dados do cliente para a proposta</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome do cliente *
              </label>
              <Input
                value={proposalData.clientName}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="Nome completo ou empresa do cliente"
                className="rounded-xl border-slate-200"
              />
            </div>
          </div>
        )

      case 'company':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Dados da Empresa</h3>
              <p className="text-sm text-slate-500">Informações que aparecerão na proposta</p>
            </div>
            
            <ImageUploader
              label="Logo da empresa"
              value={proposalData.company.logo || undefined}
              onChange={(url) => updateCompany('logo', url)}
              aspectRatio="video"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome da empresa *
                </label>
                <Input
                  value={proposalData.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  placeholder="Sua Empresa Ltda"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CNPJ ou CPF
                </label>
                <Input
                  value={proposalData.company.document}
                  onChange={(e) => updateCompany('document', e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endereço
              </label>
              <Input
                value={proposalData.company.address}
                onChange={(e) => updateCompany('address', e.target.value)}
                placeholder="Rua, número, bairro - Cidade/UF"
                className="rounded-xl border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={proposalData.company.email}
                  onChange={(e) => updateCompany('email', e.target.value)}
                  placeholder="contato@empresa.com"
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Telefone
                </label>
                <Input
                  value={proposalData.company.phone}
                  onChange={(e) => updateCompany('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Condições de Pagamento</h3>
              <p className="text-sm text-slate-500">Configure os valores e planos da proposta</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tipo de cobrança
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('paymentType', 'plans')}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    proposalData.paymentType === 'plans'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <p className="font-medium text-slate-900">Planos</p>
                  <p className="text-sm text-slate-500 mt-1">Múltiplas opções para o cliente escolher</p>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('paymentType', 'single')}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    proposalData.paymentType === 'single'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <p className="font-medium text-slate-900">Valor único</p>
                  <p className="text-sm text-slate-500 mt-1">Um único valor para o projeto</p>
                </button>
              </div>
            </div>

            {proposalData.paymentType === 'plans' ? (
              <PlanList
                plans={proposalData.plans}
                onChange={(plans) => updateField('plans', plans)}
                accentColor={proposalData.colorPalette.primary}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor do projeto (R$)
                </label>
                <Input
                  type="number"
                  value={proposalData.singlePrice || ''}
                  onChange={(e) => updateField('singlePrice', Number(e.target.value))}
                  placeholder="0,00"
                  min={0}
                  step={0.01}
                  className="rounded-xl border-slate-200 text-xl font-semibold"
                />
              </div>
            )}
          </div>
        )

      case 'delivery':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Prazo de Entrega</h3>
              <p className="text-sm text-slate-500">Defina quando o projeto será entregue</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('deliveryType', 'immediate')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  proposalData.deliveryType === 'immediate'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <p className="font-medium text-slate-900">Entrega imediata</p>
                <p className="text-sm text-slate-500 mt-1">Início após confirmação</p>
              </button>
              <button
                type="button"
                onClick={() => updateField('deliveryType', 'scheduled')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  proposalData.deliveryType === 'scheduled'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <p className="font-medium text-slate-900">Agendada</p>
                <p className="text-sm text-slate-500 mt-1">Escolher data de entrega</p>
              </button>
            </div>

            {proposalData.deliveryType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data de entrega
                </label>
                <Input
                  type="date"
                  value={proposalData.deliveryDate}
                  onChange={(e) => updateField('deliveryDate', e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            )}
          </div>
        )

      case 'content':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Descrição do Projeto</h3>
              <p className="text-sm text-slate-500">Descreva o escopo e detalhes do projeto</p>
            </div>

            <RichTextEditor
              value={proposalData.description}
              onChange={(v) => updateField('description', v)}
              placeholder="Descreva o projeto, objetivos, metodologia..."
              minHeight="200px"
            />
          </div>
        )

      case 'blocks':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Blocos de Conteúdo</h3>
              <p className="text-sm text-slate-500">Adicione seções extras à sua proposta</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('heading')}
                className="gap-2 rounded-lg"
              >
                <Type className="w-4 h-4" />
                Título
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('text')}
                className="gap-2 rounded-lg"
              >
                <FileText className="w-4 h-4" />
                Texto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('image')}
                className="gap-2 rounded-lg"
              >
                <ImageIcon className="w-4 h-4" />
                Imagem
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('divider')}
                className="gap-2 rounded-lg"
              >
                <Minus className="w-4 h-4" />
                Divisor
              </Button>
            </div>

            {proposalData.blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum bloco adicionado</p>
                <p className="text-sm text-slate-400">Use os botões acima para adicionar conteúdo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {proposalData.blocks.map((block) => (
                  <div 
                    key={block.id}
                    className="flex gap-3 items-start p-4 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <GripVertical className="w-5 h-5 text-slate-300 cursor-grab mt-2" />
                    <div className="flex-1 min-w-0">
                      {block.type === 'heading' && (
                        <Input
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, e.target.value)}
                          placeholder="Título da seção"
                          className="font-semibold text-lg border-0 bg-white rounded-lg"
                        />
                      )}
                      {block.type === 'text' && (
                        <RichTextEditor
                          value={block.content}
                          onChange={(v) => updateBlock(block.id, v)}
                          placeholder="Digite o conteúdo..."
                          minHeight="100px"
                        />
                      )}
                      {block.type === 'image' && (
                        <ImageUploader
                          value={block.content || undefined}
                          onChange={(url) => updateBlock(block.id, url || '')}
                          aspectRatio="video"
                        />
                      )}
                      {block.type === 'divider' && (
                        <hr className="border-slate-300 my-2" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'style':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Estilo e Cores</h3>
              <p className="text-sm text-slate-500">Personalize a aparência da proposta</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Paleta de cores
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colorPalettes.map((palette) => (
                  <button
                    key={palette.name}
                    type="button"
                    onClick={() => updateField('colorPalette', palette.colors)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      JSON.stringify(proposalData.colorPalette) === JSON.stringify(palette.colors)
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex -space-x-1">
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white" 
                          style={{ backgroundColor: palette.colors.primary }}
                        />
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white" 
                          style={{ backgroundColor: palette.colors.secondary }}
                        />
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white" 
                          style={{ backgroundColor: palette.colors.accent }}
                        />
                      </div>
                      {JSON.stringify(proposalData.colorPalette) === JSON.stringify(palette.colors) && (
                        <Check className="w-4 h-4 text-indigo-600 ml-auto" />
                      )}
                    </div>
                    <p className="font-medium text-slate-900 text-sm">{palette.name}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Template
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['modern', 'executive', 'simple'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField('template', t)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-center transition-all',
                      proposalData.template === t
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <p className="font-medium text-slate-900 text-sm">
                      {t === 'modern' ? 'Moderno' : t === 'executive' ? 'Executivo' : 'Simples'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header fixo */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/propostas"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="font-semibold text-slate-900">Nova Proposta</h1>
              <p className="text-xs text-slate-500">
                {status === 'draft' ? 'Rascunho' : status === 'published' ? 'Publicada' : 'Aceita'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2 hidden lg:flex"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Ocultar' : 'Preview'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePublish}
              disabled={isSaving}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" />
              Publicar
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar de navegação */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-57px)] sticky top-[57px]">
          <nav className="p-3 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-sm',
                  activeSection === section.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Área principal */}
        <main className={cn(
          'flex-1 min-w-0 transition-all',
          showPreview ? 'lg:w-1/2' : 'w-full'
        )}>
          {/* Mobile tabs */}
          <div className="md:hidden sticky top-[57px] z-20 bg-white border-b border-slate-200 overflow-x-auto">
            <div className="flex px-4 py-2 gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
                    activeSection === section.id
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'text-slate-600'
                  )}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 lg:p-8 max-w-3xl">
            {renderSection()}
          </div>
        </main>

        {/* Preview lateral */}
        {showPreview && (
          <aside className="hidden lg:block w-1/2 min-w-[400px] max-w-[600px] bg-slate-100 border-l border-slate-200 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Preview</h3>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
                  Tempo real
                </span>
              </div>
              <div className="transform scale-[0.85] origin-top">
                <ProposalPreview 
                  data={proposalData} 
                  className="shadow-xl"
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default function NovaPropostaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    }>
      <NovaPropostaContent />
    </Suspense>
  )
}
