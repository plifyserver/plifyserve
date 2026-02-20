import { createClient } from '@/lib/supabase/client'

export interface Template {
  id: string
  user_id: string
  title: string
  description: string | null
  content: Record<string, unknown> | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface TemplateImage {
  id: string
  template_id: string
  image_url: string
  position: number
  created_at: string
}

export interface CreateTemplateInput {
  title: string
  description?: string
  content?: Record<string, unknown>
  is_public?: boolean
}

export interface UpdateTemplateInput {
  title?: string
  description?: string | null
  content?: Record<string, unknown> | null
  is_public?: boolean
}

const supabase = createClient()

export const templatesService = {
  async list(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async create(input: CreateTemplateInput): Promise<Template> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description || null,
        content: input.content || null,
        is_public: input.is_public || false,
      })
      .select()
      .single()

    if (error) throw error
    
    await supabase.rpc('increment_templates_count', { user_uuid: user.id })
    
    return data
  },

  async update(id: string, input: UpdateTemplateInput): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('template_images')
      .delete()
      .eq('template_id', id)

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    if (user) {
      await supabase.rpc('decrement_templates_count', { user_uuid: user.id })
    }
  },

  async getImages(templateId: string): Promise<TemplateImage[]> {
    const { data, error } = await supabase
      .from('template_images')
      .select('*')
      .eq('template_id', templateId)
      .order('position', { ascending: true })

    if (error) throw error
    return data || []
  },

  async addImage(templateId: string, imageUrl: string, position?: number): Promise<TemplateImage> {
    const { data, error } = await supabase
      .from('template_images')
      .insert({
        template_id: templateId,
        image_url: imageUrl,
        position: position ?? 0,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from('template_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
  },

  async uploadImage(file: File, templateId: string): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado')

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${templateId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('template-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('template-images')
      .getPublicUrl(fileName)

    return publicUrl
  },

  async deleteImage(imageUrl: string): Promise<void> {
    const path = imageUrl.split('/template-images/')[1]
    if (!path) return

    const { error } = await supabase.storage
      .from('template-images')
      .remove([path])

    if (error) console.error('Error deleting image from storage:', error)
  },
}
