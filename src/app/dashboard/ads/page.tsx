'use client'

import { useEffect, useState } from 'react'
import { Plus, Megaphone, DollarSign, Users, Target, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MetricsCard from '@/components/ads/MetricsCard'

const PLATFORMS = [
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
  { value: 'other', label: 'Outro' },
]
const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'ended', label: 'Encerrada' },
]

interface AdCampaign {
  id: string
  name: string
  platform: string
  investment: number | null
  leads: number | null
  conversions: number | null
  start_date: string | null
  end_date: string | null
  status: string
  account_link: string | null
  created_at: string
}

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<AdCampaign | null>(null)
  const [form, setForm] = useState({
    name: '',
    platform: 'meta',
    investment: '',
    leads: '',
    conversions: '',
    start_date: '',
    end_date: '',
    status: 'active',
    account_link: '',
  })

  const fetchCampaigns = async () => {
    const res = await fetch('/api/ad-campaigns', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setCampaigns(data)
    }
  }

  useEffect(() => {
    fetchCampaigns().finally(() => setLoading(false))
  }, [])

  const totalInvestment = campaigns.reduce((s, c) => s + (Number(c.investment) || 0), 0)
  const totalLeads = campaigns.reduce((s, c) => s + (Number(c.leads) || 0), 0)
  const totalConversions = campaigns.reduce((s, c) => s + (Number(c.conversions) || 0), 0)
  const activeCount = campaigns.filter((c) => c.status === 'active').length

  const openDialog = (campaign: AdCampaign | null) => {
    if (campaign) {
      setSelected(campaign)
      setForm({
        name: campaign.name,
        platform: campaign.platform,
        investment: campaign.investment != null ? String(campaign.investment) : '',
        leads: campaign.leads != null ? String(campaign.leads) : '',
        conversions: campaign.conversions != null ? String(campaign.conversions) : '',
        start_date: campaign.start_date || '',
        end_date: campaign.end_date || '',
        status: campaign.status,
        account_link: campaign.account_link || '',
      })
    } else {
      setSelected(null)
      setForm({
        name: '',
        platform: 'meta',
        investment: '',
        leads: '',
        conversions: '',
        start_date: '',
        end_date: '',
        status: 'active',
        account_link: '',
      })
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelected(null)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = selected ? `/api/ad-campaigns/${selected.id}` : '/api/ad-campaigns'
    const method = selected ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: form.name,
        platform: form.platform,
        investment: form.investment ? Number(form.investment) : null,
        leads: form.leads ? Number(form.leads) : null,
        conversions: form.conversions ? Number(form.conversions) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        account_link: form.account_link || null,
      }),
    })
    if (res.ok) {
      await fetchCampaigns()
      closeDialog()
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir esta campanha?')) return
    const res = await fetch(`/api/ad-campaigns/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await fetchCampaigns()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ads</h1>
          <p className="text-slate-500">Acompanhe o desempenho das suas campanhas (Meta, Google).</p>
        </div>
        <Button onClick={() => openDialog(null)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Nova campanha
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Investimento total"
          value={totalInvestment}
          format="currency"
          icon={DollarSign}
          color="#3B82F6"
        />
        <MetricsCard
          title="Leads"
          value={totalLeads}
          format="number"
          icon={Users}
          color="#10B981"
        />
        <MetricsCard
          title="Conversões"
          value={totalConversions}
          format="number"
          icon={Target}
          color="#8B5CF6"
        />
        <MetricsCard
          title="Campanhas ativas"
          value={activeCount}
          format="number"
          icon={Megaphone}
          color="#F59E0B"
        />
      </div>

      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Carregando...</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Nenhuma campanha. Clique em &quot;Nova campanha&quot; para começar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Plataforma</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Investimento</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Leads</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Conversões</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Período</th>
                  <th className="w-10 p-4" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-900">{c.name}</td>
                    <td className="p-4 text-slate-600">
                      {PLATFORMS.find((p) => p.value === c.platform)?.label ?? c.platform}
                    </td>
                    <td className="p-4 text-right text-slate-600">
                      {c.investment != null
                        ? `R$ ${Number(c.investment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '-'}
                    </td>
                    <td className="p-4 text-right text-slate-600">{c.leads ?? '-'}</td>
                    <td className="p-4 text-right text-slate-600">{c.conversions ?? '-'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.status === 'paused'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === c.status)?.label ?? c.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {c.start_date
                        ? format(new Date(c.start_date), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                      {c.end_date ? ` - ${format(new Date(c.end_date), 'dd/MM/yyyy', { locale: ptBR })}` : ''}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => openDialog(c)} className="rounded-lg">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => remove(c.id)}
                            className="text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selected ? 'Editar campanha' : 'Nova campanha'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Black Friday"
                required
                className="rounded-xl mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plataforma</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="rounded-xl mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Investimento (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.investment}
                  onChange={(e) => setForm({ ...form, investment: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Leads</Label>
                <Input
                  type="number"
                  value={form.leads}
                  onChange={(e) => setForm({ ...form, leads: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Conversões</Label>
                <Input
                  type="number"
                  value={form.conversions}
                  onChange={(e) => setForm({ ...form, conversions: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Início</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Término</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Link da conta</Label>
              <Input
                value={form.account_link}
                onChange={(e) => setForm({ ...form, account_link: e.target.value })}
                placeholder="https://..."
                className="rounded-xl mt-1"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
