import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient
  protected tableName: string

  constructor(tableName: string) {
    this.supabase = createClient()
    this.tableName = tableName
  }

  async findAll(pagination?: PaginationParams): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 0
    const limit = pagination?.limit || 20
    const from = page * limit
    const to = from + limit - 1

    const { data, count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) throw error

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / limit)

    return {
      data: (data as T[]) || [],
      totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages - 1,
    }
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data as T
  }

  async create(entity: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(entity)
      .select()
      .single()

    if (error) throw error
    return data as T
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as T
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}
