import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib'
import { format } from 'date-fns'

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

  // Página de assinaturas (após o contrato, antes do certificado) — evita interferir nas cláusulas
  const signaturesPage = pdfDoc.addPage([595, 842])
  let sigY = signaturesPage.getHeight() - 50
  signaturesPage.drawText('REGISTRO DE ASSINATURAS', {
    x: 50,
    y: sigY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0.4, 0.6),
  })
  sigY -= 35
  const introLines = wrapText(
    font,
    'As assinaturas abaixo foram realizadas eletronicamente e não constam no corpo do documento para preservar a integridade das cláusulas.',
    9,
    495
  )
  const introLineHeight = 12
  for (const line of introLines) {
    signaturesPage.drawText(line, { x: 50, y: sigY, size: 9, font, color: rgb(0.3, 0.3, 0.3) })
    sigY -= introLineHeight
  }
  sigY -= 18

  if (signatures?.length) {
    let currentSignaturesPage = signaturesPage
    for (let idx = 0; idx < signatures.length; idx++) {
      const sig = signatures[idx]
      if (!sig.signed) continue
      let boxYFinal = sigY - 140
      if (boxYFinal < 50) {
        currentSignaturesPage = pdfDoc.addPage([595, 842])
        sigY = currentSignaturesPage.getHeight() - 50
        boxYFinal = sigY - 140
      }
      const page = currentSignaturesPage
      const y = sigY
      page.drawRectangle({
        x: 50,
        y: boxYFinal,
        width: 495,
        height: 140,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
      })
      page.drawText('PLIFY', {
        x: 55,
        y: y - 18,
        size: 10,
        font: boldFont,
        color: rgb(0, 0.4, 0.6),
      })
      page.drawText(`Nome: ${sig.name}`, { x: 55, y: y - 32, size: 9, font })
      if (sig.cpf) {
        const cpfFmt = sig.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        page.drawText(`CPF: ${cpfFmt}`, { x: 55, y: y - 46, size: 9, font })
      }
      if (sig.birth_date) {
        page.drawText(
          `Data de nascimento: ${format(new Date(sig.birth_date), 'dd/MM/yyyy')}`,
          { x: 55, y: y - 60, size: 9, font }
        )
      }
      if (sig.signed_at) {
        page.drawText(
          `Data e hora da assinatura: ${format(new Date(sig.signed_at), 'dd/MM/yyyy HH:mm:ss')}`,
          { x: 55, y: y - 74, size: 9, font }
        )
      }
      const localColor = rgb(0.4, 0.4, 0.4)
      const localFontSize = 8
      const localMaxWidth = 275
      const localLineHeight = 10
      const maxLocalLines = 3
      if (sig.location?.address) {
        const localLines = wrapText(font, `Local: ${sig.location.address}`, localFontSize, localMaxWidth).slice(0, maxLocalLines)
        let localY = y - 88
        for (const line of localLines) {
          page.drawText(line, { x: 55, y: localY, size: localFontSize, font, color: localColor })
          localY -= localLineHeight
        }
      } else if (sig.location?.latitude != null) {
        page.drawText(
          `Local: ${sig.location.latitude?.toFixed(6)}, ${sig.location.longitude?.toFixed(6)}`,
          { x: 55, y: y - 88, size: localFontSize, font, color: localColor }
        )
      }
      if (sig.signature_url) {
        try {
          const signatureImage = await fetch(sig.signature_url).then((res) => res.arrayBuffer())
          const image = await pdfDoc.embedPng(signatureImage)
          page.drawImage(image, {
            x: 340,
            y: boxYFinal + 30,
            width: 180,
            height: 80,
          })
        } catch {
          page.drawText('[Imagem da assinatura]', {
            x: 350,
            y: boxYFinal + 60,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.5),
          })
        }
      }
      sigY = boxYFinal - 25
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

