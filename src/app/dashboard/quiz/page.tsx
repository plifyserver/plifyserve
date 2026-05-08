'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Copy, ExternalLink, Loader2, Plus, Settings2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { toast } from 'sonner'

type QuizRow = {
  id: string
  title: string
  slug: string
  is_published: boolean
  created_at: string
}

export default function QuizDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<QuizRow[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), [])

  const fetchQuizzes = async () => {
    const res = await fetch('/api/quizzes', { credentials: 'include' })
    if (!res.ok) throw new Error('Falha ao carregar quizzes')
    const data = (await res.json()) as QuizRow[]
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetchQuizzes()
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const copyPublicLink = async (slug: string) => {
    const url = `${origin}/q/${slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente: ' + url)
    }
  }

  const remove = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/quizzes/${deleteId}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) {
      toast.error('Não foi possível excluir o quiz.')
      return false
    }
    setItems((prev) => prev.filter((x) => x.id !== deleteId))
    toast.success('Quiz excluído.')
  }

  return (
    <div className={`space-y-6 ${SITE_CONTAINER_LG}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quiz</h1>
          <p className="text-slate-500">
            Crie um quiz para divulgar seu serviço e gerar um link para colocar na bio do Instagram.
          </p>
        </div>

        <Button asChild className="rounded-xl w-full sm:w-auto">
          <Link href="/dashboard/quiz/novo">
            <Plus className="w-4 h-4 mr-2" />
            Criar quiz
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : items.length === 0 ? (
        <div className={`${DASH_SURFACE_CARD} p-8 text-center`}>
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Nenhum quiz ainda</h2>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Crie seu primeiro quiz, personalize com sua logo e defina perguntas (seleção, texto curto, texto longo etc.).
          </p>
          <Button asChild className="rounded-xl">
            <Link href="/dashboard/quiz/novo">Criar agora</Link>
          </Button>
        </div>
      ) : (
        <Card className={`${DASH_SURFACE_CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-sm font-medium text-slate-600">Nome</th>
                  <th className="text-left px-5 py-3.5 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-5 py-3.5 text-sm font-medium text-slate-600">Link</th>
                  <th className="w-10 px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {items.map((q) => (
                  <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{q.title}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                          q.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {q.is_published ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate max-w-[320px]">{origin ? `${origin}/q/${q.slug}` : `/q/${q.slug}`}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          onClick={() => copyPublicLink(q.slug)}
                          title="Copiar link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          title="Abrir"
                        >
                          <a href={`/q/${q.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline" className="rounded-lg" title="Editar">
                          <Link href={`/dashboard/quiz/${q.id}/editar`}>
                            <Settings2 className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                          title="Excluir"
                          onClick={() => setDeleteId(q.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir quiz?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={remove}
      />
    </div>
  )
}

