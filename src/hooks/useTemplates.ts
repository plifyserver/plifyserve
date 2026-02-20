'use client'

import { useState, useEffect, useCallback } from 'react'
import { templatesService, type Template, type TemplateImage } from '@/lib/services/templates'
import { useAuth } from '@/contexts/AuthContext'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { canCreateTemplate, getTemplateLimit, profile, refreshProfile } = useAuth()

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await templatesService.list()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const createTemplate = async (title: string, description?: string) => {
    if (!canCreateTemplate()) {
      const limit = getTemplateLimit()
      throw new Error(`Você atingiu o limite de ${limit} templates do seu plano.`)
    }

    const template = await templatesService.create({ title, description })
    setTemplates((prev) => [template, ...prev])
    await refreshProfile()
    return template
  }

  const updateTemplate = async (id: string, data: Partial<Template>) => {
    const updated = await templatesService.update(id, data)
    setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)))
    return updated
  }

  const deleteTemplate = async (id: string) => {
    await templatesService.delete(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    await refreshProfile()
  }

  const templateLimit = getTemplateLimit()
  const templatesUsed = profile?.templates_count || 0
  const canCreate = canCreateTemplate()

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    templateLimit,
    templatesUsed,
    canCreate,
  }
}

export function useTemplate(id: string) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [images, setImages] = useState<TemplateImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [templateData, imagesData] = await Promise.all([
        templatesService.getById(id),
        templatesService.getImages(id),
      ])
      setTemplate(templateData)
      setImages(imagesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar template')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchTemplate()
  }, [id, fetchTemplate])

  const updateTemplate = async (data: Partial<Template>) => {
    const updated = await templatesService.update(id, data)
    setTemplate(updated)
    return updated
  }

  const addImage = async (file: File) => {
    const imageUrl = await templatesService.uploadImage(file, id)
    const image = await templatesService.addImage(id, imageUrl, images.length)
    setImages((prev) => [...prev, image])
    return image
  }

  const removeImage = async (imageId: string) => {
    const image = images.find((i) => i.id === imageId)
    if (image) {
      await templatesService.deleteImage(image.image_url)
    }
    await templatesService.removeImage(imageId)
    setImages((prev) => prev.filter((i) => i.id !== imageId))
  }

  return {
    template,
    images,
    loading,
    error,
    fetchTemplate,
    updateTemplate,
    addImage,
    removeImage,
  }
}
