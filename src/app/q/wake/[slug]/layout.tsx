import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: true, follow: true },
}

/** Mesmo escopo visual que /dashboard/quiz (tipografia do quiz). */
export default function PublicWakeQuizSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="wake-quiz-root min-h-dvh font-inter text-foreground bg-background">{children}</div>
  )
}
