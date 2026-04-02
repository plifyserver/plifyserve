import nodemailer from 'nodemailer'

export type SendContractSignLinkParams = {
  to: string
  signatoryName?: string
  contractTitle: string
  signUrl: string
}

export class ContractSmtpNotConfiguredError extends Error {
  constructor() {
    super('CONTRACT_SMTP_MISSING')
    this.name = 'ContractSmtpNotConfiguredError'
  }
}

function getSmtpConfig(): { host: string; port: number; user: string; pass: string; from: string } {
  const user = process.env.CONTRACT_SMTP_USER?.trim()
  const pass = process.env.CONTRACT_SMTP_PASS?.trim()
  if (!user || !pass) {
    throw new ContractSmtpNotConfiguredError()
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

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export async function sendContractSignLinkEmail(params: SendContractSignLinkParams): Promise<void> {
  const { host, port, user, pass, from } = getSmtpConfig()
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  const name = params.signatoryName?.trim()
  const greeting = name ? `Olá ${name},` : 'Olá,'
  const title = params.contractTitle.trim() || 'Documento'
  const text = `${greeting}\n\nSegue o link exclusivo para você assinar o documento "${title}":\n\n${params.signUrl}\n\nAo abrir o link, informe seu CPF e data de nascimento para liberar o campo de assinatura.\n\nAtenciosamente.`

  const html = `<p>${escapeHtml(greeting)}</p><p>Segue o link exclusivo para você assinar o documento <strong>${escapeHtml(title)}</strong>:</p><p><a href="${escapeAttr(params.signUrl)}">${escapeHtml(params.signUrl)}</a></p><p>Ao abrir o link, informe seu CPF e data de nascimento para liberar o campo de assinatura.</p><p>Atenciosamente.</p>`

  await transporter.sendMail({
    from,
    to: params.to.trim(),
    subject: `Assinatura: ${title}`,
    text,
    html,
  })
}
