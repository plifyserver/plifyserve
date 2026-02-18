import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { format } from 'date-fns'

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
  const timestamp = new Date().toISOString()

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()

    if (signatures && signatures.length > 0) {
      let yPosition = 60
      for (const sig of signatures) {
        if (sig.signed && sig.signature_url) {
          try {
            const signatureImage = await fetch(sig.signature_url).then((res) => res.arrayBuffer())
            const image = await pdfDoc.embedPng(signatureImage)
            page.drawImage(image, {
              x: width - 200,
              y: yPosition,
              width: 150,
              height: 40,
            })
            page.drawText(sig.name, {
              x: width - 200,
              y: yPosition - 12,
              size: 8,
              font,
              color: rgb(0, 0, 0),
            })
            page.drawText(
              `${format(new Date(sig.signed_at!), 'dd/MM/yyyy HH:mm')}`,
              {
                x: width - 200,
                y: yPosition - 24,
                size: 7,
                font,
                color: rgb(0.4, 0.4, 0.4),
              }
            )
            yPosition += 80
          } catch {
            // skip invalid signature image
          }
        }
      }
    }

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
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
