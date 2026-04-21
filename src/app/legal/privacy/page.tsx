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
  margin: '0 0 24px',
}

const body: CSSProperties = {
  fontSize: 18,
  lineHeight: 1.65,
  color: '#374151',
  margin: '0 0 20px',
  maxWidth: '62ch',
}

const section: CSSProperties = {
  marginTop: 32,
  paddingTop: 28,
  borderTop: '1px solid #e5e7eb',
}

const backLink: CSSProperties = {
  display: 'inline-block',
  padding: '14px 20px',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  backgroundColor: '#fafafa',
  color: '#111827',
  textDecoration: 'none',
  fontSize: 16,
  fontWeight: 500,
}

export default function PrivacyPage() {
  return (
    <main style={page}>
      <div style={inner}>
        <h1 style={title}>Privacy Policy</h1>

        <p style={body}>
          We collect and use Google account and calendar-related data only to provide Google Calendar
          synchronization inside Plify: creating, updating, and managing events you choose to sync. We do
          not sell your data and we do not share it with third parties for their marketing purposes.
        </p>

        <p style={body}>
          You can disconnect Plify and revoke calendar access at any time from your Google Account
          security and permissions settings.
        </p>

        <div style={section}>
          <a href="/legal" style={backLink}>
            ← Back to Plify legal overview
          </a>
        </div>
      </div>
    </main>
  )
}
