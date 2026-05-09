import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiz Wake — Plify',
  description: 'Quiz de qualificação Wake Aceleradora Digital',
}

/** Layout dedicado: tipografia Inter + Space Grotesk (estilo do template Base44). */
export default function WakeQuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="wake-quiz-root min-h-[calc(100dvh-1px)] font-inter text-foreground bg-background [&_.text-foreground]:text-foreground">
      {children}
    </div>
  )
}
