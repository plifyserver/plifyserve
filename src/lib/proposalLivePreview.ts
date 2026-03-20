/** Prefixo do BroadcastChannel para sincronizar editor (SaaS) ↔ aba de visualização do cliente. */
export const PROPOSAL_LIVE_PREVIEW_PREFIX = 'plify-proposal-live-'

export function proposalLivePreviewChannelName(sid: string): string {
  return `${PROPOSAL_LIVE_PREVIEW_PREFIX}${sid}`
}

export type ProposalLivePreviewMessage = {
  type: 'data'
  payload: unknown
}

export function isValidLivePreviewSid(s: string | null): s is string {
  return !!s && /^[a-zA-Z0-9_-]{8,128}$/.test(s)
}
