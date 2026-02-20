'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, FileText, Plus, Trash2, Edit, Loader2, AlertTriangle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useTemplates } from '@/hooks/useTemplates'
import { useAuth } from '@/contexts/AuthContext'
import { UpgradeModal } from '@/components/UpgradeModal'
import type { TemplateBase } from '@/types'

const DEFAULT_TEMPLATES: TemplateBase[] = [
  {
    id: 'default-1',
    name: 'Executive Bold',
    slug: 'executive-bold',
    description: 'Design corporativo com cards em perspectiva 3D e efeitos de profundidade',
    preview_image: '/images/template-executive-bold.png',
    structure: {
      companyName: 'Sua Empresa',
      companyPhone: '(11) 99999-9999',
      companyEmail: 'contato@empresa.com',
      proposalType: 'Proposta Comercial',
      serviceType: 'Consultoria',
      serviceDescription: 'Descrição do serviço que você oferece',
      includes: ['Item inclusivo 1', 'Item inclusivo 2', 'Suporte 30 dias'],
    },
    created_at: new Date().toISOString(),
  },
]

export default function TemplatesPage() {
  const { templates, loading, createTemplate, deleteTemplate, templateLimit, templatesUsed, canCreate } = useTemplates()
  const { profile } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await createTemplate(newTitle.trim(), newDescription.trim() || undefined)
      setShowCreateModal(false)
      setNewTitle('')
      setNewDescription('')
    } catch (error) {
      if (error instanceof Error && error.message.includes('limite')) {
        setShowCreateModal(false)
        setShowUpgradeModal(true)
      } else {
        alert(error instanceof Error ? error.message : 'Erro ao criar template')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteTemplate(deleteId)
      setDeleteId(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao excluir template')
    } finally {
      setDeleting(false)
    }
  }

  const handleNewClick = () => {
    if (!canCreate) {
      setShowUpgradeModal(true)
    } else {
      setShowCreateModal(true)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button onClick={handleNewClick} className="rounded-xl gap-2">
          <Plus className="w-4 h-4" />
          Novo Template
        </Button>
      </div>
      
      <p className="text-slate-500 mb-4">
        Escolha um template, personalize com seus dados e gere um link para enviar ao cliente.
      </p>

      {/* Usage indicator */}
      {templateLimit !== null && (
        <div className={`mb-6 p-4 rounded-xl ${
          templatesUsed >= templateLimit 
            ? 'bg-red-50 border border-red-200' 
            : templatesUsed >= templateLimit * 0.8 
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-slate-50 border border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {templatesUsed >= templateLimit ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <FileText className="w-5 h-5 text-slate-600" />
              )}
              <span className="font-medium text-slate-900">
                {templatesUsed} de {templateLimit} templates utilizados
              </span>
            </div>
            {templatesUsed >= templateLimit && (
              <Button 
                size="sm" 
                onClick={() => setShowUpgradeModal(true)}
                className="rounded-lg gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Sparkles className="w-4 h-4" />
                Fazer Upgrade
              </Button>
            )}
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                templatesUsed >= templateLimit 
                  ? 'bg-red-500' 
                  : templatesUsed >= templateLimit * 0.8 
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (templatesUsed / templateLimit) * 100)}%` }}
            />
          </div>
          {profile?.plan === 'free' && (
            <p className="text-xs text-slate-500 mt-2">
              Plano Free: máx. 10 templates. <button onClick={() => setShowUpgradeModal(true)} className="text-indigo-600 hover:underline">Upgrade para mais</button>
            </p>
          )}
          {profile?.plan === 'essential' && (
            <p className="text-xs text-slate-500 mt-2">
              Plano Essential: máx. 50 templates. <button onClick={() => setShowUpgradeModal(true)} className="text-indigo-600 hover:underline">Upgrade para ilimitado</button>
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* User Templates */}
          {templates.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-slate-900">Meus Templates</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-indigo-300 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">{template.title}</h3>
                      <p className="text-slate-500 text-sm mb-3 line-clamp-2">
                        {template.description || 'Sem descrição'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/templates/${template.id}/editar`}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Link>
                        <button
                          onClick={() => setDeleteId(template.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Default Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-slate-900">Templates Padrão</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {DEFAULT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100">
                    {template.preview_image ? (
                      <Image
                        src={template.preview_image}
                        alt={template.name}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                        <FileText className="w-24 h-24 text-emerald-300 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{template.description}</p>
                    <Link
                      href={`/dashboard/templates/${template.id || template.slug}/novo`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Usar Template
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Novo Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome do template *
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Proposta Comercial"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descrição (opcional)
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Breve descrição do template"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newTitle.trim()} className="rounded-xl">
              {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Criar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 py-4">
            Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} variant="destructive" className="rounded-xl">
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        type="plan" 
      />
    </div>
  )
}
