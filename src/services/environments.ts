import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, type Environment } from '@/lib/tauri-bindings'

// Query keys for environments
export const environmentsQueryKeys = {
  all: ['environments'] as const,
  environments: () => [...environmentsQueryKeys.all] as const,
  byProject: (projectId: string) =>
    [...environmentsQueryKeys.all, 'project', projectId] as const,
}

// TanStack Query hooks following the architectural patterns
export function useEnvironments() {
  return useQuery({
    queryKey: environmentsQueryKeys.environments(),
    queryFn: async (): Promise<Environment[]> => {
      logger.debug('Loading environments from backend')
      const result = await commands.loadEnvironments()

      if (result.status === 'error') {
        logger.error('Failed to load environments', { error: result.error })
        toast.error('Failed to load environments', { description: result.error })
        throw new Error(result.error)
      }

      logger.info('Environments loaded successfully', {
        count: result.data.length,
      })
      return result.data
    },
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
  })
}

export function useEnvironmentsByProject(projectId: string) {
  const { data: allEnvironments } = useEnvironments()

  return {
    data: allEnvironments?.filter((env) => env.project_id === projectId) ?? [],
    isLoading: !allEnvironments,
  }
}

export function useSaveEnvironments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (environments: Environment[]) => {
      logger.debug('Saving environments to backend', {
        count: environments.length,
      })
      const result = await commands.saveEnvironments(environments)

      if (result.status === 'error') {
        logger.error('Failed to save environments', {
          error: result.error,
          count: environments.length,
        })
        toast.error('Failed to save environments', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Environments saved successfully', {
        count: environments.length,
      })
    },
    onSuccess: (_, environments) => {
      // Update the cache with the new environments
      queryClient.setQueryData(
        environmentsQueryKeys.environments(),
        environments
      )
      // Invalidate project-specific queries
      const projectIds = new Set(environments.map((e) => e.project_id))
      projectIds.forEach((projectId) => {
        queryClient.invalidateQueries({
          queryKey: environmentsQueryKeys.byProject(projectId),
        })
      })
      logger.info('Environments cache updated')
      toast.success('Environments saved')
    },
  })
}

