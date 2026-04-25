/**
 * Menu lateral quando CMS Configurações está em v2: ordem e visibilidade por utilizador.
 * Planos e Personalização não entram no sidebar neste modo (ficam em guias em Configurações).
 * Com CMS v1, Personalização continua no menu estático em `dashboard/layout.tsx`.
 */

export type DashboardNavEntry = {
  href: string
  enabled: boolean
}

/** Itens que podem aparecer no menu (sem Planos). */
export const DASHBOARD_NAV_SIDEBAR_ORDER: { href: string; label: string; requiresPro?: boolean }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/clientes', label: 'Clientes' },
  { href: '/dashboard/propostas', label: 'Propostas' },
  { href: '/dashboard/documentos', label: 'Contratos' },
  { href: '/dashboard/projetos', label: 'Projetos' },
  { href: '/dashboard/agenda', label: 'Agenda' },
  { href: '/dashboard/chat-ia', label: 'Chat IA' },
  { href: '/dashboard/mapa-mental', label: 'Mapa Mental' },
  { href: '/dashboard/ads', label: 'Ads', requiresPro: true },
  { href: '/dashboard/financeiro', label: 'Gastos Pessoais' },
  { href: '/dashboard/calculadora', label: 'Calculadora' },
  { href: '/dashboard/kanban', label: 'Kanban' },
  { href: '/dashboard/pagamentos', label: 'Pagamentos' },
  { href: '/dashboard/configuracoes', label: 'Configurações' },
]

const ALLOWED_HREFS = new Set(DASHBOARD_NAV_SIDEBAR_ORDER.map((x) => x.href))

const LOCKED_ON_HREFS = new Set(['/dashboard', '/dashboard/configuracoes'])

export function isDashboardNavHrefLocked(href: string): boolean {
  return LOCKED_ON_HREFS.has(href)
}

export function defaultDashboardNavConfig(): DashboardNavEntry[] {
  return DASHBOARD_NAV_SIDEBAR_ORDER.map(({ href }) => ({
    href,
    enabled: true,
  }))
}

function metaFor(href: string) {
  return DASHBOARD_NAV_SIDEBAR_ORDER.find((x) => x.href === href)
}

/** Valida e normaliza JSON guardado no perfil. */
export function parseDashboardNavConfig(raw: unknown): DashboardNavEntry[] | null {
  if (raw == null) return null
  if (!Array.isArray(raw)) return null
  const entries: DashboardNavEntry[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null
    const href = (row as { href?: unknown }).href
    const enabled = (row as { enabled?: unknown }).enabled
    if (typeof href !== 'string' || !ALLOWED_HREFS.has(href)) return null
    if (typeof enabled !== 'boolean') return null
    entries.push({ href, enabled })
  }
  const seen = new Set<string>()
  for (const e of entries) {
    if (seen.has(e.href)) return null
    seen.add(e.href)
  }
  if (seen.size !== ALLOWED_HREFS.size) return null
  for (const h of LOCKED_ON_HREFS) {
    const row = entries.find((e) => e.href === h)
    if (!row || !row.enabled) return null
  }
  return entries
}

export function mergeDashboardNavConfig(
  raw: unknown,
  isPro: boolean
): DashboardNavEntry[] {
  const parsed = parseDashboardNavConfig(raw)
  const base = parsed ?? defaultDashboardNavConfig()
  return base.map((e) => {
    const m = metaFor(e.href)
    if (m?.requiresPro && !isPro) {
      return { ...e, enabled: false }
    }
    return e
  })
}

export type ResolvedNavItem = {
  href: string
  label: string
}

/** Lista final para o sidebar (CMS v2): só entradas ativas e permitidas ao plano. */
export function resolveSidebarNavItems(
  entries: DashboardNavEntry[],
  isPro: boolean
): ResolvedNavItem[] {
  const out: ResolvedNavItem[] = []
  for (const e of entries) {
    if (!e.enabled) continue
    const m = metaFor(e.href)
    if (!m) continue
    if (m.requiresPro && !isPro) continue
    out.push({ href: e.href, label: m.label })
  }
  return out
}
