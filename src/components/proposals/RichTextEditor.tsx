'use client'

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

function ToolButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void
  active?: boolean
  children: ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-2 rounded-lg transition-colors',
        active ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      )}
    >
      {children}
    </button>
  )
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  minHeight?: string
  className?: string
}

type FontSize = 'small' | 'normal' | 'large' | 'xlarge'

const fontSizes: { value: FontSize; label: string; size: string }[] = [
  { value: 'small', label: 'Pequeno', size: '14px' },
  { value: 'normal', label: 'Normal', size: '16px' },
  { value: 'large', label: 'Grande', size: '20px' },
  { value: 'xlarge', label: 'Extra Grande', size: '24px' },
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  label,
  minHeight = '150px',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showFontSize, setShowFontSize] = useState(false)
  const [focused, setFocused] = useState(false)
  const lastSentRef = useRef(value)
  const justBlurredRef = useRef(false)
  const isMountedRef = useRef(false)

  // Conteúdo inicial: só na montagem
  useEffect(() => {
    if (editorRef.current && !isMountedRef.current) {
      isMountedRef.current = true
      editorRef.current.innerHTML = value || ''
      lastSentRef.current = value || ''
    }
  }, [])

  // Sincronizar value do pai para o DOM apenas quando NÃO acabamos de dar blur (evita apagar o que o usuário digitou)
  useEffect(() => {
    if (!editorRef.current) return
    if (focused) return
    if (justBlurredRef.current) {
      justBlurredRef.current = false
      return
    }
    if (value !== lastSentRef.current) {
      editorRef.current.innerHTML = value || ''
      lastSentRef.current = value || ''
    }
  }, [value, focused])

  const sendValue = useCallback(
    (html: string) => {
      lastSentRef.current = html
      onChange(html)
    },
    [onChange]
  )

  const execCommand = useCallback(
    (command: string, arg?: string) => {
      document.execCommand(command, false, arg)
      editorRef.current?.focus()
      if (editorRef.current) sendValue(editorRef.current.innerHTML)
    },
    [sendValue]
  )

  const handleInput = useCallback(() => {
    if (editorRef.current) sendValue(editorRef.current.innerHTML)
  }, [sendValue])

  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      lastSentRef.current = html
      justBlurredRef.current = true
      onChange(html)
    }
    setFocused(false)
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const setFontSize = useCallback(
    (size: string) => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        span.style.fontSize = size
        range.surroundContents(span)
        if (editorRef.current) sendValue(editorRef.current.innerHTML)
      }
      setShowFontSize(false)
    },
    [sendValue]
  )

  return (
    <div className={className} dir="ltr" style={{ direction: 'ltr' }}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white" dir="ltr">
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
          <ToolButton onClick={() => execCommand('bold')} title="Negrito (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => execCommand('italic')} title="Itálico (Ctrl+I)">
            <Italic className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => execCommand('underline')} title="Sublinhado (Ctrl+U)">
            <Underline className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <ToolButton onClick={() => execCommand('insertUnorderedList')} title="Lista">
            <List className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => execCommand('insertOrderedList')} title="Lista numerada">
            <ListOrdered className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <ToolButton onClick={() => execCommand('justifyLeft')} title="Alinhar à esquerda">
            <AlignLeft className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => execCommand('justifyCenter')} title="Centralizar">
            <AlignCenter className="w-4 h-4" />
          </ToolButton>
          <ToolButton onClick={() => execCommand('justifyRight')} title="Alinhar à direita">
            <AlignRight className="w-4 h-4" />
          </ToolButton>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <div className="relative">
            <ToolButton onClick={() => setShowFontSize(!showFontSize)} title="Tamanho da fonte">
              <Type className="w-4 h-4" />
            </ToolButton>
            {showFontSize && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]">
                {fontSizes.map((fs) => (
                  <button
                    key={fs.value}
                    type="button"
                    onClick={() => setFontSize(fs.size)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                    style={{ fontSize: fs.size }}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor: conteúdo controlado só por ref/useEffect, nunca por dangerouslySetInnerHTML no render */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          dir="ltr"
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            'px-4 py-3 outline-none prose prose-sm max-w-none text-left',
            'focus:ring-0',
            '[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-slate-400'
          )}
          style={{
            minHeight,
            direction: 'ltr',
            textAlign: 'left',
            unicodeBidi: 'isolate',
          }}
        />
      </div>
    </div>
  )
}
