'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Settings, Plus, ArrowLeft, LayoutGrid, Pencil, Trash2 } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

const MAX_BOARDS = 5
const MAX_STAGES = 15

interface KanbanBoard {
  id: string
  name: string
  order: number
  created_at: string
}

interface KanbanStage {
  id: string
  name: string
  color: string
  order: number
  board_id: string | null
}

interface KanbanCard {
  id: string
  board_id: string
  stage_id: string
  title: string
  description: string | null
  order: number
}

export default function KanbanPage() {
  const [boards, setBoards] = useState<KanbanBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null)
  const [stages, setStages] = useState<KanbanStage[]>([])
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [loading, setLoading] = useState(true)
  const [boardDialogOpen, setBoardDialogOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null)
  const [boardFormName, setBoardFormName] = useState('')
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<KanbanStage | null>(null)
  const [stageForm, setStageForm] = useState({ name: '', color: '#3B82F6' })
  const [stageToDeleteId, setStageToDeleteId] = useState<string | null>(null)
  const [newCardStageId, setNewCardStageId] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [cardToDeleteId, setCardToDeleteId] = useState<string | null>(null)

  const fetchBoards = async () => {
    const res = await fetch('/api/kanban/boards', { credentials: 'include' })
    if (res.ok) setBoards(await res.json())
  }

  const fetchStagesAndCards = async (boardId: string) => {
    const [sRes, cRes] = await Promise.all([
      fetch(`/api/kanban/stages?board_id=${boardId}`, { credentials: 'include' }),
      fetch(`/api/kanban/cards?board_id=${boardId}`, { credentials: 'include' }),
    ])
    if (sRes.ok) setStages((await sRes.json()).sort((a: KanbanStage, b: KanbanStage) => (a.order ?? 0) - (b.order ?? 0)))
    if (cRes.ok) setCards(await cRes.json())
  }

  useEffect(() => {
    fetchBoards().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedBoard) fetchStagesAndCards(selectedBoard.id)
  }, [selectedBoard?.id])

  const openBoardDialog = (board: KanbanBoard | null) => {
    setEditingBoard(board)
    setBoardFormName(board?.name ?? '')
    setBoardDialogOpen(true)
  }

  const saveBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = boardFormName.trim() || 'Novo Kanban'
    if (editingBoard) {
      const res = await fetch(`/api/kanban/boards/${editingBoard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await fetchBoards()
        if (selectedBoard?.id === editingBoard.id) setSelectedBoard((prev) => (prev ? { ...prev, name } : null))
        setBoardDialogOpen(false)
        toast.success('Kanban atualizado.')
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Erro ao salvar')
      }
    } else {
      if (boards.length >= MAX_BOARDS) {
        toast.error(`Você pode criar no máximo ${MAX_BOARDS} Kanbans.`)
        return
      }
      const res = await fetch('/api/kanban/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await fetchBoards()
        setBoardDialogOpen(false)
        toast.success('Kanban criado.')
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Erro ao criar')
      }
    }
  }

  const deleteBoard = async (id: string) => {
    const res = await fetch(`/api/kanban/boards/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      await fetchBoards()
      if (selectedBoard?.id === id) setSelectedBoard(null)
      toast.success('Kanban excluído.')
    }
  }

  const openStageDialog = (stage: KanbanStage | null) => {
    setEditingStage(stage)
    setStageForm(stage ? { name: stage.name, color: stage.color || '#3B82F6' } : { name: '', color: '#3B82F6' })
    setStageDialogOpen(true)
  }

  const saveStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard) return
    if (editingStage) {
      const res = await fetch(`/api/kanban/stages/${editingStage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: stageForm.name, color: stageForm.color }),
      })
      if (res.ok) {
        await fetchStagesAndCards(selectedBoard.id)
        setStageDialogOpen(false)
        toast.success('Etapa atualizada.')
      }
    } else {
      if (stages.length >= MAX_STAGES) {
        toast.error(`Cada Kanban pode ter no máximo ${MAX_STAGES} etapas.`)
        return
      }
      const res = await fetch('/api/kanban/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          board_id: selectedBoard.id,
          name: stageForm.name,
          color: stageForm.color,
          order: stages.length,
        }),
      })
      if (res.ok) {
        await fetchStagesAndCards(selectedBoard.id)
        setStageDialogOpen(false)
        toast.success('Etapa criada.')
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Erro ao criar etapa')
      }
    }
  }

  const confirmDeleteStage = async () => {
    if (!stageToDeleteId) return
    const res = await fetch(`/api/kanban/stages/${stageToDeleteId}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      await fetchStagesAndCards(selectedBoard!.id)
      toast.success('Etapa excluída.')
      setStageToDeleteId(null)
      setStageDialogOpen(false)
    } else {
      toast.error('Não foi possível excluir.')
      return false
    }
  }

  const addCard = async (stageId: string) => {
    const title = newCardTitle.trim()
    if (!title || !selectedBoard) return
    const res = await fetch('/api/kanban/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ board_id: selectedBoard.id, stage_id: stageId, title }),
    })
    if (res.ok) {
      await fetchStagesAndCards(selectedBoard.id)
      setNewCardTitle('')
      setNewCardStageId(null)
      toast.success('Card adicionado.')
    }
  }

  const confirmDeleteCard = async () => {
    if (!cardToDeleteId || !selectedBoard) return
    const res = await fetch(`/api/kanban/cards/${cardToDeleteId}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== cardToDeleteId))
      setCardToDeleteId(null)
      toast.success('Card excluído.')
    } else return false
  }

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !selectedBoard) return
    const cardId = result.draggableId.replace('card-', '')
    const newStageId = result.destination.droppableId.replace('stage-', '')
    const card = cards.find((c) => c.id === cardId)
    if (!card || card.stage_id === newStageId) return
    const res = await fetch(`/api/kanban/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...card, stage_id: newStageId }),
    })
    if (res.ok) setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, stage_id: newStageId } : c)))
  }

  const displayStages = stages

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-indigo-600" />
      </div>
    )
  }

  // Dentro de um board: etapas + cards
  if (selectedBoard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setSelectedBoard(null)}
              title="Voltar aos Kanbans"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900 truncate">{selectedBoard.name}</h1>
          </div>
          <Button
            onClick={() => openStageDialog(null)}
            variant="outline"
            className="rounded-xl gap-2"
            disabled={stages.length >= MAX_STAGES}
          >
            <Plus className="w-4 h-4" />
            Nova etapa
            {stages.length >= MAX_STAGES && <span className="text-xs">(máx. {MAX_STAGES})</span>}
          </Button>
        </div>

        {stages.length === 0 ? (
          <Card className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-4">Crie a primeira etapa para começar a adicionar cards e arrastar entre as colunas.</p>
            <Button onClick={() => openStageDialog(null)} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" />
              Nova etapa
            </Button>
          </Card>
        ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
            {displayStages.map((stage) => {
              const stageCards = cards.filter((c) => c.stage_id === stage.id).sort((a, b) => a.order - b.order)
              return (
                <Droppable key={stage.id} droppableId={`stage-${stage.id}`}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-shrink-0 w-72 rounded-2xl border border-slate-200 shadow-sm bg-slate-50 overflow-hidden flex flex-col"
                    >
                      <div
                        className="p-4 flex items-center justify-between"
                        style={{
                          backgroundColor: `${stage.color}20`,
                          borderBottom: `3px solid ${stage.color}`,
                        }}
                      >
                        <span className="font-semibold text-slate-900 capitalize truncate">{stage.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openStageDialog(stage)}
                              title="Editar etapa"
                            >
                              <Settings className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                          <span className="text-sm text-slate-500 tabular-nums">{stageCards.length}</span>
                        </div>
                      </div>
                      <div className="p-3 flex-1 min-h-[120px] space-y-2">
                        {stageCards.map((card, index) => (
                          <Draggable key={card.id} draggableId={`card-${card.id}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center gap-2 p-3 bg-white rounded-xl shadow-sm border border-slate-100 group"
                              >
                                <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{card.title}</p>
                                  {card.description && (
                                    <p className="text-xs text-slate-500 truncate mt-0.5">{card.description}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                                  onClick={() => setCardToDeleteId(card.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {newCardStageId === stage.id ? (
                          <div className="p-2 bg-white rounded-xl border border-slate-200">
                            <Input
                              placeholder="Digite o título e Enter"
                              value={newCardTitle}
                              onChange={(e) => setNewCardTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') addCard(stage.id)
                                if (e.key === 'Escape') setNewCardStageId(null)
                              }}
                              className="rounded-lg text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" className="rounded-lg" onClick={() => addCard(stage.id)}>
                                Adicionar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setNewCardStageId(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setNewCardStageId(stage.id)}
                            className="w-full p-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 text-sm font-medium transition-colors"
                          >
                            + Adicionar card
                          </button>
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
        )}

        <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingStage ? 'Editar etapa' : 'Nova etapa'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={saveStage} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={stageForm.name}
                  onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                  placeholder="Ex: Em análise"
                  required
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={stageForm.color}
                    onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                    className="w-12 h-10 rounded-lg cursor-pointer"
                  />
                  <Input
                    value={stageForm.color}
                    onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })}
                    className="rounded-xl flex-1"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setStageDialogOpen(false)} className="rounded-xl">
                  Cancelar
                </Button>
                {editingStage && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setStageToDeleteId(editingStage.id)
                    }}
                    className="rounded-xl"
                  >
                    Excluir
                  </Button>
                )}
                <Button type="submit" className="rounded-xl">
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!stageToDeleteId}
          onOpenChange={(open) => !open && setStageToDeleteId(null)}
          title="Excluir etapa?"
          description="Os cards desta etapa serão excluídos. Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={confirmDeleteStage}
        />

        <ConfirmDialog
          open={!!cardToDeleteId}
          onOpenChange={(open) => !open && setCardToDeleteId(null)}
          title="Excluir card?"
          description="Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={confirmDeleteCard}
        />
      </div>
    )
  }

  // Lista de boards: até 5, duplo-clique para abrir
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban</h1>
          <p className="text-slate-500">Crie seus Kanbans e organize tarefas em etapas. Duplo-clique para abrir.</p>
        </div>
        <Button
          onClick={() => openBoardDialog(null)}
          variant="outline"
          className="rounded-xl gap-2"
          disabled={boards.length >= MAX_BOARDS}
        >
          <Plus className="w-4 h-4" />
          Novo Kanban
          {boards.length >= MAX_BOARDS && ` (máx. ${MAX_BOARDS})`}
        </Button>
      </div>

      {boards.length === 0 ? (
        <Card className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <LayoutGrid className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Nenhum Kanban ainda</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Crie seu primeiro Kanban (você pode ter até {MAX_BOARDS}). Depois, dê dois cliques para abrir e criar etapas e cards.
          </p>
          <Button onClick={() => openBoardDialog(null)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" />
            Criar primeiro Kanban
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
              onDoubleClick={() => setSelectedBoard(board)}
            >
              <div className="p-6 flex flex-col h-full min-h-[140px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{board.name}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Duplo-clique para abrir</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        openBoardDialog(board)
                      }}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Excluir este Kanban? Os dados não poderão ser recuperados.')) deleteBoard(board.id)
                      }}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <LayoutGrid className="w-10 h-10 text-slate-200 mt-auto pt-4" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={boardDialogOpen} onOpenChange={setBoardDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingBoard ? 'Editar Kanban' : 'Novo Kanban'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveBoard} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={boardFormName}
                onChange={(e) => setBoardFormName(e.target.value)}
                placeholder="Ex: Vendas 2025"
                required
                className="rounded-xl mt-1"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setBoardDialogOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl">
                {editingBoard ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
