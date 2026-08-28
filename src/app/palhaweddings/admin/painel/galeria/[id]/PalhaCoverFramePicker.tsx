'use client'

import { useEffect, useRef, useState } from 'react'

export function PalhaCoverFramePicker({
  src,
  posterUrl,
  initialTime = 0,
  onCancel,
  onConfirm,
}: {
  src: string
  posterUrl?: string
  initialTime?: number
  onCancel: () => void
  onConfirm: (time: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [time, setTime] = useState(initialTime)

  function seek(next: number) {
    const video = videoRef.current
    const safe = Math.max(0, Math.min(next, duration || next))
    setTime(safe)
    if (video) video.currentTime = safe
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onMetadata = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0
      setDuration(nextDuration)
      const safe = Math.min(initialTime, Math.max(0, nextDuration - 0.05))
      setTime(safe)
      video.currentTime = safe
    }
    video.addEventListener('loadedmetadata', onMetadata)
    return () => video.removeEventListener('loadedmetadata', onMetadata)
  }, [initialTime])

  return (
    <div className="palha-cover-frame-picker">
      <h2 className="palha-label">Escolher frame da capa</h2>
      <p className="palha-copy">Arraste o controle até o momento que deve aparecer como foto de capa.</p>
      <video
        ref={videoRef}
        src={src}
        poster={posterUrl || undefined}
        controls
        playsInline
        preload="metadata"
        className="palha-cover-frame-video"
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
      />
      <label className="palha-cover-frame-range">
        <span>{time.toFixed(1)}s</span>
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.1"
          value={Math.min(time, duration || time)}
          onChange={(event) => seek(Number(event.target.value))}
        />
        <span>{duration ? `${duration.toFixed(1)}s` : '…'}</span>
      </label>
      <div className="palha-modal-actions">
        <button type="button" className="palha-btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="palha-btn is-solid" onClick={() => onConfirm(time)}>
          Usar este frame
        </button>
      </div>
    </div>
  )
}

