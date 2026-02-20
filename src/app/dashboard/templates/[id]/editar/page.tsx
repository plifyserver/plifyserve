'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, Save, Loader2, Upload, Trash2, Plus, 
  Image as ImageIcon, GripVertical, AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTemplate } from '@/hooks/useTemplates'

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  
  const { template, images, loading, error, updateTemplate, addImage, removeImage } = useTemplate(templateId)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [initialized, setInitialized] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (template && !initialized) {
    setTitle(template.title)
    setDescription(template.description || '')
    setInitialized(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTemplate({ title, description })
      alert('Template salvo com sucesso!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    setUploading(true)
    try {
      await addImage(file)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Remover esta imagem?')) return
    try {
      await removeImage(imageId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao remover imagem')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Template não encontrado</h2>
        <p className="text-slate-500 mb-4">{error || 'O template que você procura não existe.'}</p>
        <Link href="/dashboard/templates">
          <Button className="rounded-xl">Voltar aos Templates</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/templates"
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Template</h1>
            <p className="text-slate-500">Personalize seu template</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Informações</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome do template *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Proposta Comercial"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descrição
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o propósito deste template..."
                  className="rounded-xl min-h-[100px]"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Imagens</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Adicionar Imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {images.length === 0 ? (
              <div 
                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Arraste imagens ou clique para fazer upload</p>
                <p className="text-slate-400 text-sm mt-1">PNG, JPG ou WEBP (máx. 5MB)</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div 
                    key={image.id} 
                    className="group relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
                  >
                    <Image
                      src={image.image_url}
                      alt="Template image"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleRemoveImage(image.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                      <GripVertical className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ))}
                <div 
                  className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <span className="text-sm text-slate-500">Adicionar</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Informações</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Criado em</dt>
                <dd className="text-slate-900 font-medium">
                  {new Date(template.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Última atualização</dt>
                <dd className="text-slate-900 font-medium">
                  {new Date(template.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Imagens</dt>
                <dd className="text-slate-900 font-medium">{images.length}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6">
            <h3 className="font-semibold text-indigo-900 mb-2">Dica</h3>
            <p className="text-sm text-indigo-700">
              Adicione imagens ao seu template para criar propostas mais visuais e profissionais. 
              As imagens serão salvas automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
