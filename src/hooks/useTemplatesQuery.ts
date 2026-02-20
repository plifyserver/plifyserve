'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesService, type Template, type CreateTemplateInput, type UpdateTemplateInput } from '@/lib/services/templates'
import { activityLogService } from '@/lib/services/activityLog'
import { toast } from 'sonner'

export const TEMPLATES_QUERY_KEY = ['templates']

export function useTemplatesQuery() {
  const queryClient = useQueryClient()

  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: TEMPLATES_QUERY_KEY,
    queryFn: templatesService.list,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateTemplateInput) => templatesService.create(input),
    onSuccess: (newTemplate) => {
      queryClient.setQueryData<Template[]>(TEMPLATES_QUERY_KEY, (old) => 
        old ? [newTemplate, ...old] : [newTemplate]
      )
      activityLogService.logTemplateCreate(newTemplate.id, newTemplate.title)
      toast.success('Template criado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar template')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateInput }) => 
      templatesService.update(id, data),
    onSuccess: (updatedTemplate) => {
      queryClient.setQueryData<Template[]>(TEMPLATES_QUERY_KEY, (old) =>
        old?.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)) || []
      )
      toast.success('Template atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar template')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (template: Template) => {
      await templatesService.delete(template.id)
      return template
    },
    onSuccess: (deletedTemplate) => {
      queryClient.setQueryData<Template[]>(TEMPLATES_QUERY_KEY, (old) =>
        old?.filter((t) => t.id !== deletedTemplate.id) || []
      )
      activityLogService.logTemplateDelete(deletedTemplate.id, deletedTemplate.title)
      toast.success('Template excluído!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir template')
    },
  })

  return {
    templates,
    isLoading,
    error,
    refetch,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
