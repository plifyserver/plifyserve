import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage } from 'pdf-lib'
import { format } from 'date-fns'
import { LOGO_PRETO } from '@/lib/logo'

/** URL absoluta da logo em /public (cliente ou servidor). */
function resolvePlifyLogoUrl(): string | null {
  if (typeof window !== 'undefined') {
    return new URL(LOGO_PRETO, window.location.origin).href
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
  return base ? `${base}${LOGO_PRETO}` : null
}

/** Logo Plify para carimbar no relatório (PNG/JPG em /public). */
async function embedPlifyLogo(pdfDoc: PDFDocument): Promise<{ image: PDFImage; width: number; height: number } | null> {
  const url = resolvePlifyLogoUrl()
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const bytes = await res.arrayBuffer()
    let image: PDFImage
    try {
      image = await pdfDoc.embedPng(bytes)
    } catch {
      try {
        image = await pdfDoc.embedJpg(bytes)
      } catch {
        return null
      }
    }
    const maxW = 88
    const w = Math.min(maxW, image.width)
    const h = image.height * (w / image.width)
    return { image, width: w, height: h }
  } catch {
    return null
  }
}

/** Quebra texto em linhas que cabem na largura máxima (em pontos). */
function wrapText(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = []
  const words = text.trim().split(/\s+/)
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    const w = font.widthOfTextAtSize(candidate, fontSize)
    if (w <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = font.widthOfTextAtSize(word, fontSize) <= maxWidth ? word : ''
      if (!current && word) {
        let chunk = ''
        for (const c of word) {
          if (font.widthOfTextAtSize(chunk + c, fontSize) <= maxWidth) chunk += c
          else {
            if (chunk) lines.push(chunk)
            chunk = c
          }
        }
        current = chunk
      }
    }
  }
  if (current) lines.push(current)
  return lines
}

export interface ContractForPDF {
  id: string
  title: string
  file_url: string | null
  status: string
  created_at: string
  sent_at?: string | null
  signed_at?: string | null
}

export interface SignatoryForPDF {
  name: string
  email: string
  signed: boolean
  signed_at?: string | null
  signature_url?: string | null
  selfie_url?: string | null
  signature_placement?: {
    pageIndex: number
    x: number
    y: number
    w: number
    h: number
  } | null
  cpf?: string | null
  birth_date?: string | null
  location?: { latitude: number | null; longitude: number | null; address: string | null } | null
  ip_address?: string
  browser?: string
}

async function generateHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return hashHex.substring(0, 32)
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
    if ((i + 1) % 4 === 0 && i < 15) code += '-'
  }
  return code
}

