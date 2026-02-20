'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ContractUploaderProps {
  value?: string | null
  onChange: (url: string | null, file?: File) => void
  userId?: string
  disabled?: boolean
  maxSize?: number
}

export default function ContractUploader({
  value,
  onChange,
  userId,
  disabled = false,
  maxSize = 10 * 1024 * 1024,
}: ContractUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadToStorage = useCallback(async (file: File): Promise<string | null> => {
    if (!userId) {
      setError('Usuário não identificado')
      return null
    }

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      setError('Erro ao fazer upload do arquivo')
      return null
    }

    const { data: urlData } = supabase.storage
      .from('contracts')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }, [userId])

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)

    if (file.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são permitidos')
      return
    }

    if (file.size > maxSize) {
      setError(`O arquivo deve ter no máximo ${(maxSize / 1024 / 1024).toFixed(0)}MB`)
      return
    }

    setFileName(file.name)
    setFileSize(file.size)
    setUploading(true)

    try {
      const url = await uploadToStorage(file)
      if (url) {
        onChange(url, file)
      }
    } finally {
      setUploading(false)
    }
  }, [maxSize, onChange, uploadToStorage])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = async () => {
    if (value && userId) {
      try {
        const supabase = createClient()
        const path = value.split('/contracts/')[1]
        if (path) {
          await supabase.storage.from('contracts').remove([path])
        }
      } catch (err) {
        console.error('Error removing file:', err)
      }
    }
    onChange(null)
    setFileName(null)
    setFileSize(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  if (value || uploading) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            uploading ? "bg-indigo-100" : "bg-red-100"
          )}>
            {uploading ? (
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            ) : (
              <File className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">
              {uploading ? 'Fazendo upload...' : (fileName || 'Documento PDF')}
            </p>
            <p className="text-sm text-slate-500">
              {uploading ? 'Aguarde...' : (fileSize ? formatFileSize(fileSize) : 'PDF anexado')}
            </p>
          </div>
          {!uploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={removeFile}
              disabled={disabled}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'rounded-xl border-2 border-dashed cursor-pointer transition-all',
          'flex flex-col items-center justify-center gap-3 p-6',
          disabled 
            ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-60' 
            : isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          isDragging ? 'bg-indigo-100' : 'bg-slate-100'
        )}>
          <Upload className={cn(
            'w-6 h-6',
            isDragging ? 'text-indigo-600' : 'text-slate-400'
          )} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-700">
            {isDragging ? 'Solte o arquivo aqui' : 'Clique ou arraste um PDF'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Apenas arquivos PDF (máx. {(maxSize / 1024 / 1024).toFixed(0)}MB)
          </p>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}
