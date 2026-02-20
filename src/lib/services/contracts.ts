import { createClient } from '@/lib/supabase/client'

export interface Contract {
  id: string
  user_id: string
  title: string
  file_url: string | null
  client_id: string | null
  client_name: string | null
  company_name: string | null
  company_logo: string | null
  signatories: Signatory[]
  status: ContractStatus
  sent_at: string | null
  signed_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Signatory {
  name: string
  email: string
  signed: boolean
  signed_at?: string | null
  signature_url?: string | null
  cpf?: string | null
  birth_date?: string | null
  location?: {
    latitude: number | null
    longitude: number | null
    address: string | null
  } | null
}

export interface ContractSignature {
  id: string
  contract_id: string
  client_name: string
  client_email: string | null
  cpf: string | null
  birth_date: string | null
  signature_image: string | null
  ip_address: string | null
  location: Record<string, unknown> | null
  signed_at: string
  created_at: string
}

export type ContractStatus = 'draft' | 'sent' | 'pending' | 'signed' | 'expired'

export const contractsService = {
  async getAll(): Promise<Contract[]> {
    const res = await fetch('/api/contracts', { credentials: 'include' })
    if (!res.ok) throw new Error('Erro ao buscar contratos')
    return res.json()
  },

  async getById(id: string): Promise<Contract> {
    const res = await fetch(`/api/contracts/${id}`, { credentials: 'include' })
    if (!res.ok) throw new Error('Contrato não encontrado')
    return res.json()
  },

  async create(data: Partial<Contract>): Promise<Contract> {
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao criar contrato')
    return res.json()
  },

  async update(id: string, data: Partial<Contract>): Promise<Contract> {
    const res = await fetch(`/api/contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erro ao atualizar contrato')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/contracts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Erro ao excluir contrato')
  },

  async uploadPdf(file: File, userId: string): Promise<string> {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw new Error('Erro ao fazer upload do arquivo')

    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  },

  async deletePdf(url: string): Promise<void> {
    const supabase = createClient()
    const path = url.split('/contracts/')[1]
    if (path) {
      await supabase.storage.from('contracts').remove([path])
    }
  },

  async sendForSignature(id: string): Promise<Contract> {
    return this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
    } as Partial<Contract>)
  },

  async duplicate(contract: Contract): Promise<Contract> {
    return this.create({
      title: `${contract.title} (cópia)`,
      file_url: contract.file_url,
      client_id: contract.client_id,
      client_name: contract.client_name,
      status: 'draft',
      signatories: contract.signatories?.map(s => ({
        ...s,
        signed: false,
        signed_at: null,
        signature_url: null,
      })) || [],
    })
  },

  getSignatureLink(contractId: string): string {
    return `${window.location.origin}/assinatura/${contractId}`
  },

  isExpired(contract: Contract): boolean {
    if (!contract.expires_at) return false
    return new Date(contract.expires_at) < new Date()
  },

  canSign(contract: Contract): boolean {
    return contract.status !== 'signed' && contract.status !== 'expired' && !this.isExpired(contract)
  },
}

export default contractsService
