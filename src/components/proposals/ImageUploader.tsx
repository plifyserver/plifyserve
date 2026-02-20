'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string | null) => void
  label?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
}

export function ImageUploader({ 
  value, 
  onChange, 
  label = 'Upload de imagem',
  className,
  aspectRatio = 'auto'
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }

    setIsLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      onChange(e.target?.result as string)
      setIsLoading(false)
    }
    reader.onerror = () => {
      alert('Erro ao carregar imagem.')
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }, [onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleRemove = useCallback(() => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onChange])

  const aspectClass = aspectRatio === 'square' 
    ? 'aspect-square' 
    : aspectRatio === 'video' 
      ? 'aspect-video' 
      : 'min-h-[160px]'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      {value ? (
        <div className={cn('relative rounded-xl overflow-hidden bg-slate-100', aspectClass)}>
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative rounded-xl border-2 border-dashed cursor-pointer transition-all',
            aspectClass,
            'flex flex-col items-center justify-center gap-3 p-6',
            isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50',
            isLoading && 'pointer-events-none opacity-60'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          
          {isLoading ? (
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          ) : (
            <>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isDragging ? 'bg-indigo-100' : 'bg-slate-100'
              )}>
                {isDragging ? (
                  <Upload className="w-6 h-6 text-indigo-600" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {isDragging ? 'Solte a imagem aqui' : 'Clique ou arraste uma imagem'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG ou WEBP (máx. 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
