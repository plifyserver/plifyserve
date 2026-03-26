'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Upload, MapPin, Calendar, Clock, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export interface SignatureData {
  signatureImage: string
  selfieImage?: string | null
  cpf: string
  birthDate: string
  signedAt: string
  location: {
    latitude: number | null
    longitude: number | null
    address: string | null
  }
}

interface SignatureCanvasProps {
  onSave: (data: SignatureData) => void
  onCancel: () => void
  signatoryName?: string
  requireCpf?: boolean
  requireBirthDate?: boolean
  captureLocation?: boolean
  requireSelfie?: boolean
}

export default function SignatureCanvas({ 
  onSave, 
  onCancel, 
  signatoryName,
  requireCpf = true,
  requireBirthDate = true,
  captureLocation = true,
  requireSelfie = false,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [mode, setMode] = useState<'draw' | 'upload'>('draw')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [selfieOpen, setSelfieOpen] = useState(false)
  const [selfieLoading, setSelfieLoading] = useState(false)
  /** Sem dimensões reais do vídeo, capturar gera imagem preta (canvas 1280×720 com frame vazio). */
  const [videoReady, setVideoReady] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  /** Estado para ligar o <video> depois que ele montar (evita Firefox: stream antes do elemento existir). */
  const [liveCameraStream, setLiveCameraStream] = useState<MediaStream | null>(null)
  const cameraStartLockRef = useRef(false)
  
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null; address: string | null }>({
    latitude: null,
    longitude: null,
    address: null,
  })
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2.5
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

  const captureUserLocation = useCallback(async () => {
    if (!captureLocation) return
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não disponível neste dispositivo.')
      return
    }

    setLocationLoading(true)
    setLocationError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 60000,
        })
      })

      const { latitude, longitude } = position.coords
      setLocation({ latitude, longitude, address: null })

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        )
        if (response.ok) {
          const data = await response.json()
          setLocation((prev) => ({ ...prev, address: data.display_name || null }))
        }
      } catch {
        // Endereço não é obrigatório
      }
    } catch (err) {
      setLocationError('Não foi possível obter sua localização. Ative o GPS e permita o acesso no navegador, depois tente novamente.')
      console.error('Geolocation error:', err)
    } finally {
      setLocationLoading(false)
    }
  }, [captureLocation])

  useEffect(() => {
    captureUserLocation()
  }, [captureUserLocation])

  const stopSelfieStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop()
      streamRef.current = null
    }
    setLiveCameraStream(null)
  }, [])

  /** Monta o <video> primeiro; só então anexa o stream (corrige câmera lenta / 2º clique no Firefox). */
  useEffect(() => {
    if (!selfieOpen || !liveCameraStream) return
    const video = videoRef.current
    if (!video) return
    video.srcObject = liveCameraStream
    void video.play().catch(() => undefined)
  }, [selfieOpen, liveCameraStream])

  const startSelfieStream = useCallback(async () => {
    if (cameraStartLockRef.current) return
    cameraStartLockRef.current = true
    setSelfieLoading(true)
    setVideoReady(false)
    setSelfieOpen(true)
    try {
      stopSelfieStream()
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setLiveCameraStream(stream)
    } catch {
      toast.error('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      setSelfieOpen(false)
    } finally {
      setSelfieLoading(false)
      cameraStartLockRef.current = false
    }
  }, [stopSelfieStream])

  const captureSelfie = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const drawFrame = () => {
      const w = video.videoWidth
      const h = video.videoHeight
      if (!w || !h) {
        toast.error('Aguarde a prévia da câmera carregar e tente de novo.')
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return
      try {
        ctx.drawImage(video, 0, 0, w, h)
      } catch {
        toast.error('Não foi possível capturar o quadro. Tente novamente.')
        return
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.86)
      setSelfieImage(dataUrl)
      setSelfieOpen(false)
      setVideoReady(false)
      stopSelfieStream()
    }

    // Dois frames: alguns navegadores só preenchem o buffer após o próximo paint
    requestAnimationFrame(() => {
      requestAnimationFrame(drawFrame)
    })
  }, [stopSelfieStream])

  useEffect(() => {
    return () => {
      stopSelfieStream()
    }
  }, [stopSelfieStream])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height),
      }
    }
    
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const { x, y } = getCoordinates(e)
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
    setHasDrawn(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setUploadedImage(dataUrl)
      setHasDrawn(true)
    }
    reader.readAsDataURL(file)
  }

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11)
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value))
  }

  const validateCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '')
    return numbers.length === 11
  }

  const handleSave = () => {
    if (!hasDrawn && !uploadedImage) {
      toast.error('Por favor, desenhe ou faça upload da sua assinatura.')
      return
    }

    if (requireSelfie && !selfieImage) {
      toast.error('Por favor, tire uma selfie antes de finalizar.')
      return
    }
    
    if (requireCpf && !validateCpf(cpf)) {
      toast.error('Por favor, insira um CPF válido com 11 dígitos.')
      return
    }
    
    if (requireBirthDate && !birthDate) {
      toast.error('Por favor, insira sua data de nascimento.')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    
    const signatureImage = canvas.toDataURL('image/png')
    const signedAt = new Date().toISOString()

    onSave({
      signatureImage,
      selfieImage,
      cpf: cpf.replace(/\D/g, ''),
      birthDate,
      signedAt,
      location,
    })
  }

  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = currentDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Assinatura Digital</h3>
        {signatoryName && (
          <p className="text-slate-600">Assinando como: <span className="font-semibold">{signatoryName}</span></p>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <div className="text-sm">
            <p className="text-slate-500">Data</p>
            <p className="font-medium text-slate-900 capitalize">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <Clock className="w-5 h-5 text-indigo-600" />
          <div className="text-sm">
            <p className="text-slate-500">Hora</p>
            <p className="font-medium text-slate-900">{formattedTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="text-sm min-w-0 flex-1">
            <p className="text-slate-500">Localização</p>
            {locationLoading ? (
              <p className="font-medium text-slate-500">Obtendo...</p>
            ) : locationError ? (
              <div>
                <p className="font-medium text-amber-600 text-xs">Não disponível</p>
                <button
                  type="button"
                  onClick={captureUserLocation}
                  className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 underline"
                >
                  Tentar novamente
                </button>
              </div>
            ) : location.address ? (
              <p className="font-medium text-slate-900 truncate text-xs" title={location.address}>
                {location.address.split(',').slice(0, 2).join(', ')}
              </p>
            ) : location.latitude ? (
              <p className="font-medium text-slate-900 text-xs">
                {location.latitude.toFixed(4)}, {location.longitude?.toFixed(4)}
              </p>
            ) : (
              <p className="font-medium text-slate-500">--</p>
            )}
          </div>
        </div>
      </div>

      {/* CPF and Birth Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {requireCpf && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              CPF *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="pl-10 rounded-xl"
                maxLength={14}
              />
            </div>
          </div>
        )}
        {requireBirthDate && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Data de nascimento *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="pl-10 rounded-xl"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Selfie */}
      {requireSelfie && (
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Selfie (obrigatório)</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tire uma selfie para constar no contrato junto com a assinatura.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={startSelfieStream}
              disabled={selfieLoading}
            >
              {selfieImage ? 'Refazer' : 'Tirar selfie'}
            </Button>
          </div>

          {selfieOpen && (
            <div className="mt-4">
              <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-200">
                <video
                  ref={videoRef}
                  className="w-full h-[260px] sm:h-[320px] object-cover [transform:scaleX(-1)]"
                  playsInline
                  muted
                  autoPlay
                  onLoadedMetadata={() => setVideoReady(true)}
                  onCanPlay={() => setVideoReady(true)}
                  onEmptied={() => setVideoReady(false)}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {videoReady
                  ? 'Quando estiver vendo sua imagem acima, toque em Capturar.'
                  : 'Carregando câmera…'}
              </p>
              <div className="mt-3 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setSelfieOpen(false)
                    setVideoReady(false)
                    stopSelfieStream()
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  onClick={captureSelfie}
                  disabled={!videoReady}
                >
                  Capturar
                </Button>
              </div>
            </div>
          )}

          {!selfieOpen && selfieImage && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[160px,1fr] gap-4 items-start">
              <img
                src={selfieImage}
                alt="Selfie"
                className="w-full max-w-[240px] sm:max-w-[160px] rounded-xl border border-slate-200 bg-white object-cover aspect-[4/3]"
              />
              <div className="text-xs text-slate-500 leading-relaxed">
                Essa imagem será armazenada junto ao registro da assinatura e exibida no certificado do contrato.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setMode('draw')}
          className={`px-6 py-2 rounded-lg transition-all ${mode === 'draw' ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Desenhar
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-6 py-2 rounded-lg transition-all ${mode === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Fazer upload
        </button>
      </div>

      {/* Campo de assinatura: linha fina vermelha onde se assina */}
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-red-600 mb-2 font-medium">Campo da assinatura — desenhe na linha abaixo</p>
        <div className="bg-white rounded-lg overflow-hidden">
          {mode === 'draw' ? (
            <>
              <div className="w-full border-b-2 border-red-500" aria-hidden />
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                className="w-full bg-white cursor-crosshair touch-none block"
                style={{ touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </>
          ) : (
            <>
              <div className="w-full border-b-2 border-red-500" aria-hidden />
              <div className="w-full h-[160px] flex items-center justify-center">
                {uploadedImage ? (
                  <canvas ref={canvasRef} width={600} height={160} className="w-full max-h-[160px] object-contain block" />
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3 p-6">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 text-center">Clique para fazer upload da assinatura</p>
                    <p className="text-slate-400 text-sm">PNG, JPG ou WEBP</p>
                  </label>
                )}
              </div>
            </>
          )}
          <div className="flex items-center justify-center py-3 border-t border-slate-200">
            <button
              type="button"
              onClick={clearSignature}
              className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              <span className="text-sm font-medium">Limpar assinatura</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Ao confirmar, você declara que está ciente de que esta assinatura tem validade jurídica e que os dados informados são verdadeiros.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1 h-11 sm:h-12 rounded-xl text-sm sm:text-base">
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          className="flex-1 h-11 sm:h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm sm:text-base font-semibold"
        >
          Confirmar Assinatura
        </Button>
      </div>
    </div>
  )
}
