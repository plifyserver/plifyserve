import { createClient } from '@/lib/supabase/client'

export type ActivityAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'template_create'
  | 'template_update'
  | 'template_delete'
  | 'image_upload'
  | 'image_delete'
  | 'upgrade_plan'
  | 'upgrade_socio'
  | 'profile_update'
  | 'contract_create'
  | 'contract_sign'
  | 'proposal_create'
  | 'proposal_publish'

export interface LogActivityParams {
  action: ActivityAction
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

const supabase = createClient()

export const activityLogService = {
  async log(params: LogActivityParams): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: params.action,
        resource_type: params.resourceType || null,
        resource_id: params.resourceId || null,
        metadata: params.metadata || {},
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  },

  async logLogin(): Promise<void> {
    await this.log({ action: 'login' })
  },

  async logLogout(): Promise<void> {
    await this.log({ action: 'logout' })
  },

  async logTemplateCreate(templateId: string, title: string): Promise<void> {
    await this.log({
      action: 'template_create',
      resourceType: 'template',
      resourceId: templateId,
      metadata: { title },
    })
  },

  async logTemplateDelete(templateId: string, title: string): Promise<void> {
    await this.log({
      action: 'template_delete',
      resourceType: 'template',
      resourceId: templateId,
      metadata: { title },
    })
  },

  async logImageUpload(templateId: string): Promise<void> {
    await this.log({
      action: 'image_upload',
      resourceType: 'template',
      resourceId: templateId,
    })
  },

  async logUpgradePlan(newPlan: string): Promise<void> {
    await this.log({
      action: 'upgrade_plan',
      metadata: { plan: newPlan },
    })
  },

  async logUpgradeSocio(): Promise<void> {
    await this.log({ action: 'upgrade_socio' })
  },
}
