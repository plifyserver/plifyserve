/**
 * Textos curtos dos planos (landing, /planos, checkout metadata, modal).
 * Manter alinhado ao que o código realmente libera (ex.: integrações de agenda = Pro).
 */

export const PLAN_TAGLINE = {
  essential: 'O essencial para organizar vendas e rotina.',
  pro: 'Sem limites de uso + sua marca + agenda no Google e no celular.',
} as const

/** Bullets dos cards — poucas linhas, fáceis de comparar. */
export const PLAN_BULLETS_ESSENTIAL: string[] = [
  'Até 20 clientes · 5 propostas e 5 contratos por mês',
  '1 modelo de proposta · até 10 templates salvos',
  'Agenda só dentro do Plify (sem Google Calendar nem link no telemóvel)',
  'Até 5 Kanbans e 5 mapas mentais',
  'Projetos, tarefas, gastos, calculadora e Chat IA',
  'Dashboard padrão · suporte por e-mail',
]

export const PLAN_BULLETS_PRO: string[] = [
  'Ilimitado: clientes, propostas, contratos, Kanbans, mapas e templates salvos',
  '4 modelos de proposta · dashboard com suas cores e logo (white label)',
  'Agenda: Google Calendar + integração rápida no iPhone e Android',
  'Gestão de Ads (tráfego) e métricas',
  'Suporte por WhatsApp',
]

/** Lista para `PLANS.features` (checkout, APIs que exponham o plano). */
export const PLAN_FEATURES_ESSENTIAL: string[] = [
  '1 usuário',
  ...PLAN_BULLETS_ESSENTIAL,
]

export const PLAN_FEATURES_PRO: string[] = ['Até 5 usuários', ...PLAN_BULLETS_PRO]

/** Linhas da tabela comparativa (dashboard) — só o que diferencia. */
export const PLAN_COMPARISON_ROWS: {
  feature: string
  essential: string | 'check' | 'dash'
  pro: string | 'check' | 'dash'
}[] = [
  { feature: 'Preço', essential: 'R$ 49,90 / mês', pro: 'R$ 89,90 / mês' },
  { feature: 'Clientes', essential: 'Até 20', pro: 'Ilimitados' },
  { feature: 'Propostas e contratos / mês', essential: '5 e 5', pro: 'Ilimitados' },
  { feature: 'Modelos de proposta', essential: '1', pro: '4' },
  { feature: 'Templates salvos (seus)', essential: 'Até 10', pro: 'Ilimitados' },
  { feature: 'Dashboard', essential: 'Padrão', pro: 'Cores e logo' },
  { feature: 'Agenda no Plify', essential: 'check', pro: 'check' },
  { feature: 'Google Calendar + calendário no celular', essential: 'dash', pro: 'check' },
  { feature: 'Kanban', essential: 'Até 5 quadros', pro: 'Ilimitado' },
  { feature: 'Mapas mentais', essential: 'Até 5', pro: 'Ilimitados' },
  { feature: 'Ads (tráfego)', essential: 'dash', pro: 'check' },
  { feature: 'Suporte', essential: 'E-mail', pro: 'WhatsApp' },
]
