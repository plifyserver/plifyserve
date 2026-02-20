export interface Proposal {
  id: string
  user_id: string
  title: string
  client_name: string | null
  client_email: string | null
  content: ProposalContent
  status: ProposalStatus
  public_slug: string | null
  slug: string | null
  views: number
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface ProposalContent {
  company?: {
    name?: string
    logo?: string
    cnpj?: string
    address?: string
    email?: string
    phone?: string
  }
  description?: string
  plans?: Array<{
    name: string
    description?: string
    benefits?: string[]
    price: number
    type: 'single' | 'monthly'
  }>
  delivery?: {
    type: 'immediate' | 'scheduled'
    date?: string
  }
  blocks?: Array<{
    id: string
    type: 'text' | 'image'
    content: string
  }>
}

export interface ProposalAnalytics {
  views: number
  unique_views: number
  first_view: string | null
  last_view: string | null
  device_breakdown: Record<string, number>
  timeline: Array<{
    id: string
    viewed_at: string
    ip_address: string | null
    country: string | null
    city: string | null
    device_type: string | null
  }>
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'ignored'

export const proposalsService = {
  async getAll(): Promise<Proposal[]> {
    const res = await fetch('/api/proposals', { credentials: 'include' })
    if (!res.ok) throw new Error('Erro ao buscar propostas')
    return res.json()
  },

  async getById(id: string): Promise<Proposal> {
    const res = await fetch(`/api/proposals/${id}`, { credentials: 'include' })
    if (!res.ok) throw new Error('Proposta não encontrada')
    return res.json()
  },

  async create(data: Partial<Proposal>): Promise<Proposal> {
    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao criar proposta')
    return res.json()
  },

  async update(id: string, data: Partial<Proposal>): Promise<Proposal> {
    const res = await fetch(`/api/proposals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao atualizar proposta')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/proposals/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Erro ao excluir proposta')
  },

  async getAnalytics(id: string): Promise<ProposalAnalytics> {
    const res = await fetch(`/api/proposals/${id}/analytics`, { credentials: 'include' })
    if (!res.ok) throw new Error('Erro ao buscar analytics')
    return res.json()
  },

  async send(id: string): Promise<Proposal> {
    return this.update(id, { status: 'sent' } as Partial<Proposal>)
  },

  async duplicate(proposal: Proposal): Promise<Proposal> {
    return this.create({
      title: `${proposal.title} (cópia)`,
      client_name: proposal.client_name,
      client_email: proposal.client_email,
      content: proposal.content,
      status: 'draft',
    })
  },

  getPublicUrl(proposal: Proposal): string {
    const slug = proposal.public_slug || proposal.slug
    return `${window.location.origin}/p/${slug}`
  },

  getStatusLabel(status: ProposalStatus): string {
    const labels: Record<ProposalStatus, string> = {
      draft: 'Rascunho',
      sent: 'Enviada',
      viewed: 'Visualizada',
      accepted: 'Aceita',
      ignored: 'Ignorada',
    }
    return labels[status] || status
  },

  getStatusColor(status: ProposalStatus): string {
    const colors: Record<ProposalStatus, string> = {
      draft: 'bg-slate-100 text-slate-600',
      sent: 'bg-blue-100 text-blue-700',
      viewed: 'bg-amber-100 text-amber-700',
      accepted: 'bg-emerald-100 text-emerald-700',
      ignored: 'bg-slate-100 text-slate-500',
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  },
}

export default proposalsService
