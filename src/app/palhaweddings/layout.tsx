import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Palha Weddings',
  description: '',
  manifest: undefined,
  icons: {
    icon: '/favicon.ico',
  },
}

export default function PalhaWeddingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children
}
