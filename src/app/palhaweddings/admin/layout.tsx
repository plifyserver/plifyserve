import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin',
}

export default function PalhaAdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
