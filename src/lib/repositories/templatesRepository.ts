import { BaseRepository, type PaginationParams, type PaginatedResult } from './baseRepository'
import type { Template, TemplateImage } from '@/lib/services/templates'

export class TemplatesRepository extends BaseRepository<Template> {
  constructor() {
    super('templates')
  }

  async findByUserId(userId: string, pagination?: PaginationParams): Promise<PaginatedResult<Template>> {
    const page = pagination?.page || 0
    const limit = pagination?.limit || 20
    const from = page * limit
    const to = from + limit - 1

    const { data, count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: (data as Template[]) || [],
      totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages - 1,
    }
  }

  async findPublic(pagination?: PaginationParams): Promise<PaginatedResult<Template>> {
    const page = pagination?.page || 0
    const limit = pagination?.limit || 20
    const from = page * limit
    const to = from + limit - 1

    const { data, count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: (data as Template[]) || [],
      totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages - 1,
    }
  }

  async search(query: string, pagination?: PaginationParams): Promise<PaginatedResult<Template>> {
    const page = pagination?.page || 0
    const limit = pagination?.limit || 20
    const from = page * limit
    const to = from + limit - 1

    const { data, count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .ilike('title', `%${query}%`)
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: (data as Template[]) || [],
      totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages - 1,
    }
  }

  async getImages(templateId: string): Promise<TemplateImage[]> {
    const { data, error } = await this.supabase
      .from('template_images')
      .select('*')
      .eq('template_id', templateId)
      .order('position', { ascending: true })

    if (error) throw error
    return (data as TemplateImage[]) || []
  }

  async addImage(templateId: string, imageUrl: string, position: number): Promise<TemplateImage> {
    const { data, error } = await this.supabase
      .from('template_images')
      .insert({
        template_id: templateId,
        image_url: imageUrl,
        position,
      })
      .select()
      .single()

    if (error) throw error
    return data as TemplateImage
  }

  async removeImage(imageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('template_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
  }
}

export const templatesRepository = new TemplatesRepository()
