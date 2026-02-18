'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Upload } from 'lucide-react'

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  onCancel: () => void
}

export default function SignatureCanvas({ onSave, onCancel }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [mode, setMode] = useState<'draw' | 'upload'>('draw')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [saveToDevice, setSaveToDevice] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  useEffect(() => {
    if (mode !== 'upload' || !uploadedImage) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
      const x = canvas.width / 2 - (img.width / 2) * scale
      const y = canvas.height / 2 - (img.height / 2) * scale
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
    }
    img.src = uploadedImage
  }, [mode, uploadedImage])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setUploadedImage(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const signatureData = canvas.toDataURL('image/png')
    if (saveToDevice) {
      const link = document.createElement('a')
      link.download = 'assinatura.png'
      link.href = signatureData
      link.click()
    }
    onSave(signatureData)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Assine abaixo.</h3>
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`px-6 py-2 rounded-lg transition-all ${mode === 'draw' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            Desenhar
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-6 py-2 rounded-lg transition-all ${mode === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-slate-400'}`}
          >
            Subir
          </button>
        </div>
      </div>

      <Card className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
        {mode === 'draw' ? (
          <canvas
            ref={canvasRef}
            width={600}
            height={300}
            className="w-full bg-white rounded-lg cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        ) : (
          <div className="w-full h-[300px] bg-white rounded-lg flex items-center justify-center">
            {uploadedImage ? (
              <canvas ref={canvasRef} width={600} height={300} className="w-full max-h-[300px] object-contain rounded-lg" />
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-slate-400" />
                <p className="text-slate-600">Clique para fazer upload da assinatura</p>
              </label>
            )}
          </div>
        )}
        <div className="flex items-center justify-center mt-4">
          <button
            type="button"
            onClick={clearSignature}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Limpar assinatura</span>
          </button>
        </div>
      </Card>

      <div className="flex items-center gap-2 px-4">
        <input
          type="checkbox"
          id="save-device"
          checked={saveToDevice}
          onChange={(e) => setSaveToDevice(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="save-device" className="text-sm text-slate-600 cursor-pointer">
          Salvar assinatura neste dispositivo
        </label>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1 h-14 rounded-xl">
          Cancelar
        </Button>
        <Button onClick={handleSave} className="flex-1 h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-lg font-semibold">
          FINALIZAR
        </Button>
      </div>
    </div>
  )
}
