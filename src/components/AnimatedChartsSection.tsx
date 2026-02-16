'use client'

import { useEffect, useState } from 'react'
import { Chart3DParallax } from './Chart3DParallax'

const ANIMATION_INTERVAL = 2000

export function AnimatedChartsSection() {
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setAnimationKey((k) => k + 1)
    }, ANIMATION_INTERVAL)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Métricas que importam</h2>
        <p className="text-zinc-400 text-center mb-16 max-w-2xl mx-auto">
          Acompanhe impressões, cliques, leads e conversões em tempo real no seu dashboard
        </p>
        <Chart3DParallax animationKey={animationKey} />
      </div>
    </section>
  )
}
