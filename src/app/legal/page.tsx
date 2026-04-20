export const dynamic = 'force-static'

export default function LegalPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>Plify</h1>
      <p>
        Plify is a platform that allows users to connect their Google Calendar and automatically create
        and manage events.
      </p>

      <ul>
        <li>
          <a href="/legal/privacy">Privacy Policy</a>
        </li>
        <li>
          <a href="/legal/terms">Terms of Service</a>
        </li>
      </ul>
    </main>
  )
}
