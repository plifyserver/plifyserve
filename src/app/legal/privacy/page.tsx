export const dynamic = 'force-static'

export default function PrivacyPage() {
  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif', maxWidth: 900, lineHeight: 1.6 }}>
      <h1>Privacy Policy</h1>

      <p>
        <strong>Last updated:</strong> April 2026
      </p>

      <p>
        Plify respects user privacy and is committed to protecting personal data. This Privacy Policy
        explains how Plify accesses, collects, uses, stores, shares, retains, and deletes user data,
        including Google user data accessed through Google API Services.
      </p>

      <h2>Google User Data</h2>

      <p>
        Plify integrates with Google Calendar using Google API Services. Google user data is accessed
        only after the user explicitly connects their Google account and grants permission through the
        OAuth consent screen.
      </p>

      <h3>1. Google Data Accessed or Collected</h3>

      <p>
        When a user connects their Google account to Plify, Plify may access or interact with the
        following Google user data:
      </p>

      <ul>
        <li>Basic Google profile information, including the user&apos;s name and email address.</li>
        <li>
          Google Calendar event data, including event title, description, date, time, duration, and event
          ID.
        </li>
        <li>
          Calendar information required to create, update, or synchronize events selected or created by
          the user.
        </li>
        <li>OAuth tokens required to maintain the Google Calendar integration after user consent.</li>
      </ul>

      <p>
        Plify does not access Gmail, Google Drive, contacts, documents, photos, or any other Google data
        unrelated to Google Calendar event synchronization.
      </p>

      <h3>2. How Google User Data Is Used</h3>

      <p>
        Plify uses Google user data only to provide user-facing calendar synchronization features inside
        the application. Specifically, Google user data is used to:
      </p>

      <ul>
        <li>Create events in the user&apos;s Google Calendar when the user creates an event inside Plify.</li>
        <li>Update Google Calendar events when related event information is changed inside Plify.</li>
        <li>Synchronize event information between Plify and the user&apos;s Google Calendar.</li>
        <li>Show or confirm the integration status of the connected Google account.</li>
        <li>Identify which Google account is connected to the user&apos;s Plify account.</li>
      </ul>

      <p>
        Plify does not use Google user data for advertising, marketing, profiling, selling user
        information, or analytics unrelated to the calendar synchronization feature.
      </p>

      <h3>3. Data Sharing</h3>

      <p>
        Plify does not sell, rent, trade, or share Google user data with third parties for advertising or
        marketing purposes.
      </p>

      <p>
        Google user data may be processed by service providers that are necessary to operate Plify, such
        as hosting, database, authentication, and cloud infrastructure providers. These providers process
        data only to support the operation of the application and are not permitted to use Google user
        data for their own purposes.
      </p>

      <h3>4. Data Storage and Security</h3>

      <p>
        Plify stores only the minimum Google user data necessary to provide calendar synchronization
        features. OAuth tokens and integration data are stored securely and are used only to maintain the
        user&apos;s Google Calendar connection.
      </p>

      <p>
        Plify uses reasonable technical and organizational safeguards to protect user data, including
        HTTPS encryption in transit, restricted access to production systems, access controls, and secure
        handling of authentication credentials.
      </p>

      <h3>5. Data Retention</h3>

      <p>
        Google user data is retained only for as long as necessary to provide the Google Calendar
        integration and related scheduling features.
      </p>

      <p>
        If a user disconnects the Google Calendar integration, revokes access, or requests deletion,
        Plify will remove or invalidate OAuth tokens and delete associated Google integration data within
        a reasonable timeframe, unless retention is required by law or legitimate operational
        obligations.
      </p>

      <h3>6. Data Deletion and User Control</h3>

      <p>
        Users can revoke Plify&apos;s access to their Google account at any time through Google Account
        permissions:
      </p>

      <p>
        <a href="https://myaccount.google.com/permissions">https://myaccount.google.com/permissions</a>
      </p>

      <p>
        Users may also request deletion of their Plify account data and Google integration data by
        contacting:
      </p>

      <p>
        <strong>plifyserver@gmail.com</strong>
      </p>

      <p>
        After receiving a deletion request, Plify will delete or anonymize the user&apos;s associated data
        within a reasonable timeframe.
      </p>

      <h3>7. Limited Use Compliance</h3>

      <p>
        Plify&apos;s use and transfer of information received from Google APIs complies with the Google API
        Services User Data Policy, including the Limited Use requirements.
      </p>

      <p>
        Google user data is used only to provide and improve user-facing calendar synchronization
        features. Google user data is not used to train AI or machine learning models, is not used for
        advertising, and is not transferred to third parties except as necessary to provide or improve
        the application&apos;s user-facing functionality.
      </p>

      <h3>8. Contact</h3>

      <p>
        If you have questions about this Privacy Policy or how Plify handles Google user data, contact us
        at:
      </p>

      <p>
        <strong>plifyserver@gmail.com</strong>
      </p>
    </main>
  )
}
