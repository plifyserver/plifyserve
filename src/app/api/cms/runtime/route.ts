import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const svc = createServiceRoleClient()
  // Alguns ambientes podem estar com migrations atrasadas; fazemos fallback
  // para evitar quebrar o app inteiro.
  const full = await svc
    .from('cms_runtime_settings')
    .select(
      'active_version, feedback_button_enabled, profile_cms_version, settings_cms_version, sidebar_style, payments_enabled, updated_at'
    )
    .eq('id', 1)
    .maybeSingle()

  let data = full.data as
    | {
        active_version?: string
        feedback_button_enabled?: boolean
        profile_cms_version?: string
        settings_cms_version?: string
        sidebar_style?: string
        payments_enabled?: boolean
        updated_at?: string
      }
    | null

  if (full.error) {
    const msg = full.error.message || ''
    const looksLikeMissingColumn =
      msg.includes('column') ||
      msg.includes('payments_enabled') ||
      msg.includes('sidebar_style') ||
      msg.includes('settings_cms_version') ||
      msg.includes('profile_cms_version')

    if (!looksLikeMissingColumn) {
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const legacy = await svc
      .from('cms_runtime_settings')
      .select('active_version, feedback_button_enabled, profile_cms_version, settings_cms_version, updated_at')
      .eq('id', 1)
      .maybeSingle()

    if (legacy.error) {
      return NextResponse.json({ error: legacy.error.message }, { status: 500 })
    }
    data = legacy.data as typeof data
  }

  const activeVersion = data?.active_version === 'v2' ? 'v2' : 'v1'
  const feedbackButtonEnabled = data?.feedback_button_enabled === true
  const profileCmsVersion = data?.profile_cms_version === 'v2' ? 'v2' : 'v1'
  const settingsCmsVersion = data?.settings_cms_version === 'v2' ? 'v2' : 'v1'
  const sidebarStyle = data?.sidebar_style === 'clean' ? 'clean' : 'default'
  const paymentsEnabled = data?.payments_enabled === true
  return NextResponse.json({
    activeVersion,
    feedbackButtonEnabled,
    profileCmsVersion,
    settingsCmsVersion,
    sidebarStyle,
    paymentsEnabled,
    updatedAt: data?.updated_at ?? null,
  })
}

