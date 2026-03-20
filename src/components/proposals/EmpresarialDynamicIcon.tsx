'use client'

import { useEffect, useState, type ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import { Circle } from 'lucide-react'
import dynamicIconImports from 'lucide-react/dynamicIconImports'

export function EmpresarialDynamicIcon({
  iconKey,
  className,
  size = 20,
}: {
  iconKey: string
  className?: string
  size?: number
}) {
  const [Icon, setIcon] = useState<ComponentType<LucideProps>>(() => Circle)

  useEffect(() => {
    const loader = dynamicIconImports[iconKey as keyof typeof dynamicIconImports]
    if (!loader) {
      setIcon(() => Circle)
      return
    }
    let cancelled = false
    loader()
      .then((mod) => {
        if (!cancelled) setIcon(() => mod.default)
      })
      .catch(() => {
        if (!cancelled) setIcon(() => Circle)
      })
    return () => {
      cancelled = true
    }
  }, [iconKey])

  return <Icon className={className} size={size} strokeWidth={1.5} />
}
