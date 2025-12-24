import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, type Mapping } from '@/lib/tauri-bindings'

// Query keys for mappings
export const mappingsQueryKeys = {
  all: ['mappings'] as const,
  mappings: () => [...mappingsQueryKeys.all] as const,
  byProject: (projectId: string) =>
    [...mappingsQueryKeys.all, 'project', projectId] as const,
  byEnvironment: (environmentId: string) =>
    [...mappingsQueryKeys.all, 'environment', environmentId] as const,
}

// TanStack Query hooks following the architectural patterns
export function useMappings() {
  return useQuery({
    queryKey: mappingsQueryKeys.mappings(),
    queryFn: async (): Promise<Mapping[]> => {
      logger.debug('Loading mappings from backend')
      const result = await commands.loadMappings()

      if (result.status === 'error') {
        logger.error('Failed to load mappings', { error: result.error })
        toast.error('Failed to load mappings', { description: result.error })
        throw new Error(result.error)
      }

      logger.info('Mappings loaded successfully', {
        count: result.data.length,
      })
      return result.data
    },
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
  })
}

export function useMappingsByProject(projectId: string) {
  const { data: allMappings } = useMappings()

  return {
    data:
      allMappings?.filter((mapping) => mapping.project_id === projectId) ?? [],
    isLoading: !allMappings,
  }
}

export function useMappingsByEnvironment(environmentId: string) {
  const { data: allMappings } = useMappings()

  return {
    data:
      allMappings?.filter(
        (mapping) => mapping.environment_id === environmentId
      ) ?? [],
    isLoading: !allMappings,
  }
}

export function useSaveMappings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mappings: Mapping[]) => {
      logger.debug('Saving mappings to backend', { count: mappings.length })
      const result = await commands.saveMappings(mappings)

      if (result.status === 'error') {
        logger.error('Failed to save mappings', {
          error: result.error,
          count: mappings.length,
        })
        toast.error('Failed to save mappings', { description: result.error })
        throw new Error(result.error)
      }

      logger.info('Mappings saved successfully', { count: mappings.length })
    },
    onSuccess: (_, mappings) => {
      // Update the cache with the new mappings
      queryClient.setQueryData(mappingsQueryKeys.mappings(), mappings)
      // Invalidate project and environment-specific queries
      const projectIds = new Set(
        mappings.map((m) => m.project_id).filter((id): id is string => !!id)
      )
      const environmentIds = new Set(
        mappings
          .map((m) => m.environment_id)
          .filter((id): id is string => !!id)
      )
      projectIds.forEach((projectId) => {
        queryClient.invalidateQueries({
          queryKey: mappingsQueryKeys.byProject(projectId),
        })
      })
      environmentIds.forEach((environmentId) => {
        queryClient.invalidateQueries({
          queryKey: mappingsQueryKeys.byEnvironment(environmentId),
        })
      })
      logger.info('Mappings cache updated')
      toast.success('Mappings saved')
    },
  })
}

