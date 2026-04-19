import nodemailer from 'nodemailer'

export type SendFeedbackSuggestionParams = {
  title: string
  category: string
  description: string
  fromUserEmail?: string | null
  fromUserName?: string | null
}

class FeedbackSmtpNotConfiguredError extends Error {
  constructor() {
    super('CONTRACT_SMTP_MISSING')
    this.name = 'FeedbackSmtpNotConfiguredError'
  }
}

function getSmtpConfig(): { host: string; port: number; user: string; pass: string; from: string } {
  const user = process.env.CONTRACT_SMTP_USER?.trim()
  const pass = process.env.CONTRACT_SMTP_PASS?.trim()
  if (!user || !pass) {
    throw new FeedbackSmtpNotConfiguredError()
  }
  const host = process.env.CONTRACT_SMTP_HOST?.trim() || 'smtp.gmail.com'
  const port = Number(process.env.CONTRACT_SMTP_PORT || '587')
  const from = process.env.CONTRACT_SMTP_FROM?.trim() || user
  return { host, port, user, pass, from }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendFeedbackSuggestionEmail(params: SendFeedbackSuggestionParams) {
  const { host, port, user, pass, from } = getSmtpConfig()
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const to = 'plifyserver@gmail.com'
  const subject = `Feedback & Sugestões: ${params.title.trim()}`

  const fromLine = [
    params.fromUserName?.trim() ? `Nome: ${params.fromUserName.trim()}` : null,
    params.fromUserEmail?.trim() ? `Email: ${params.fromUserEmail.trim()}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const text = [
    'Novo feedback/sugestão recebido:',
    '',
    `Título: ${params.title.trim()}`,
    `Categoria: ${params.category.trim()}`,
    '',
    params.description.trim(),
    '',
    fromLine ? `---\n${fromLine}` : '',
  ]
    .filter((x) => x !== '')
    .join('\n')

  const html = `
    <p><strong>Novo feedback/sugestão recebido</strong></p>
    <p><strong>Título:</strong> ${escapeHtml(params.title)}</p>
    <p><strong>Categoria:</strong> ${escapeHtml(params.category)}</p>
    <p><strong>Descrição:</strong><br/>${escapeHtml(params.description).replace(/\n/g, '<br/>')}</p>
    ${
      fromLine
        ? `<hr/><p style="white-space:pre-wrap">${escapeHtml(fromLine)}</p>`
        : ''
    }
  `

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  })
}

