'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  ReactFlowProvider,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Save, Loader2, FileDown, Trash2, Palette, Type } from 'lucide-react'

const NODE_COLORS = ['#568203', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#22c55e']
const TEXT_COLORS = ['#ffffff', '#000000', '#568203', '#3b82f6', '#f59e0b', '#ef4444']

type NodeData = {
  label: string
  backgroundColor?: string
  color?: string
  fontWeight?: string
  fontSize?: number
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  fontFamily?: string
  width?: number
  height?: number
}

const FONT_FAMILIES = [
  { value: 'Inter, system-ui, sans-serif', label: 'Padrão' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Courier New', monospace", label: 'Monospace' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: 'Tahoma, sans-serif', label: 'Tahoma' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
  { value: "'Comic Sans MS', cursive", label: 'Comic Sans' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: "'Lucida Sans', sans-serif", label: 'Lucida Sans' },
  { value: "'Palatino Linotype', serif", label: 'Palatino' },
]

function CustomNode({ data, id }: NodeProps<NodeData>) {
  const { setNodes } = useReactFlow()
  const startRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const bg = data.backgroundColor ?? '#1f2937'
  const textColor = data.color ?? '#ffffff'
  const bold = data.fontWeight === 'bold'
  const size = data.fontSize ?? 14
  const italic = data.fontStyle === 'italic'
  const decoration = data.textDecoration ?? 'none'
  const align = data.textAlign ?? 'left'
  const fontFamily = data.fontFamily ?? 'Inter, system-ui, sans-serif'
  const w = data.width ?? 160
  const h = data.height ?? 44

  const startResize = useCallback(
    (clientX: number, clientY: number) => {
      startRef.current = { x: clientX, y: clientY, w, h }
      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!startRef.current) return
        if ('touches' in ev) ev.preventDefault()
        const x = 'touches' in ev ? ev.touches[0]?.clientX ?? ev.changedTouches?.[0]?.clientX : ev.clientX
        const y = 'touches' in ev ? ev.touches[0]?.clientY ?? ev.changedTouches?.[0]?.clientY : ev.clientY
        if (x == null || y == null) return
        const dx = x - startRef.current.x
        const dy = y - startRef.current.y
        const newW = Math.max(20, Math.min(500, startRef.current.w + dx))
        const newH = Math.max(20, Math.min(200, startRef.current.h + dy))
        setNodes((nds) =>
          nds.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, width: newW, height: newH } } : n
          )
        )
      }
      const onUp = () => {
        startRef.current = null
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('touchmove', onMove, { passive: false })
        window.removeEventListener('touchend', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchmove', onMove, { passive: false })
      window.addEventListener('touchend', onUp)
    },
    [id, w, h, setNodes]
  )

  const onResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      startResize(e.clientX, e.clientY)
    },
    [startResize]
  )

  const onResizeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      const t = e.touches[0]
      if (t) startResize(t.clientX, t.clientY)
    },
    [startResize]
  )

  return (
    <div
      className="rounded-lg px-4 py-2 relative"
      style={{
        backgroundColor: bg,
        color: textColor,
        fontWeight: bold ? 'bold' : 'normal',
        fontSize: size,
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: decoration,
        textAlign: align as 'left' | 'center' | 'right',
        fontFamily,
        width: w,
        minHeight: h,
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-avocado !border-2 !border-gray-300" />
      {data.label}
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-avocado !border-2 !border-gray-300" />
      <div
        className="nodrag nopan absolute bottom-0 right-0 w-2 h-2 rounded-br rounded-tl bg-gray-400/60 hover:bg-gray-500/80 cursor-se-resize flex items-center justify-center"
        onMouseDown={onResizeMouseDown}
        onTouchStart={onResizeTouchStart}
        title="Arraste para redimensionar"
      >
        <svg width="3" height="3" viewBox="0 0 12 12" fill="currentColor" className="text-gray-500 shrink-0">
          <path d="M12 12H6L12 6v6z" />
        </svg>
      </div>
    </div>
  )
}

const nodeTypes = { custom: CustomNode }

const defaultNodeStyle = {
  backgroundColor: '#1f2937',
  color: '#ffffff',
  fontWeight: 'normal',
  fontSize: 14,
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  fontFamily: 'Inter, system-ui, sans-serif',
  width: 160,
  height: 44,
}

function toStyledNode(n: Node): Node<NodeData> {
  const d = (n.data ?? {}) as NodeData
  return {
    ...n,
    type: 'custom',
    data: {
      label: d?.label ?? 'Nó',
      backgroundColor: d?.backgroundColor ?? defaultNodeStyle.backgroundColor,
      color: d?.color ?? defaultNodeStyle.color,
      fontWeight: d?.fontWeight ?? defaultNodeStyle.fontWeight,
      fontSize: d?.fontSize ?? defaultNodeStyle.fontSize,
      fontStyle: d?.fontStyle ?? defaultNodeStyle.fontStyle,
      textDecoration: d?.textDecoration ?? defaultNodeStyle.textDecoration,
      textAlign: d?.textAlign ?? defaultNodeStyle.textAlign,
      fontFamily: d?.fontFamily ?? defaultNodeStyle.fontFamily,
      width: d?.width ?? defaultNodeStyle.width,
      height: d?.height ?? defaultNodeStyle.height,
    },
  }
}

const initialNodes: Node[] = [
  { id: 'root', type: 'default', position: { x: 250, y: 50 }, data: { label: 'Clique 2x para editar' }, draggable: true },
].map(toStyledNode)

const initialEdges: Edge[] = []

function EditNodeModal({
  node,
  nodes,
  onClose,
  onSave,
  onDelete,
  onConnectTo,
}: {
  node: Node
  nodes: Node[]
  onClose: () => void
  onSave: (data: NodeData) => void
  onDelete: () => void
  onConnectTo: (targetId: string) => void
}) {
  const d = (node.data ?? {}) as NodeData
  const [label, setLabel] = useState(d.label ?? '')
  const [backgroundColor, setBackgroundColor] = useState(d.backgroundColor ?? '#1f2937')
  const [color, setColor] = useState(d.color ?? '#ffffff')
  const [fontWeight, setFontWeight] = useState(d.fontWeight ?? 'normal')
  const [fontSize, setFontSize] = useState(d.fontSize ?? 14)
  const [fontStyle, setFontStyle] = useState(d.fontStyle ?? 'normal')
  const [textDecoration, setTextDecoration] = useState(d.textDecoration ?? 'none')
  const [textAlign, setTextAlign] = useState(d.textAlign ?? 'left')
  const [fontFamily, setFontFamily] = useState(d.fontFamily ?? 'Inter, system-ui, sans-serif')
  const otherNodes = nodes.filter((n) => n.id !== node.id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm max-h-[90vh] flex flex-col rounded-xl bg-white border border-gray-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Type className="w-4 h-4 text-avocado" /> Editar nó
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-4 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Texto</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Conteúdo do nó"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-300 focus:border-avocado outline-none text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-500 w-full">Formatação</span>
            <button
              type="button"
              onClick={() => setFontWeight((w) => (w === 'bold' ? 'normal' : 'bold'))}
              className={`px-2 py-1 rounded border text-xs transition-colors ${
                fontWeight === 'bold' ? 'bg-avocado text-white border-avocado' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              Negrito
            </button>
            <button
              type="button"
              onClick={() => setFontStyle((s) => (s === 'italic' ? 'normal' : 'italic'))}
              className={`px-2 py-1 rounded border text-xs italic transition-colors ${
                fontStyle === 'italic' ? 'bg-avocado text-white border-avocado' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              Itálico
            </button>
            <button
              type="button"
              onClick={() => setTextDecoration((d) => (d === 'underline' ? 'none' : 'underline'))}
              className={`px-2 py-1 rounded border text-xs transition-colors ${
                textDecoration === 'underline' ? 'bg-avocado text-white border-avocado' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
              style={{ textDecoration: 'underline' }}
            >
              Sublinhado
            </button>
            <button
              type="button"
              onClick={() => setTextDecoration((d) => (d === 'line-through' ? 'none' : 'line-through'))}
              className={`px-2 py-1 rounded border text-xs transition-colors ${
                textDecoration === 'line-through' ? 'bg-avocado text-white border-avocado' : 'bg-gray-100 border-gray-300 text-gray-700'
              }`}
              style={{ textDecoration: 'line-through' }}
            >
              Tachado
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Alinhamento</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setTextAlign(a)}
                  className={`flex-1 px-2 py-1.5 rounded border text-xs transition-colors ${
                    textAlign === a ? 'bg-avocado text-white border-avocado' : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}
                >
                  {a === 'left' ? 'Esquerda' : a === 'center' ? 'Centro' : 'Direita'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fonte</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-gray-50 border border-gray-300 focus:border-avocado outline-none text-sm"
              >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tamanho</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded bg-gray-50 border border-gray-300 focus:border-avocado outline-none text-sm"
              >
                {[10, 12, 14, 16, 18, 20, 24].map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
          </div>

          {otherNodes.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Conectar a</label>
              <div className="flex flex-wrap gap-1">
                {otherNodes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onConnectTo(n.id)}
                    className="px-2 py-1 rounded bg-gray-100 border border-gray-300 text-gray-700 hover:bg-avocado/20 hover:border-avocado/50 hover:text-avocado text-xs"
                  >
                    {String((n.data as NodeData)?.label ?? n.id).slice(0, 15)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Palette className="w-3 h-3" /> Cor do texto
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    color === c ? 'border-avocado scale-110' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Cor de fundo</label>
            <div className="flex flex-wrap gap-1.5">
              {NODE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBackgroundColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    backgroundColor === c ? 'border-avocado scale-110' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-sm"
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave({
              label: label || 'Nó',
              backgroundColor,
              color,
              fontWeight,
              fontSize,
              fontStyle,
              textDecoration,
              textAlign,
              fontFamily,
              width: (node.data as NodeData)?.width,
              height: (node.data as NodeData)?.height,
            })}
            className="px-4 py-2 rounded-lg bg-avocado text-white font-medium hover:bg-avocado-light text-sm"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-xl bg-white border border-gray-200 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

function MindMapEditor() {
  const { user } = useAuth()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentMapId, setCurrentMapId] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Node | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return
    setEdges((eds) => [
      ...eds,
      {
        id: `e-${params.source}-${params.target}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
      },
    ])
    showToast('Nós conectados')
  }, [setEdges])

  const handleConnectTo = useCallback((targetId: string) => {
    if (!editingNode) return
    setEdges((eds) => [
      ...eds,
      {
        id: `e-${editingNode.id}-${targetId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        source: editingNode.id,
        target: targetId,
      },
    ])
    showToast('Nós conectados')
  }, [editingNode, setEdges])

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    setEditingNode({
      ...node,
      type: 'custom',
      data: { ...defaultNodeStyle, ...(node.data ?? {}) },
    })
  }, [])

  const handleSaveNode = useCallback(
    (data: NodeData) => {
      if (!editingNode) return
      setNodes((nds) =>
        nds.map((n) =>
          n.id === editingNode.id ? { ...n, data: { ...n.data, ...data } } : n
        )
      )
      setEditingNode(null)
      showToast('Nó atualizado')
    },
    [editingNode, setNodes]
  )

  const handleDeleteNode = useCallback(() => {
    if (!editingNode) return
    setNodes((nds) => nds.filter((n) => n.id !== editingNode.id))
    setEdges((eds) => eds.filter((e) => e.source !== editingNode.id && e.target !== editingNode.id))
    setEditingNode(null)
    showToast('Nó excluído')
  }, [editingNode, setNodes, setEdges])

  const addNode = useCallback(() => {
    const lastNode = nodes[nodes.length - 1]
    const newPos = lastNode
      ? { x: lastNode.position.x + 80, y: lastNode.position.y + 60 }
      : { x: 250, y: 150 }
    const id = `node-${Date.now()}`
    const newNode: Node = toStyledNode({
      id,
      type: 'custom',
      position: newPos,
      data: { label: 'Novo nó', ...defaultNodeStyle },
      draggable: true,
    })
    setNodes((nds) => [...nds, newNode])
    showToast('Nó adicionado')
  }, [nodes, setNodes])

  const loadMap = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!error && data) {
        setCurrentMapId(data.id)
        const loadedNodes = (data.nodes as Node[])?.length ? (data.nodes as Node[]).map(toStyledNode) : initialNodes
        setNodes(loadedNodes)
        setEdges((data.edges as Edge[]) ?? [])
      }
    } catch {
      // ok
    }
  }, [user, supabase, setNodes, setEdges])

  const saveMap = useCallback(async () => {
    if (!user) return
    setSaving(true)
    try {
      if (currentMapId) {
        await supabase.from('mind_maps').update({ nodes, edges, updated_at: new Date().toISOString() }).eq('id', currentMapId)
        showToast('Mapa salvo')
      } else {
        const { data } = await supabase.from('mind_maps').insert({ user_id: user.id, name: 'Mapa principal', nodes, edges }).select('id').single()
        if (data) {
          setCurrentMapId(data.id)
          showToast('Mapa salvo')
        }
      }
    } catch {
      showToast('Erro ao salvar. Rode a migration 002 no Supabase.')
    }
    setSaving(false)
  }, [user, currentMapId, nodes, edges, supabase])

  const exportPdf = useCallback(async () => {
    if (!containerRef.current) return
    const reactFlowEl = containerRef.current.querySelector('.react-flow') as HTMLElement | null
    const viewportEl = containerRef.current.querySelector('.react-flow__viewport') as HTMLElement | null
    const el = viewportEl ?? reactFlowEl
    if (!el) {
      showToast('Elemento não encontrado para exportar')
      return
    }
    try {
      showToast('Gerando PDF...')
      const jspdfMod = await import('jspdf')
      let imgData: string

      try {
        const html2canvas = (await import('html2canvas')).default
        const canvas = await html2canvas(el, {
          backgroundColor: '#f9fafb',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        })
        imgData = canvas.toDataURL('image/png')
      } catch {
        const htmlToImageMod = await import('html-to-image')
        imgData = await htmlToImageMod.toPng(el, {
          backgroundColor: '#f9fafb',
          pixelRatio: 2,
          cacheBust: true,
          skipFonts: true,
        })
      }

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Falha ao carregar imagem'))
        img.src = imgData
      })

      const pdf = new jspdfMod.default({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const ratio = Math.min(pw / img.width, ph / img.height) * 0.95
      const w = img.width * ratio
      const h = img.height * ratio
      pdf.addImage(imgData, 'PNG', (pw - w) / 2, (ph - h) / 2, w, h)
      pdf.save('mapa-mental.pdf')
      showToast('PDF exportado')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao exportar PDF'
      console.error('Erro ao exportar PDF:', err)
      showToast(msg)
    }
  }, [])

  useEffect(() => {
    if (user) loadMap()
  }, [user, loadMap])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-avocado" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-[calc(100vh-8rem)] rounded-xl border border-gray-200 bg-gray-50 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        edgeClassName="!stroke-[#568203]"
      >
        <Background color="#d1d5db" gap={16} />
        <Controls className="!bg-white !border-gray-200 !rounded-lg [&>button]:!bg-gray-100 [&>button]:!text-gray-700 [&>button:hover]:!bg-gray-200" />
        <MiniMap nodeColor="#568203" maskColor="rgba(255,255,255,0.9)" className="!bg-white !border !border-gray-300 !rounded-lg" />
        <Panel position="top-left" className="flex flex-wrap gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-avocado text-white font-medium hover:bg-avocado-light transition-colors"
          >
            <Plus className="w-4 h-4" /> Adicionar nó
          </button>
          <button
            onClick={saveMap}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors"
          >
            <FileDown className="w-4 h-4" /> Exportar PDF
          </button>
        </Panel>
      </ReactFlow>

      {editingNode && (
        <EditNodeModal
          node={editingNode}
          nodes={nodes}
          onClose={() => setEditingNode(null)}
          onSave={handleSaveNode}
          onDelete={() => {
            setConfirmDelete(editingNode)
            setEditingNode(null)
          }}
          onConnectTo={handleConnectTo}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          message="Excluir este nó e suas conexões?"
          onConfirm={() => {
            setNodes((nds) => nds.filter((n) => n.id !== confirmDelete.id))
            setEdges((eds) => eds.filter((e) => e.source !== confirmDelete.id && e.target !== confirmDelete.id))
            setConfirmDelete(null)
            showToast('Nó excluído')
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-lg bg-white border border-gray-200 text-avocado shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

export default function MapaMentalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Mapa Mental</h1>
      <p className="text-gray-500 mb-6">
        Duplo clique = editar. Clique e arraste = mover. Arraste o cantinho verde = redimensionar. Pontos verdes = ligar nós.
      </p>
      <ReactFlowProvider>
        <MindMapEditor />
      </ReactFlowProvider>
    </div>
  )
}
