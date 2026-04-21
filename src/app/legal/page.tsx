import type { CSSProperties } from 'react'

export const dynamic = 'force-static'

const page: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#ffffff',
  padding: '48px 20px',
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  color: '#111827',
}

const inner: CSSProperties = {
  maxWidth: 760,
  margin: '0 auto',
}

const title: CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
  margin: '0 0 20px',
}

const lead: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.65,
  color: '#374151',
  margin: '0 0 36px',
  maxWidth: '62ch',
}

const navLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#6b7280',
  margin: '0 0 14px',
}

const linkCard: CSSProperties = {
  display: 'block',
  padding: '18px 22px',
  marginBottom: 12,
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  backgroundColor: '#fafafa',
  color: '#111827',
  textDecoration: 'none',
  fontSize: 17,
  fontWeight: 500,
  lineHeight: 1.4,
}

export default function LegalPage() {
  return (
    <main style={page}>
      <div style={inner}>
        <h1 style={title}>Plify</h1>
        <p style={lead}>
          Plify is a platform that allows users to connect their Google Calendar and automatically create
          and manage events.
        </p>

        <p style={navLabel}>Legal documents</p>
        <nav aria-label="Legal">
          <a href="/legal/privacy" style={linkCard}>
            Privacy Policy
          </a>
          <a href="/legal/terms" style={linkCard}>
            Terms of Service
          </a>
        </nav>
      </div>
    </main>
  )
}
