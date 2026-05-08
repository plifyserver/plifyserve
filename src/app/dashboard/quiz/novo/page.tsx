'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { DASH_SURFACE_CARD, SITE_CONTAINER_LG } from '@/lib/siteLayout'
import { generateQuizSlug } from '@/lib/generateQuizSlug'
import { toast } from 'sonner'

export default function NovoQuizPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const suggestedSlug = useMemo(() => generateQuizSlug(title || 'quiz'), [title])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível criar o quiz.')
      if (!data.id) throw new Error('Resposta inválida do servidor.')

      toast.success('Quiz criado. Agora vamos adicionar perguntas.')
      router.push(`/dashboard/quiz/${data.id}/editar`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar quiz')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={`space-y-6 ${SITE_CONTAINER_LG}`}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo quiz</h1>
        <p className="text-slate-500">Defina o nome e o link do seu quiz.</p>
      </div>

      <Card className={`${DASH_SURFACE_CARD} p-6`}>
        <form onSubmit={create} className="space-y-4">
          <div>
            <Label htmlFor="title">Nome do quiz *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Qual serviço é ideal para você?"
              className="rounded-xl mt-1 bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 dark:bg-white dark:text-slate-900 dark:border-slate-200 dark:caret-slate-900"
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug (link) (opcional)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={suggestedSlug}
              className="rounded-xl mt-1 bg-white text-slate-900 border-slate-200 placeholder:text-slate-400 dark:bg-white dark:text-slate-900 dark:border-slate-200 dark:caret-slate-900"
            />
            <p className="mt-2 text-xs text-slate-500">
              Se deixar em branco, a Plify gera automaticamente. Você pode mudar depois.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" className="rounded-xl" disabled={creating || !title.trim()}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Criar e editar
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/dashboard/quiz')}>
              Voltar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

