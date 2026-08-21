'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function PalhaReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in')
      return
    }
    const show = () => el.classList.add('is-in')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        show()
        io.disconnect()
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    )
    io.observe(el)
    const failsafe = window.setTimeout(show, 2500)
    return () => {
      io.disconnect()
      window.clearTimeout(failsafe)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`palha-reveal${className ? ` ${className}` : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
