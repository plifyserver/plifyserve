'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, FileText } from 'lucide-react'
import type { TemplateBase } from '@/types'

const DEFAULT_TEMPLATES: TemplateBase[] = [
  {
    id: '1',
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
  const templates = DEFAULT_TEMPLATES

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Templates</h1>
      <p className="text-zinc-400 mb-8">
        Escolha um template, personalize com seus dados e gere um link para enviar ao cliente. Você pode gerar várias propostas com o mesmo template e editar cada uma depois.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm"
          >
            <div className="aspect-video relative overflow-hidden bg-gray-100">
              {template.preview_image ? (
                <Image
                  src={template.preview_image}
                  alt={template.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-avocado/30 to-avocado/20 flex items-center justify-center">
                  <FileText className="w-24 h-24 text-white/30 group-hover:scale-110 transition-transform" />
                </div>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{template.description}</p>
              <Link
                href={`/dashboard/templates/${template.slug}/novo`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-avocado hover:bg-avocado-light text-white font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver e Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
