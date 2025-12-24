import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, type Project } from '@/lib/tauri-bindings'

// Query keys for projects
export const projectsQueryKeys = {
  all: ['projects'] as const,
  projects: () => [...projectsQueryKeys.all] as const,
}

// TanStack Query hooks following the architectural patterns
export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKeys.projects(),
    queryFn: async (): Promise<Project[]> => {
      logger.debug('Loading projects from backend')
      const result = await commands.loadProjects()

      if (result.status === 'error') {
        logger.error('Failed to load projects', { error: result.error })
        toast.error('Failed to load projects', { description: result.error })
        throw new Error(result.error)
      }

      logger.info('Projects loaded successfully', {
        count: result.data.length,
      })
      return result.data
    },
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
  })
}

export function useSaveProjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projects: Project[]) => {
      logger.debug('Saving projects to backend', { count: projects.length })
      const result = await commands.saveProjects(projects)

      if (result.status === 'error') {
        logger.error('Failed to save projects', {
          error: result.error,
          count: projects.length,
        })
        toast.error('Failed to save projects', { description: result.error })
        throw new Error(result.error)
      }

      logger.info('Projects saved successfully', { count: projects.length })
    },
    onSuccess: (_, projects) => {
      // Update the cache with the new projects
      queryClient.setQueryData(projectsQueryKeys.projects(), projects)
      logger.info('Projects cache updated')
      toast.success('Projects saved')
    },
  })
}
