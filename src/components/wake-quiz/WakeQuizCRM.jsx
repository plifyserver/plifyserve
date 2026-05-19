'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, Search, Trash2 } from 'lucide-react'
import { expandQuizAnswersForDisplay, mergeWakeQuizQuestions } from '@/lib/wakeQuizQuestions'

const STATUS_LABELS = {
  novo: { label: 'Novo', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  em_contato: { label: 'Em contato', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  reuniao_agendada: { label: 'Reunião agendada', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  cliente: { label: 'Cliente', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  perdido: { label: 'Perdido', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
}

const PERFIL_LABELS = {
  autonomo: 'Autônomo(a)',
  pequeno: 'Salão até 3 prof.',
  medio: 'Salão 4-10 prof.',
  grande: 'Salão +10 prof.',
}

const FATURAMENTO_LABELS = {
  '100k': '+R$100k',
  '50_100k': 'R$50k-100k',
  '25_50k': 'R$25k-50k',
  '10_25k': 'R$10k-25k',
}

async function fetchLeads() {
  const res = await fetch('/api/dashboard/wake-quiz/leads', { credentials: 'include' })
  if (!res.ok) {
    throw new Error('Falha ao carregar leads')
  }
  return res.json()
}

export default function WakeQuizCRM() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [selectedLead, setSelectedLead] = useState(null)
  const [brand, setBrand] = useState({ logoUrl: null, headerLogoH: 36 })
  /** Definição do quiz (mesma fonte que o fluxo público) para mapear campos → título e opções → rótulo. */
  const [quizQuestions, setQuizQuestions] = useState([])
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const qc = useQueryClient()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/dashboard/wake-quiz/hero', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok || cancelled) return
        const logoUrl = typeof data.logoUrl === 'string' ? data.logoUrl : null
        const h =
          typeof data?.hero?.questionHeaderLogoMaxHeightPx === 'number'
            ? data.hero.questionHeaderLogoMaxHeightPx
            : 44
        const headerLogoH = Math.min(64, Math.max(24, Math.round(h)))
        if (!cancelled) {
          setBrand({ logoUrl, headerLogoH })
          setQuizQuestions(mergeWakeQuizQuestions(data?.questions))
        }
      } catch {
        /* ok */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['wake-quiz-leads'],
    queryFn: fetchLeads,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/dashboard/wake-quiz/leads/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Falha ao atualizar')
      return json
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wake-quiz-leads'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/dashboard/wake-quiz/leads/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Falha ao excluir')
      return json
    },
    onSuccess: () => {
      setSelectedLead(null)
      qc.invalidateQueries({ queryKey: ['wake-quiz-leads'] })
    },
  })

  const filtered = leads.filter((l) => {
    const qa = l.quiz_answers && typeof l.quiz_answers === 'object' ? l.quiz_answers : null
    const qaBlob =
      qa && Object.keys(qa).length > 0
        ? (quizQuestions.length > 0
            ? expandQuizAnswersForDisplay(qa, quizQuestions)
                .map((r) => `${r.questionTitle} ${r.answerText}`)
                .join(' ')
            : Object.values(qa)
                .map((x) => String(x ?? ''))
                .join(' ')
          ).toLowerCase()
        : ''
    const matchSearch =
      (l.nome ?? '').toLowerCase().includes(search.toLowerCase()) ||
      String(l.whatsapp ?? '').includes(search) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      qaBlob.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const stats = {
    total: leads.length,
    novos: leads.filter((l) => l.status === 'novo').length,
    reuniao: leads.filter((l) => l.status === 'reuniao_agendada').length,
    clientes: leads.filter((l) => l.status === 'cliente').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter text-foreground">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-grotesk font-bold text-base text-foreground">
                CRM — Leads
              </h1>
              <p className="text-[10px] text-muted-foreground">Leads do Quiz</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/quiz"
              className="text-xs font-semibold text-orange-600 hover:underline whitespace-nowrap"
            >
              Abrir quiz
            </Link>
            {brand.logoUrl ? (
              <div className="hidden sm:flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brand.logoUrl}
                  alt="Logo"
                  className="w-auto object-contain"
                  style={{ maxHeight: brand.headerLogoH }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-5">
        {confirmDeleteId ? (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setConfirmDeleteId(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-orange-100 bg-white p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-slate-900">Excluir lead?</p>
              <p className="mt-1 text-xs text-slate-500">
                Esta ação não pode ser desfeita.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = confirmDeleteId
                    setConfirmDeleteId(null)
                    deleteMutation.mutate(id)
                  }}
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total, color: '#f97316' },
            { label: 'Novos', value: stats.novos, color: '#f97316' },
            { label: 'Reuniões', value: stats.reuniao, color: '#8b5cf6' },
            { label: 'Clientes', value: stats.clientes, color: '#22c55e' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm"
            >
              <div className="text-2xl font-grotesk font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, WhatsApp ou e-mail..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-orange-400 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-orange-400 transition-colors"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">Nenhum lead encontrado</p>
            <p className="text-xs mt-2">
              Conclua o quiz em{' '}
              <Link href="/dashboard/quiz" className="text-orange-600 font-medium underline">
                /dashboard/quiz
              </Link>{' '}
              para registrar o primeiro lead.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => {
              const statusInfo = STATUS_LABELS[lead.status] || STATUS_LABELS.novo
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    setSelectedLead(selectedLead?.id === lead.id ? null : lead)
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                      >
                        {lead.nome?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{lead.nome}</p>
                    <p className="text-xs text-muted-foreground">Lead do quiz</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                        style={{
                          color: statusInfo.color,
                          background: statusInfo.bg,
                          borderColor: statusInfo.border,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                      <ChevronDown
                        className="w-4 h-4 text-muted-foreground transition-transform"
                        style={{
                          transform:
                            selectedLead?.id === lead.id ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedLead?.id === lead.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDeleteId(lead.id)
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                              {deleteMutation.isPending ? 'Excluindo…' : 'Excluir lead'}
                            </button>
                          </div>
                          {lead.quiz_answers &&
                          typeof lead.quiz_answers === 'object' &&
                          Object.keys(lead.quiz_answers).length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground font-medium">
                                Respostas do quiz
                              </p>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {expandQuizAnswersForDisplay(lead.quiz_answers, quizQuestions).map(
                                  (row) => (
                                    <div
                                      key={row.field}
                                      className="bg-orange-50 rounded-xl p-2.5 text-left"
                                    >
                                      <p className="text-xs font-semibold text-foreground mb-0.5 leading-snug">
                                        {row.questionTitle}
                                      </p>
                                      <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                                        {row.answerText || '—'}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {[
                                { label: 'Perfil', value: PERFIL_LABELS[lead.perfil] || lead.perfil },
                                {
                                  label: 'Faturamento',
                                  value: FATURAMENTO_LABELS[lead.faturamento] || lead.faturamento,
                                },
                                {
                                  label: 'Objetivo',
                                  value: String(lead.objetivo ?? '').replace(/_/g, ' ') || undefined,
                                },
                                {
                                  label: 'Dificuldade',
                                  value:
                                    String(lead.dificuldade ?? '').replace(/_/g, ' ') || undefined,
                                },
                              ].map((item) => (
                                <div key={item.label} className="bg-orange-50 rounded-xl p-2">
                                  <p className="text-muted-foreground font-medium mb-0.5">
                                    {item.label}
                                  </p>
                                  <p className="text-foreground font-semibold capitalize">
                                    {item.value || '—'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1.5">
                              Alterar status:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <button
                                  type="button"
                                  key={k}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateMutation.mutate({ id: lead.id, data: { status: k } })
                                  }}
                                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                                  style={{
                                    color: v.color,
                                    background: lead.status === k ? v.bg : 'white',
                                    borderColor: lead.status === k ? v.border : '#e5e7eb',
                                    fontWeight: lead.status === k ? 700 : 500,
                                  }}
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            defaultValue={lead.notas || ''}
                            placeholder="Adicionar notas sobre este lead..."
                            onBlur={(e) => {
                              if (e.target.value !== (lead.notas || '')) {
                                updateMutation.mutate({
                                  id: lead.id,
                                  data: { notas: e.target.value },
                                })
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs resize-none outline-none focus:border-orange-400 transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
