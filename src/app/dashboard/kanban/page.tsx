'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { GripVertical, Users, Settings } from 'lucide-react'
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

interface KanbanStage {
  id: string
  name: string
  color: string
  order: number
}

interface Client {
  id: string
  name: string
  email: string | null
  kanban_stage: string
  status: string
}

export default function KanbanPage() {
  const [stages, setStages] = useState<KanbanStage[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [editingStage, setEditingStage] = useState<KanbanStage | null>(null)
  const [stageForm, setStageForm] = useState({ name: '', color: '#3B82F6' })

  const fetchData = async () => {
    const [sRes, cRes] = await Promise.all([
      fetch('/api/kanban/stages', { credentials: 'include' }),
      fetch('/api/clients', { credentials: 'include' }),
    ])
    if (sRes.ok) setStages((await sRes.json()).sort((a: KanbanStage, b: KanbanStage) => (a.order ?? 0) - (b.order ?? 0)))
    if (cRes.ok) setClients(await cRes.json())
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [])

  const getClientsByStage = (stageName: string) =>
    clients.filter((c) => (c.kanban_stage || 'lead') === stageName)

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const clientId = result.draggableId.replace('client-', '')
    const newStage = result.destination.droppableId
    const client = clients.find((c) => c.id === clientId)
    if (!client || client.kanban_stage === newStage) return
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...client, kanban_stage: newStage }),
    })
    if (res.ok) setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, kanban_stage: newStage } : c)));
  }

  const openStageDialog = (stage: KanbanStage | null) => {
    setEditingStage(stage)
    setStageForm(stage ? { name: stage.name, color: stage.color || '#3B82F6' } : { name: '', color: '#3B82F6' })
    setStageDialogOpen(true)
  }

  const saveStage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingStage) {
      const res = await fetch(`/api/kanban/stages/${editingStage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: stageForm.name, color: stageForm.color }),
      })
      if (res.ok) {
        await fetchData()
        setStageDialogOpen(false)
      }
    } else {
      const res = await fetch('/api/kanban/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: stageForm.name,
          color: stageForm.color,
          order: stages.length,
        }),
      })
      if (res.ok) {
        await fetchData()
        setStageDialogOpen(false)
      }
    }
  }

  const deleteStage = async (id: string) => {
    if (!confirm('Excluir esta etapa? Os clientes não serão removidos.')) return
    const res = await fetch(`/api/kanban/stages/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) await fetchData()
  }

  const defaultStages = [{ name: 'lead', color: '#94A3B8' }, { name: 'qualificado', color: '#3B82F6' }, { name: 'proposta', color: '#F59E0B' }, { name: 'fechado', color: '#10B981' }]
  const displayStages = stages.length > 0 ? stages : defaultStages.map((s, i) => ({ id: s.name, name: s.name, color: s.color, order: i }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kanban</h1>
          <p className="text-slate-500">Visualize e gerencie o fluxo dos seus clientes.</p>
        </div>
        <Button onClick={() => openStageDialog(null)} variant="outline" className="rounded-xl">
          <Settings className="w-4 h-4 mr-2" />
          Etapas
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Carregando...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {displayStages.map((stage) => {
              const stageClients = getClientsByStage(stage.name)
              return (
                <Droppable key={stage.name} droppableId={stage.name}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-shrink-0 w-72 rounded-2xl border-0 shadow-sm bg-slate-50 overflow-hidden flex flex-col"
                    >
                      <div
                        className="p-4 flex items-center justify-between"
                        style={{ backgroundColor: `${stage.color}20`, borderBottom: `3px solid ${stage.color}` }}
                      >
                        <span className="font-semibold text-slate-900 capitalize">{stage.name}</span>
                        <div className="flex items-center gap-2">
                          {stages.length > 0 && stages.some((s) => s.id === stage.id) && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStageDialog(stage)}>
                              <Settings className="w-3 h-3" />
                            </Button>
                          )}
                          <span className="text-sm text-slate-500">{stageClients.length}</span>
                        </div>
                      </div>
                      <div className="p-3 flex-1 min-h-[200px]">
                        {stageClients.map((client, index) => (
                          <Draggable key={client.id} draggableId={`client-${client.id}`} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="flex items-center gap-2 p-3 mb-2 bg-white rounded-xl shadow-sm border border-slate-100"
                              >
                                <GripVertical className="w-4 h-4 text-slate-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{client.name}</p>
                                  {client.email && (
                                    <p className="text-xs text-slate-500 truncate">{client.email}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
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
                placeholder="Ex: Proposta enviada"
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
                  onClick={() => deleteStage(editingStage.id)}
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
    </div>
  )
}
