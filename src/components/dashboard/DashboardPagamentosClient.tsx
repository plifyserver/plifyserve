'use client'

import { useCallback, useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { Loader2, Trash2, Copy, ImageDown, FileDown, MessageCircle, Printer, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { BRAZILIAN_BANK_NAMES } from '@/lib/brazilianBanks'
import { DASH_SURFACE_CARD, SITE_CONTAINER_SM } from '@/lib/siteLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type PixSettings = {
  pix_key: string
  holder_name: string
  merchant_city: string
  updated_at?: string
}

type PixCharge = {
  id: string
  amount: number
  bank_name: string
  payment_kind: 'single' | 'reusable'
  description: string | null
  br_code: string
  qr_data_url: string
  created_at: string
}

function formatMoney(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type PixKeyType = 'email' | 'phone' | 'cpf' | 'cnpj' | 'random'

function digitsOnly(s: string) {
  return s.replace(/\D/g, '')
}

function maskCpf(d: string) {
  const x = d.slice(0, 11)
  return x
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2}).*/, '$1.$2.$3-$4')
}

function maskCnpj(d: string) {
  const x = d.slice(0, 14)
  return x
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2}).*/, '$1.$2.$3/$4-$5')
}

function formatPhoneDigitsToE164(d: string) {
  // d: apenas dígitos
  if (!d) return '+55'
  if (d.startsWith('55')) return `+${d.slice(0, 13)}`
  return `+55${d.slice(0, 11)}`
}

function prettyPhoneFromDigits(d: string) {
  // mostra no input num formato amigável: +55 (DD) 9XXXX-XXXX
  const clean = d.startsWith('55') ? d.slice(2) : d
  const x = clean.slice(0, 11)
  const dd = x.slice(0, 2)
  const rest = x.slice(2)
  const nine = rest.length >= 9 ? rest.slice(0, 1) : ''
  const p1 = rest.length >= 5 ? rest.slice(1, 5) : rest.slice(1)
  const p2 = rest.length >= 9 ? rest.slice(5, 9) : rest.slice(5)
  if (!dd) return '+55'
  if (!rest) return `+55 (${dd})`
  if (!p2) return `+55 (${dd}) ${nine}${p1}`
  return `+55 (${dd}) ${nine}${p1}-${p2}`
}

function inferKeyTypeFromStored(key: string): PixKeyType {
  const k = key.trim()
  if (k.includes('@')) return 'email'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(k)) return 'random'
  const d = digitsOnly(k)
  if (k.startsWith('+')) return 'phone'
  if (d.length === 14) return 'cnpj'
  if (d.length === 11) return 'cpf'
  return 'phone'
}

function formatCentsDigitsToMoneyBRL(digits: string) {
  const d = digitsOnly(digits).replace(/^0+(?=\d)/, '')
  const cents = d === '' ? '0' : d
  const n = Number(cents) / 100
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(/\s+/)
  let line = ''
  let cy = y
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' '
    if (doc.getTextWidth(test) > maxWidth && i > 0) {
      doc.text(line.trim(), x, cy)
      line = words[i] + ' '
      cy += lineHeight
    } else {
      line = test
    }
  }
  doc.text(line.trim(), x, cy)
  return cy + lineHeight
}

