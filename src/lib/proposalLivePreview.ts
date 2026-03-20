/** Prefixo do BroadcastChannel para sincronizar editor (SaaS) ↔ aba de visualização do cliente. */
export const PROPOSAL_LIVE_PREVIEW_PREFIX = 'plify-proposal-live-'

export function proposalLivePreviewChannelName(sid: string): string {
  return `${PROPOSAL_LIVE_PREVIEW_PREFIX}${sid}`
}

/** Snapshot inicial antes de abrir a aba — evita perda de mensagem no BroadcastChannel (ele não fila). */
export function proposalLivePreviewBootstrapKey(sid: string): string {
  return `${PROPOSAL_LIVE_PREVIEW_PREFIX}bootstrap-${sid}`
}

export function writeProposalLivePreviewBootstrap(sid: string, proposalData: unknown): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(proposalLivePreviewBootstrapKey(sid), JSON.stringify(proposalData))
  } catch {
    // quota / modo privado
  }
}

/** Lê snapshot gravado antes de abrir a aba (não remove — compatível com Strict Mode e reabrir). */
export function readProposalLivePreviewBootstrap(sid: string): unknown | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(proposalLivePreviewBootstrapKey(sid))
    if (raw == null) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export type ProposalLivePreviewMessage = {
  type: 'data'
  payload: unknown
}

export function isValidLivePreviewSid(s: string | null): s is string {
  return !!s && /^[a-zA-Z0-9_-]{8,128}$/.test(s)
}
