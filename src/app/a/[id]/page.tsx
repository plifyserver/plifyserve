'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Doc = {
  id: string
  file_url: string
  client_name: string
  status: 'pending' | 'signed'
  signature_data_url: string | null
  signed_at: string | null
}

export default function AssinarDocumentoPage() {
  const params = useParams()
  const docId = params?.id as string
  const [doc, setDoc] = useState<Doc | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showCanvas, setShowCanvas] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)

  useEffect(() => {
    if (!docId) return
    const fetchDoc = async () => {
      const res = await fetch(`/api/assinaturas-digitais/${docId}`)
      if (res.status === 404) {
        setNotFound(true)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setLoading(false)
        return
      }
      const data = await res.json()
      setDoc(data)
      if (data.status === 'signed') setSigned(true)
      setLoading(false)
    }
    fetchDoc()
  }, [docId])

  const getPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
    if (clientX == null || clientY == null) return null
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const pt = getPoint(e)
    if (!pt) return
    drawingRef.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)
  }, [getPoint])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const pt = getPoint(e)
    if (!pt) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
  }, [getPoint])

  const stopDrawing = useCallback(() => {
    drawingRef.current = false
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const requestLocation = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Seu navegador não suporta localização.')
        resolve(null)
        return
      }
      setLocationError(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          setLocation(coords)
          resolve(coords)
        },
        () => {
          setLocationError('Não foi possível obter a localização. Você pode assinar mesmo assim.')
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }, [])

  const openCanvas = useCallback(async () => {
    const coords = await requestLocation()
    setShowCanvas(true)
    if (coords) setLocation(coords)
    requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    })
  }, [requestLocation])

  const confirmSignature = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !docId) return
    const dataUrl = canvas.toDataURL('image/png')
    if (!dataUrl || dataUrl.length < 100) {
      alert('Desenhe sua assinatura antes de confirmar.')
      return
    }
    setSigning(true)
    const signedClientAt = new Date().toISOString()
    const payload: Record<string, unknown> = {
      signature_data_url: dataUrl,
      signed_client_at: signedClientAt,
    }
    if (location) {
      payload.signed_latitude = location.latitude
      payload.signed_longitude = location.longitude
    }
    try {
      const res = await fetch(`/api/assinaturas-digitais/${docId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSigned(true)
        setShowCanvas(false)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Erro ao enviar assinatura.')
      }
    } catch {
      alert('Erro de conexão.')
    }
    setSigning(false)
  }, [docId, location])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Link inválido ou documento não encontrado.</p>
      </div>
    )
  }

  if (!doc) {
    return null
  }

  if (signed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-lg text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Documento assinado</h1>
          <p className="text-gray-600">Obrigado. Sua assinatura foi registrada com sucesso.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Documento para assinatura</h1>
        {doc.client_name && (
          <p className="text-gray-600 text-sm mb-6">Destinatário: {doc.client_name}</p>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="p-2 bg-gray-100 border-b border-gray-200">
            <p className="text-sm text-gray-600">Leia o documento abaixo</p>
          </div>
          <div className="min-h-[400px]">
            <iframe
              src={doc.file_url}
              title="Documento PDF"
              className="w-full h-[500px] border-0"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {!showCanvas ? (
            <>
              <p className="text-gray-600 mb-4">
                Após ler o documento, clique em &quot;Assinar&quot;. Será solicitada a permissão de localização (para registrar onde e quando a assinatura foi feita).
              </p>
              {locationError && (
                <p className="text-amber-600 text-sm mb-3">{locationError}</p>
              )}
              <button
                type="button"
                onClick={openCanvas}
                className="w-full py-3 rounded-lg bg-avocado text-white font-medium hover:opacity-90"
              >
                Assinar
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">Desenhe sua assinatura no quadro abaixo.</p>
              <div className="border-2 border-gray-200 rounded-lg bg-white mb-4 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-48 block touch-none cursor-crosshair"
                  style={{ width: '100%', height: '12rem' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Apagar
                </button>
                <button
                  type="button"
                  onClick={confirmSignature}
                  disabled={signing}
                  className="flex-1 py-2 rounded-lg bg-avocado text-white font-medium disabled:opacity-50"
                >
                  {signing ? 'Enviando...' : 'Confirmar assinatura'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
