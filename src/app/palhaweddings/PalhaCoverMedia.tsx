'use client'

import type { MouseEventHandler } from 'react'
import type { PalhaMediaKind } from '@/lib/palha/site-settings-shared'

export function PalhaCoverMedia({
  url,
  kind = 'image',
  posterUrl,
  controls = false,
  className,
  onClick,
}: {
  url: string
  kind?: PalhaMediaKind
  posterUrl?: string
  controls?: boolean
  className?: string
  onClick?: MouseEventHandler<HTMLVideoElement | HTMLImageElement>
}) {
  if (kind === 'video') {
    return (
      <video
        src={url}
        poster={posterUrl || undefined}
        controls={controls}
        playsInline
        preload={controls ? 'metadata' : 'none'}
        className={className}
        onClick={onClick}
      />
    )
  }
  return <img src={url} alt="" className={className} onClick={onClick} />
}

