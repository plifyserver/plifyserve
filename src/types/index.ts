export type ProposalStatus = 'open' | 'accepted' | 'ignored'

/** Status do cliente (modelo Base44) */
export type ClientStatus = 'active' | 'inactive' | 'lead' | 'archived'

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  status: ClientStatus
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  company_name: string | null
  phone: string | null
  avatar_url: string | null
  is_pro: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  edits_remaining: number
  created_at: string
  updated_at: string
}

export interface TemplateBase {
  id: string
  name: string
  slug: string
  description: string | null
  preview_image: string | null
  structure: TemplateStructure
  created_at: string
}

export interface ProposalPlan {
  name: string
  price: number
  includes: string[]
}

export interface TemplateStructure {
  companyLogo?: string
  /** Logo exibida no rodapé (pode ser diferente da do cabeçalho) */
  footerLogo?: string
  companyName: string
  companyPhone: string
  /** Múltiplos telefones (um por linha); usa este se preenchido, senão [companyPhone] */
  companyPhones?: string[]
  companyEmail: string
  /** Múltiplos e-mails de contato (usa este se preenchido, senão [companyEmail]) */
  companyEmails?: string[]
  /** Site da empresa (opcional) */
  companyWebsite?: string
  /** Links de redes sociais da empresa (exibidos só se preenchidos) */
  socialLinks?: {
    instagram?: string
    facebook?: string
    tiktok?: string
    x?: string
  }
  proposalType: string
  serviceType: string
  serviceDescription: string
  includes: string[]
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  /** Se true, proposta não é direcionada a um cliente específico */
  clientesGerais?: boolean
  /** Data da proposta (ISO) */
  proposalDate?: string
  value?: number
  gallery?: string[]
  customSections?: { title: string; content: string }[]
  /** Descrição do produto/serviço */
  productDescription?: string
  /** URL da foto do produto */
  productPhotoUrl?: string
  /** Texto que passa no rolo (marquee) – um único texto (legado) */
  marqueeText?: string
  /** Até 3 textos para o rolo (marquee); se preenchido, usa estes em vez de marqueeText */
  marqueeTexts?: string[]
  /** Até 2 fotos exibidas entre o rolo de texto e os planos/valores */
  middlePhotos?: string[]
  /** 'single' = valor único + o que inclui; 'plans' = até 6 planos */
  pricingMode?: 'single' | 'plans'
  /** Para valor único: o que inclui no pacote */
  singleIncludes?: string[]
  /** Até 6 planos */
  plans?: ProposalPlan[]
  /** Por que me escolher / utilizar meu serviço */
  whyChooseMe?: string
  /** Texto chamativo para contato e incentivo a aceitar */
  contactCta?: string
  /** Texto do botão em cada plano (quando há vários planos); ex: "Aceitar plano" */
  acceptPlanButtonText?: string
}

export interface Proposal {
  id: string
  user_id: string
  template_base_id: string | null
  title: string
  slug: string
  status: ProposalStatus
  content: TemplateStructure
  color_palette: string
  confirm_button_text: string
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  proposal_value: number | null
  created_at: string
  updated_at: string
  accepted_at: string | null
}

export const COLOR_PALETTES = [
  { id: 'default', name: 'Padrão (verde)', colors: ['#000000', '#84cc16', '#ffffff'] },
  { id: 'lime-forest', name: 'Lima Floresta', colors: ['#171717', '#65a30d', '#fafafa'] },
  { id: 'lime-subtle', name: 'Lima Suave', colors: ['#0c0c0c', '#4d7c0f', '#a1a1aa'] },
  { id: 'red', name: 'Vermelho', colors: ['#1c1917', '#dc2626', '#fef2f2'] },
  { id: 'red-dark', name: 'Vermelho Escuro', colors: ['#0a0a0a', '#ef4444', '#fecaca'] },
  { id: 'blue', name: 'Azul', colors: ['#0f172a', '#2563eb', '#eff6ff'] },
  { id: 'blue-sky', name: 'Azul Céu', colors: ['#0c4a6e', '#0ea5e9', '#e0f2fe'] },
  { id: 'purple', name: 'Roxo', colors: ['#1e1b4b', '#7c3aed', '#f5f3ff'] },
  { id: 'purple-violet', name: 'Violeta', colors: ['#2e1065', '#8b5cf6', '#ede9fe'] },
  { id: 'orange', name: 'Laranja', colors: ['#1c1917', '#ea580c', '#fff7ed'] },
  { id: 'amber', name: 'Âmbar', colors: ['#1c1917', '#d97706', '#fffbeb'] },
  { id: 'teal', name: 'Teal', colors: ['#042f2e', '#0d9488', '#ccfbf1'] },
  { id: 'rose', name: 'Rosa', colors: ['#1f1315', '#e11d48', '#ffe4e6'] },
] as const
