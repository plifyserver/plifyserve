export const dynamic = 'force-static'

export default function PrivacyPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif', maxWidth: 900, lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>

      <p>
        <strong>Last updated:</strong> April 2026
      </p>

      <p>
        Plify respects your privacy and is committed to protecting your personal data. This Privacy
        Policy explains how we collect, use, store, share, retain, and delete user data, including Google
        user data accessed through Google API Services.
      </p>

      <h2>1. Google User Data Accessed</h2>

      <p>When a user connects their Google account to Plify, the application may access the following Google user data:</p>

      <ul>
        <li>Basic Google profile information, such as name and email address.</li>
        <li>
          Google Calendar event data, including event title, date, time, description, and calendar event
          identifiers.
        </li>
      </ul>

      <p>
        Plify uses the Google Calendar API only when the user explicitly connects their Google account
        and grants permission through the OAuth consent flow.
      </p>

      <h2>2. How Google User Data Is Used</h2>

      <p>
        Google user data is used only to provide calendar synchronization features inside Plify.
        Specifically, Plify uses this data to:
      </p>

      <ul>
        <li>Create events in the user&apos;s Google Calendar based on events created inside Plify.</li>
        <li>Update calendar events when the related event is changed inside Plify.</li>
        <li>Display or confirm synchronization status between Plify and Google Calendar.</li>
        <li>Identify the connected Google account using basic profile information such as email address.</li>
      </ul>

      <p>
        Plify does not use Google user data for advertising, profiling, analytics unrelated to the
        service, or any purpose unrelated to calendar synchronization.
      </p>

      <h2>3. Data Sharing</h2>

      <p>
        Plify does not sell, rent, transfer, or share Google user data with third parties for advertising
        or marketing purposes.
      </p>

      <p>
        Google user data may only be processed by infrastructure providers that help operate the
        application, such as hosting, database, authentication, and cloud service providers. These
        providers are used only to deliver the Plify service and are not permitted to use Google user
        data for their own purposes.
      </p>

      <h2>4. Data Storage and Protection</h2>

      <p>
        Plify stores only the minimum data necessary to provide the calendar synchronization feature.
        Data is protected using reasonable technical and organizational safeguards, including access
        controls, secure connections, and restricted access to production systems.
      </p>

      <p>
        OAuth tokens and related integration data are stored securely and used only to maintain the user&apos;s
        Google Calendar integration.
      </p>

      <h2>5. Data Retention and Deletion</h2>

      <p>
        Google user data is retained only for as long as necessary to provide the requested
        functionality or as required for legitimate operational or legal purposes.
      </p>

      <p>
        Users can disconnect Google Calendar integration at any time from within Plify, if available, or
        revoke Plify&apos;s access through their Google Account permissions page:
      </p>

      <p>
        <a href="https://myaccount.google.com/permissions">https://myaccount.google.com/permissions</a>
      </p>

      <p>
        Users may request deletion of their data by contacting us at:
        <br />
        <strong>plifyserver@gmail.com</strong>
      </p>

      <p>
        Upon receiving a deletion request, Plify will delete or anonymize the user&apos;s associated data
        within a reasonable timeframe, unless retention is required by law or legitimate business
        obligations.
      </p>

      <h2>6. User Control</h2>

      <p>
        Users remain in control of their Google account permissions. Access to Google user data can be
        revoked at any time through Google Account settings. Once access is revoked, Plify will no longer
        be able to access or synchronize Google Calendar data.
      </p>

      <h2>7. Contact</h2>

      <p>
        If you have any questions about this Privacy Policy or how Plify handles Google user data, please
        contact us at:
      </p>

      <p>
        <strong>plifyserver@gmail.com</strong>
      </p>
    </main>
  )
}