export async function generateSignedPDF(
  contract: ContractForPDF,
  signatures: SignatoryForPDF[]
): Promise<Uint8Array> {
  if (!contract.file_url) {
    throw new Error('Contrato sem URL de arquivo PDF.')
  }
  const existingPdfBytes = await fetch(contract.file_url).then((res) => res.arrayBuffer())
  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const documentHash = await generateHash(existingPdfBytes)
  const verificationCode = generateVerificationCode()

  /* Assinaturas posicionadas no corpo do PDF */
  for (const sig of signatures) {
    if (!sig.signed || !sig.signature_url || !sig.signature_placement) continue
    const pl = sig.signature_placement
    const idx = Math.max(0, Math.min(pl.pageIndex, pages.length - 1))
    const page = pages[idx]
    const { width: pw, height: ph } = page.getSize()
    try {
      const bytes = await fetch(sig.signature_url).then((res) => res.arrayBuffer())
      const image = await pdfDoc.embedPng(bytes)
      const pdfX = pl.x * pw
      const pdfY = (1 - pl.y - pl.h) * ph
      const pdfW = pl.w * pw
      const pdfH = pl.h * ph
      page.drawImage(image, { x: pdfX, y: pdfY, width: pdfW, height: pdfH })
    } catch {
      /* ignora */
    }
  }

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width } = page.getSize()
    page.drawText(`Documento verificável | Código: ${verificationCode}`, {
      x: 50,
      y: 20,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
    page.drawText(`Página ${i + 1} de ${pages.length}`, {
      x: width - 100,
      y: 20,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  /* Página de relatório de assinaturas (estilo relatório completo, organizado) */
  const reportNow = format(new Date(), 'dd/MM/yyyy HH:mm:ss')
  const signedTotal = signatures.filter((s) => s.signed).length
  const plifyLogo = await embedPlifyLogo(pdfDoc)

  let currentReportPage = pdfDoc.addPage([595, 842])
  let sigY = currentReportPage.getHeight() - 48
  const pageW = currentReportPage.getWidth()
  const rightMargin = 50

  currentReportPage.drawText('Relatório de Assinaturas', {
    x: 50,
    y: sigY,
    size: 17,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.12),
  })
  if (plifyLogo) {
    const { image, width: lw, height: lh } = plifyLogo
    const lx = pageW - rightMargin - lw
    const lineCenterY = sigY + 7
    const ly = lineCenterY - lh / 2
    currentReportPage.drawImage(image, { x: lx, y: ly, width: lw, height: lh })
  } else {
    currentReportPage.drawText('PLIFY', {
      x: pageW - rightMargin - boldFont.widthOfTextAtSize('PLIFY', 13),
      y: sigY,
      size: 13,
      font: boldFont,
      color: rgb(0.12, 0.12, 0.12),
    })
  }
  sigY -= 20
  currentReportPage.drawText(`Horário local | Emitido em ${reportNow}`, {
    x: 50,
    y: sigY,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  })
  sigY -= 14
  currentReportPage.drawRectangle({
    x: 50,
    y: sigY - 1,
    width: 495,
    height: 0.6,
    color: rgb(0.88, 0.88, 0.88),
  })
  sigY -= 20

  currentReportPage.drawText(`Status: ${contract.status === 'signed' ? 'Assinado' : 'Em andamento'}`, {
    x: 50,
    y: sigY,
    size: 9,
    font: boldFont,
  })
  sigY -= 14
  const docTitle = wrapText(font, `Documento: ${contract.title}`, 9, 420)
  for (const line of docTitle.slice(0, 2)) {
    currentReportPage.drawText(line, { x: 50, y: sigY, size: 9, font })
    sigY -= 12
  }
  currentReportPage.drawText(`Codigo unico: ${contract.id}`, { x: 50, y: sigY, size: 8, font, color: rgb(0.35, 0.35, 0.35) })
  sigY -= 12
  currentReportPage.drawText(
    `Data da criacao: ${format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm:ss')}`,
    { x: 50, y: sigY, size: 8, font, color: rgb(0.35, 0.35, 0.35) }
  )
  sigY -= 12
  const hashLine = `Hash SHA-256 (original): ${documentHash}`
  for (const line of wrapText(font, hashLine, 7, 490).slice(0, 3)) {
    currentReportPage.drawText(line, { x: 50, y: sigY, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
    sigY -= 10
  }
  currentReportPage.drawText(`Codigo de verificacao: ${verificationCode}`, {
    x: 50,
    y: sigY,
    size: 8,
    font,
    color: rgb(0.2, 0.2, 0.2),
  })
  sigY -= 22
  currentReportPage.drawRectangle({
    x: 50,
    y: sigY - 1,
    width: 495,
    height: 0.6,
    color: rgb(0.88, 0.88, 0.88),
  })
  sigY -= 16
  currentReportPage.drawText(`Assinaturas (${signedTotal})`, {
    x: 50,
    y: sigY,
    size: 12,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.12),
  })
  sigY -= 22

  const blockH = 210
  if (signatures?.length) {
    for (let idx = 0; idx < signatures.length; idx++) {
      const sig = signatures[idx]
      if (!sig.signed) continue
      let boxYFinal = sigY - blockH
      if (boxYFinal < 55) {
        currentReportPage = pdfDoc.addPage([595, 842])
        sigY = currentReportPage.getHeight() - 50
        boxYFinal = sigY - blockH
      }
      const page = currentReportPage
      const y = sigY
      page.drawRectangle({
        x: 50,
        y: boxYFinal,
        width: 495,
        height: blockH,
        borderColor: rgb(0.86, 0.86, 0.86),
        borderWidth: 0.6,
      })
      let ty = y - 16
      page.drawText('Assinado via Plify', {
        x: 58,
        y: ty,
        size: 7,
        font: boldFont,
        color: rgb(0.1, 0.45, 0.25),
      })
      ty -= 14
      page.drawText(sig.name.toUpperCase(), {
        x: 58,
        y: ty,
        size: 10,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      })
      ty -= 14
      page.drawText(`E-mail: ${sig.email}`, { x: 58, y: ty, size: 8, font, color: rgb(0.25, 0.25, 0.25) })
      ty -= 12
      if (sig.cpf) {
        const cpfFmt = sig.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        page.drawText(`CPF: ${cpfFmt}`, { x: 58, y: ty, size: 8, font })
        ty -= 12
      }
      if (sig.birth_date) {
        page.drawText(`Data de nascimento: ${format(new Date(sig.birth_date), 'dd/MM/yyyy')}`, {
          x: 58,
          y: ty,
          size: 8,
          font,
        })
        ty -= 12
      }
      if (sig.signed_at) {
        page.drawText(
          `Data e hora da assinatura: ${format(new Date(sig.signed_at), 'dd/MM/yyyy HH:mm:ss')}`,
          { x: 58, y: ty, size: 8, font }
        )
        ty -= 12
      }
      page.drawText('Pontos de autenticacao:', { x: 58, y: ty, size: 8, font: boldFont, color: rgb(0.3, 0.3, 0.3) })
      ty -= 12
      page.drawText('E-mail do signatario verificado no fluxo de assinatura', {
        x: 58,
        y: ty,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      })
      ty -= 14
      if (sig.ip_address) {
        page.drawText(`IP: ${sig.ip_address}`, { x: 58, y: ty, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
        ty -= 12
      }
      const ua = sig.browser || ''
      if (ua) {
        for (const line of wrapText(font, `Dispositivo: ${ua}`, 6, 240).slice(0, 3)) {
          page.drawText(line, { x: 58, y: ty, size: 6, font, color: rgb(0.45, 0.45, 0.45) })
          ty -= 9
        }
      }
      const localColor = rgb(0.4, 0.4, 0.4)
      if (sig.location?.address) {
        for (const line of wrapText(font, `Local: ${sig.location.address}`, 7, 240).slice(0, 2)) {
          page.drawText(line, { x: 58, y: ty, size: 7, font, color: localColor })
          ty -= 10
        }
      } else if (sig.location?.latitude != null) {
        page.drawText(
          `Local (aprox.): ${sig.location.latitude?.toFixed(5)}, ${sig.location.longitude?.toFixed(5)}`,
          { x: 58, y: ty, size: 7, font, color: localColor }
        )
        ty -= 10
      }
      if (sig.signature_url) {
        try {
          const signatureImage = await fetch(sig.signature_url).then((res) => res.arrayBuffer())
          const image = await pdfDoc.embedPng(signatureImage)
          page.drawImage(image, {
            x: 330,
            y: boxYFinal + 95,
            width: 200,
            height: 72,
          })
        } catch {
          page.drawText('[Assinatura]', {
            x: 340,
            y: boxYFinal + 120,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
          })
        }
      }
      if (sig.selfie_url) {
        try {
          const selfieBytes = await fetch(sig.selfie_url).then((res) => res.arrayBuffer())
          const url = sig.selfie_url.trim()
          const isJpg =
            url.startsWith('data:image/jpeg') ||
            url.startsWith('data:image/jpg') ||
            url.toLowerCase().endsWith('.jpg') ||
            url.toLowerCase().endsWith('.jpeg')
          const selfieImg = isJpg ? await pdfDoc.embedJpg(selfieBytes) : await pdfDoc.embedPng(selfieBytes)
          page.drawImage(selfieImg, {
            x: 330,
            y: boxYFinal + 12,
            width: 200,
            height: 78,
          })
          page.drawText('Selfie', { x: 330, y: boxYFinal + 8, size: 7, font, color: rgb(0.4, 0.4, 0.4) })
        } catch {
          page.drawText('[Selfie]', {
            x: 340,
            y: boxYFinal + 40,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
          })
        }
      }
      sigY = boxYFinal - 18
    }
  }

  const certPage = pdfDoc.addPage([595, 842])
  const certWidth = certPage.getWidth()
  let yPos = certPage.getHeight() - 60

  certPage.drawText('CERTIFICADO DE AUTENTICIDADE E VALIDADE JURÍDICA', {
    x: 50,
    y: yPos,
    size: 16,
    font: boldFont,
    color: rgb(0, 0.4, 0.6),
  })
  yPos -= 40

  certPage.drawText('1. INFORMAÇÕES DO DOCUMENTO', {
    x: 50,
    y: yPos,
    size: 12,
    font: boldFont,
  })
  yPos -= 25

  const docInfo = [
    `Nome: ${contract.title}`,
    `Código Único: ${contract.id}`,
    `Data de Criação: ${format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm:ss')}`,
    `Hash SHA-256: ${documentHash}`,
    `Código de Verificação: ${verificationCode}`,
    `Status: ${contract.status === 'signed' ? 'Assinado' : 'Em andamento'}`,
  ]
  for (const info of docInfo) {
    certPage.drawText(info, { x: 60, y: yPos, size: 9, font })
    yPos -= 15
  }
  yPos -= 20

  certPage.drawText('2. SIGNATÁRIOS E ASSINATURAS', {
    x: 50,
    y: yPos,
    size: 12,
    font: boldFont,
  })
  yPos -= 25

  if (signatures?.length) {
    for (let idx = 0; idx < signatures.length; idx++) {
      const sig = signatures[idx]
      certPage.drawText(`Signatário ${idx + 1}:`, { x: 60, y: yPos, size: 10, font: boldFont })
      yPos -= 15
      const sigInfo = [
        `  Nome: ${sig.name}`,
        `  Email: ${sig.email}`,
        `  Status: ${sig.signed ? 'Assinado' : 'Pendente'}`,
        `  Data/Hora: ${sig.signed_at ? format(new Date(sig.signed_at), 'dd/MM/yyyy HH:mm:ss') : 'Pendente'}`,
        '  Tipo de Assinatura: Eletrônica Simples',
        '  Método de Autenticação: Email verificado',
        `  IP: ${sig.ip_address || 'Não registrado'}`,
        `  Navegador: ${sig.browser || 'Não registrado'}`,
      ]
      for (const info of sigInfo) {
        certPage.drawText(info, { x: 60, y: yPos, size: 8, font })
        yPos -= 12
      }
      yPos -= 10
    }
  }
  yPos -= 10

  certPage.drawText('3. LOG DE AUDITORIA', {
    x: 50,
    y: yPos,
    size: 12,
    font: boldFont,
  })
  yPos -= 25

  const auditLog = [
    `${format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm')} - Documento criado`,
    `${contract.sent_at ? format(new Date(contract.sent_at), 'dd/MM/yyyy HH:mm') : 'Pendente'} - Enviado para assinatura`,
    `${contract.signed_at ? format(new Date(contract.signed_at), 'dd/MM/yyyy HH:mm') : 'Pendente'} - Todas as assinaturas concluídas`,
  ]
  for (const log of auditLog) {
    certPage.drawText(log, { x: 60, y: yPos, size: 9, font })
    yPos -= 15
  }
  yPos -= 20

  certPage.drawText('4. VALIDADE JURÍDICA', {
    x: 50,
    y: yPos,
    size: 12,
    font: boldFont,
  })
  yPos -= 25

  const legalInfo = [
    'Este documento foi assinado eletronicamente de acordo com:',
    '',
    '• Medida Provisória nº 2.200-2/2001 - ICP-Brasil',
    '• Lei nº 14.063/2020 - Assinaturas eletrônicas',
    '',
    'Tipo: Eletrônica Simples. Código de verificação: ' + verificationCode,
  ]
  for (const info of legalInfo) {
    certPage.drawText(info, { x: 60, y: yPos, size: 8, font })
    yPos -= 12
  }

  certPage.drawText(`Documento gerado pela plataforma. Emissão: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, {
    x: 50,
    y: 40,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  // Cria um ArrayBuffer REAL (não ArrayBufferLike)
  const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength)
  const view = new Uint8Array(arrayBuffer)
  view.set(pdfBytes)

  const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