export function DashboardPagamentosClient() {
  const [loading, setLoading] = useState(true)
  const [featureOff, setFeatureOff] = useState(false)
  const [settings, setSettings] = useState<PixSettings | null>(null)
  const [charges, setCharges] = useState<PixCharge[]>([])
  const [savingSettings, setSavingSettings] = useState(false)
  const [creating, setCreating] = useState(false)

  const [formSettings, setFormSettings] = useState({
    pix_key: '',
    holder_name: '',
    merchant_city: 'São Paulo',
  })

  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('email')
  const [pixKeyDisplay, setPixKeyDisplay] = useState('')

  const [amountDigits, setAmountDigits] = useState('')

  const [formCharge, setFormCharge] = useState({
    amount: '',
    bank_name: BRAZILIAN_BANK_NAMES[0] ?? 'Nubank',
    description: '',
    payment_kind: 'reusable' as 'single' | 'reusable',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setFeatureOff(false)
    try {
      const [rs, rc] = await Promise.all([
        fetch('/api/pix/settings', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pix/charges', { credentials: 'include', cache: 'no-store' }),
      ])
      if (rs.status === 403 || rc.status === 403) {
        setFeatureOff(true)
        setSettings(null)
        setCharges([])
        return
      }
      if (!rs.ok) {
        const ej = (await rs.json().catch(() => ({}))) as { error?: string }
        throw new Error(ej.error || 'Erro ao carregar')
      }
      if (!rc.ok) {
        const ej = (await rc.json().catch(() => ({}))) as { error?: string }
        throw new Error(ej.error || 'Erro ao carregar')
      }

      const sj = (await rs.json()) as { settings: PixSettings | null }
      const cj = (await rc.json()) as { charges: PixCharge[] }
      setSettings(sj.settings)
      setCharges(cj.charges ?? [])
      if (sj.settings) {
        setFormSettings({
          pix_key: sj.settings.pix_key,
          holder_name: sj.settings.holder_name,
          merchant_city: sj.settings.merchant_city || 'São Paulo',
        })
        const inferred = inferKeyTypeFromStored(sj.settings.pix_key)
        setPixKeyType(inferred)
        if (inferred === 'phone') {
          setPixKeyDisplay(prettyPhoneFromDigits(digitsOnly(sj.settings.pix_key)))
        } else if (inferred === 'cpf') {
          setPixKeyDisplay(maskCpf(digitsOnly(sj.settings.pix_key)))
        } else if (inferred === 'cnpj') {
          setPixKeyDisplay(maskCnpj(digitsOnly(sj.settings.pix_key)))
        } else {
          setPixKeyDisplay(sj.settings.pix_key)
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      let pixKeyToSend = pixKeyDisplay.trim()
      if (pixKeyType === 'phone') {
        pixKeyToSend = formatPhoneDigitsToE164(digitsOnly(pixKeyDisplay))
      } else if (pixKeyType === 'cpf' || pixKeyType === 'cnpj') {
        pixKeyToSend = digitsOnly(pixKeyDisplay)
      } else if (pixKeyType === 'email') {
        pixKeyToSend = pixKeyToSend.toLowerCase()
      } else if (pixKeyType === 'random') {
        pixKeyToSend = pixKeyToSend.toLowerCase()
      }

      const res = await fetch('/api/pix/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formSettings, pix_key: pixKeyToSend }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; settings?: PixSettings }
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')
      setSettings(data.settings ?? null)
      if (data.settings?.pix_key) {
        const inferred = inferKeyTypeFromStored(data.settings.pix_key)
        setPixKeyType(inferred)
        if (inferred === 'phone') {
          setPixKeyDisplay(prettyPhoneFromDigits(digitsOnly(data.settings.pix_key)))
        } else if (inferred === 'cpf') {
          setPixKeyDisplay(maskCpf(digitsOnly(data.settings.pix_key)))
        } else if (inferred === 'cnpj') {
          setPixKeyDisplay(maskCnpj(digitsOnly(data.settings.pix_key)))
        } else {
          setPixKeyDisplay(data.settings.pix_key)
        }
      }
      toast.success('Dados PIX salvos.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSavingSettings(false)
    }
  }

  const createCharge = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const amountToSend = amountDigits === '' ? '' : (Number(amountDigits) / 100).toFixed(2)
      const res = await fetch('/api/pix/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: amountToSend,
          bank_name: formCharge.bank_name,
          description: formCharge.description,
          payment_kind: formCharge.payment_kind,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; charge?: PixCharge }
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar PIX')
      if (data.charge) setCharges((prev) => [data.charge!, ...prev])
      setFormCharge((f) => ({ ...f, amount: '', description: '' }))
      setAmountDigits('')
      toast.success('PIX gerado com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar')
    } finally {
      setCreating(false)
    }
  }

  const removeCharge = async (id: string) => {
    if (!confirm('Excluir este PIX gerado?')) return
    try {
      const res = await fetch(`/api/pix/charges/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Falha ao excluir')
      setCharges((p) => p.filter((c) => c.id !== id))
      toast.success('Removido.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir')
    }
  }

  const copyBr = (code: string) => {
    void navigator.clipboard.writeText(code)
    toast.success('Código copiado.')
  }

  const downloadPng = (c: PixCharge) => {
    const a = document.createElement('a')
    a.href = c.qr_data_url
    a.download = `pix-${c.id.slice(0, 8)}.png`
    a.click()
  }

  const downloadPdf = (c: PixCharge) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    doc.setFontSize(16)
    doc.text('PIX — Plify', 14, 18)
    doc.setFontSize(11)
    let y = 28
    doc.text(`Valor: ${formatMoney(Number(c.amount))}`, 14, y)
    y += 7
    doc.text(`Banco: ${c.bank_name}`, 14, y)
    y += 7
    doc.text(`Modo: ${c.payment_kind === 'single' ? 'Pagamento único' : 'Vários pagamentos (reutilizável)'}`, 14, y)
    y += 10
    doc.addImage(c.qr_data_url, 'PNG', 14, y, 70, 70)
    y += 78
    doc.setFontSize(9)
    doc.text('Copia e cola:', 14, y)
    y += 5
    y = wrapText(doc, c.br_code, 14, y, 182, 5) + 4
    doc.setFontSize(8)
    doc.setTextColor(120)
    doc.text('Gerado na Plify. Confira o valor e o recebedor antes de pagar.', 14, y)
    doc.save(`pix-${c.id.slice(0, 8)}.pdf`)
  }

  const shareWhatsApp = (c: PixCharge) => {
    const text = [
      `PIX — ${formatMoney(Number(c.amount))}`,
      `Banco: ${c.bank_name}`,
      c.payment_kind === 'single' ? 'Tipo: pagamento único' : 'Tipo: várias pessoas podem pagar (reutilizável)',
      '',
      'Copia e cola:',
      c.br_code,
    ].join('\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const printCharge = (c: PixCharge) => {
    const w = window.open('', '_blank')
    if (!w) {
      toast.error('Permita pop-ups para imprimir.')
      return
    }
    const mode = c.payment_kind === 'single' ? 'Pagamento único' : 'Reutilizável'
    w.document.write(`<!DOCTYPE html><html><head><title>PIX</title></head><body style="font-family:sans-serif;padding:24px">
      <h1 style="font-size:18px">PIX</h1>
      <p><strong>Valor:</strong> ${escapeHtml(formatMoney(Number(c.amount)))}</p>
      <p><strong>Banco:</strong> ${escapeHtml(c.bank_name)}</p>
      <p><strong>Modo:</strong> ${escapeHtml(mode)}</p>
      <img src="${c.qr_data_url}" alt="QR" style="width:240px;height:240px" />
      <p style="font-size:11px;word-break:break-all"><strong>Copia e cola:</strong><br/>${escapeHtml(c.br_code)}</p>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`)
    w.document.close()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (featureOff) {
    return (
      <div className={cn(SITE_CONTAINER_SM)}>
        <div className={cn(DASH_SURFACE_CARD, 'p-8 text-center')}>
          <QrCode className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h1 className="text-xl font-semibold text-slate-900">Pagamentos PIX</h1>
          <p className="mt-2 text-sm text-slate-600">
            Esta função não está ativa. Quando o administrador ativar em <strong>CMS → Pagamentos</strong>, você poderá
            cadastrar sua chave PIX e gerar QR Codes aqui.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', SITE_CONTAINER_SM)}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pagamentos PIX</h1>
        <p className="text-slate-500">Cadastre sua chave, gere cobranças com QR Code e compartilhe por WhatsApp, PDF ou impressão.</p>
      </div>

      <form onSubmit={saveSettings} className={cn(DASH_SURFACE_CARD, 'space-y-4 p-6')}>
        <h2 className="text-lg font-semibold text-slate-900">Seus dados PIX</h2>
        <p className="text-sm text-slate-600">
          Informe a chave que você usa para receber (e-mail, telefone, CPF, CNPJ ou chave aleatória) e o nome como
          consta no cadastro do banco.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Tipo de chave</span>
            <div className="mt-2 grid gap-3 sm:grid-cols-[220px_1fr]">
              <select
                value={pixKeyType}
                onChange={(e) => {
                  const next = e.target.value as PixKeyType
                  setPixKeyType(next)
                  setPixKeyDisplay('')
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="email">E-mail</option>
                <option value="phone">Celular</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="random">Chave aleatória</option>
              </select>
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Chave PIX</span>
                <input
                  value={pixKeyDisplay}
                  onChange={(e) => {
                    const v = e.target.value
                    if (pixKeyType === 'email' || pixKeyType === 'random') {
                      setPixKeyDisplay(v)
                      return
                    }
                    const d = digitsOnly(v)
                    if (pixKeyType === 'cpf') setPixKeyDisplay(maskCpf(d))
                    else if (pixKeyType === 'cnpj') setPixKeyDisplay(maskCnpj(d))
                    else setPixKeyDisplay(prettyPhoneFromDigits(d))
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder={
                    pixKeyType === 'email'
                      ? 'ex.: seu@email.com'
                      : pixKeyType === 'phone'
                        ? 'ex.: +55 (11) 99999-0000'
                        : pixKeyType === 'cpf'
                          ? 'ex.: 000.000.000-00'
                          : pixKeyType === 'cnpj'
                            ? 'ex.: 00.000.000/0000-00'
                            : 'ex.: 123e4567-e89b-12d3-a456-426614174000'
                  }
                  required
                />
                <p className="text-xs text-slate-500">
                  {pixKeyType === 'phone'
                    ? 'Pode digitar só os números. A Plify salva como +55...'
                    : pixKeyType === 'cpf' || pixKeyType === 'cnpj'
                      ? 'Pode digitar com ou sem pontuação.'
                      : pixKeyType === 'random'
                        ? 'Use o formato UUID.'
                        : 'Digite o e-mail normalmente.'}
                </p>
              </div>
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nome do recebedor</span>
            <input
              value={formSettings.holder_name}
              onChange={(e) => setFormSettings((f) => ({ ...f, holder_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nome completo ou razão social"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Cidade (para o QR)</span>
            <input
              value={formSettings.merchant_city}
              onChange={(e) => setFormSettings((f) => ({ ...f, merchant_city: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="ex.: São Paulo"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={savingSettings} className="rounded-xl">
            {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar dados PIX
          </Button>
        </div>
      </form>

      <form onSubmit={createCharge} className={cn(DASH_SURFACE_CARD, 'space-y-4 p-6')}>
        <h2 className="text-lg font-semibold text-slate-900">Gerar novo PIX</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Valor (R$)</span>
            <input
              value={amountDigits === '' ? '' : formatCentsDigitsToMoneyBRL(amountDigits)}
              onChange={(e) => {
                const next = digitsOnly(e.target.value).slice(0, 9) // até 9 dígitos = 9.999.999,99
                setAmountDigits(next)
                setFormCharge((f) => ({ ...f, amount: next }))
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="0,00 (digite só números)"
              inputMode="decimal"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Banco</span>
            <select
              value={formCharge.bank_name}
              onChange={(e) => setFormCharge((f) => ({ ...f, bank_name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {BRAZILIAN_BANK_NAMES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descrição (opcional)</span>
            <input
              value={formCharge.description}
              onChange={(e) => setFormCharge((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="ex.: Serviço de consultoria"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium text-slate-700">Tipo de cobrança</legend>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="payment_kind"
                  checked={formCharge.payment_kind === 'single'}
                  onChange={() => setFormCharge((f) => ({ ...f, payment_kind: 'single' }))}
                />
                Pagamento único (transação única no PIX)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="payment_kind"
                  checked={formCharge.payment_kind === 'reusable'}
                  onChange={() => setFormCharge((f) => ({ ...f, payment_kind: 'reusable' }))}
                />
                Vários pagamentos (várias pessoas podem pagar o mesmo QR)
              </label>
            </div>
          </fieldset>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={creating || !pixKeyDisplay.trim()} className="rounded-xl">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
            Gerar QR Code
          </Button>
        </div>
      </form>

      <div className={cn(DASH_SURFACE_CARD, 'p-6')}>
        <h2 className="text-lg font-semibold text-slate-900">PIX gerados</h2>
        {charges.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Nenhum PIX gerado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {charges.map((c) => (
              <li key={c.id} className="flex flex-col gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0 lg:flex-row lg:items-start">
                <img src={c.qr_data_url} alt="" className="h-40 w-40 shrink-0 rounded-xl border border-slate-200 bg-white p-2" />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-lg font-semibold text-slate-900">{formatMoney(Number(c.amount))}</p>
                  <p className="text-sm text-slate-600">
                    {c.bank_name} · {c.payment_kind === 'single' ? 'Único' : 'Reutilizável'}
                  </p>
                  {c.description ? <p className="text-sm text-slate-500">{c.description}</p> : null}
                  <p className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleString('pt-BR')}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => copyBr(c.br_code)}>
                      <Copy className="mr-1 h-4 w-4" />
                      Copiar código
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => downloadPng(c)}>
                      <ImageDown className="mr-1 h-4 w-4" />
                      PNG
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => downloadPdf(c)}>
                      <FileDown className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => shareWhatsApp(c)}>
                      <MessageCircle className="mr-1 h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => printCharge(c)}>
                      <Printer className="mr-1 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-red-600 hover:bg-red-50"
                      onClick={() => void removeCharge(c.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
