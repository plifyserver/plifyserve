'use client'

import { useEffect, useRef, useState } from 'react'

function previewSrc(url: string) {
  if (!url || url.includes('#t=')) return url
  return `${url}#t=0.001`
}

export function PalhaVideoThumb({
  url,
  objectFit = 'cover',
  onReady,
}: {
  url: string
  objectFit?: 'cover' | 'contain'
  onReady?: (width: number, height: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onReadyRef = useRef(onReady)
  const [poster, setPoster] = useState('')
  onReadyRef.current = onReady

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let captured = false

    const report = () => {
      if (video.videoWidth > 1 && video.videoHeight > 1) {
        onReadyRef.current?.(video.videoWidth, video.videoHeight)
      }
    }

    const capture = () => {
      report()
      if (captured || video.videoWidth < 2 || video.videoHeight < 2) return
      try {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight))
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const data = canvas.toDataURL('image/jpeg', 0.72)
        if (data.startsWith('data:image')) {
          setPoster(data)
          captured = true
        }
      } catch {
        // Sem CORS o canvas não gera a capa; o #t=0.001 ainda tenta mostrar o quadro.
      }
    }

    const onMeta = () => {
      report()
      try {
        if (video.currentTime < 0.05) video.currentTime = 0.12
        else capture()
      } catch {
        capture()
      }
    }

    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('loadeddata', capture)
    video.addEventListener('seeked', capture)
    return () => {
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('loadeddata', capture)
      video.removeEventListener('seeked', capture)
    }
  }, [url])

  return (
    <span className="palha-ag-video-wrap">
      {poster ? <img src={poster} alt="" className="palha-ag-video-poster" style={{ objectFit }} /> : null}
      <video
        ref={videoRef}
        className={`palha-ag-video${poster ? ' is-covered' : ''}`}
        src={previewSrc(url)}
        poster={poster || undefined}
        muted
        playsInline
        preload="metadata"
        controls={false}
        style={{ objectFit }}
      />
    </span>
  )
}
