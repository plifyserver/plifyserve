/**
 * Mapeia status enviado pelo cliente para o valor aceito no Postgres.
 * FASE5: draft | sent | viewed | accepted
 * Legado (001_init): open | accepted | ignored — open equivale a enviada (sent).
 */
export function mapProposalStatusToDb(bodyStatus: string | undefined): string {
  if (!bodyStatus) return 'draft'
  switch (bodyStatus) {
    case 'accepted':
      return 'accepted'
    case 'sent':
      return 'sent'
    case 'viewed':
      return 'viewed'
    case 'draft':
      return 'draft'
    case 'ignored':
      return 'ignored'
    case 'open':
      return 'sent'
    default:
      return 'draft'
  }
}
