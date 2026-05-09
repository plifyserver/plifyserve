import type { Metadata } from 'next'
import { WakeQuizPublicClient } from './WakeQuizPublicClient'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return {
    title: 'Quiz Wake — Plify',
    description: 'Descubra como lotar sua agenda — quiz rápido para salões.',
    robots: { index: true, follow: true },
  }
}

export default async function PublicWakeQuizPage({ params }: Props) {
  const { slug } = await params
  return <WakeQuizPublicClient slug={slug} />
}
