'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  Search, Trash2, RefreshCw, ChevronLeft, ChevronRight, 
  Loader2, FileText, User, Calendar, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface Template {
  id: string
  user_id: string
  title: string
  description: string | null
  is_public: boolean
  created_at: string
  user?: {
    email: string | null
    full_name: string | null
  }
}

const ITEMS_PER_PAGE = 20

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    
    let query = supabase
      .from('templates')
      .select(`
        *,
        user:profiles!templates_user_id_fkey(email, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data, count, error } = await query

    if (!error && data) {
      setTemplates(data as Template[])
      setTotalCount(count || 0)
    }
    setLoading(false)
  }, [page, search, supabase])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleDelete = async () => {
    if (!deleteTemplate) return
    setDeleting(true)

    try {
      await supabase
        .from('template_images')
        .delete()
        .eq('template_id', deleteTemplate.id)

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', deleteTemplate.id)

      if (!error) {
        await fetchTemplates()
        setDeleteTemplate(null)
      }
    } catch {
      alert('Erro ao excluir template')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Templates</h1>
          <p className="text-slate-400">{totalCount} templates no total</p>
        </div>
        <Button onClick={fetchTemplates} variant="outline" className="gap-2 bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Buscar por título..."
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          Nenhum template encontrado
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                <FileText className="w-12 h-12 text-slate-500" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-1 truncate">{template.title}</h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {template.description || 'Sem descrição'}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                  <User className="w-3 h-3" />
                  <span className="truncate">{template.user?.full_name || template.user?.email || 'Desconhecido'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(template.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    onClick={() => window.open(`/dashboard/templates/${template.id}/editar`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTemplate(template)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
          <p className="text-sm text-slate-400">
            Página {page + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Dialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Excluir Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-300">
              Tem certeza que deseja excluir o template <strong>{deleteTemplate?.title}</strong>?
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Esta ação não pode ser desfeita e todas as imagens associadas serão removidas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTemplate(null)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleting} variant="destructive">
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
