import { useQuery } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import { commands, unwrapResult } from '@/lib/tauri-bindings'

// Query keys for SonarQube data
export const sonarqubeQueryKeys = {
  all: ['sonarqube'] as const,
  projects: (integrationId: string) =>
    [...sonarqubeQueryKeys.all, 'projects', integrationId] as const,
  metrics: (integrationId: string, projectKey: string) =>
    [...sonarqubeQueryKeys.all, 'metrics', integrationId, projectKey] as const,
}

// TanStack Query hooks following the architectural patterns

/**
 * Fetches SonarQube projects for a given integration.
 * Cache TTL: 5-10 minutes (projects don't change often).
 */
export function useSonarQubeProjects(integrationId: string) {
  return useQuery({
    queryKey: sonarqubeQueryKeys.projects(integrationId),
    queryFn: async () => {
      logger.debug('Fetching SonarQube projects', { integrationId })
      return unwrapResult(await commands.fetchSonarqubeProjects(integrationId))
    },
    enabled: !!integrationId,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer TTL for metrics data
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Fetches SonarQube metrics for a given project.
 * Cache TTL: 5-10 minutes (metrics don't change often).
 */
export function useSonarQubeMetrics(integrationId: string, projectKey: string) {
  return useQuery({
    queryKey: sonarqubeQueryKeys.metrics(integrationId, projectKey),
    queryFn: async () => {
      logger.debug('Fetching SonarQube metrics', {
        integrationId,
        projectKey,
      })
      return unwrapResult(
        await commands.fetchSonarqubeMetrics(integrationId, projectKey)
      )
    },
    enabled: !!integrationId && !!projectKey,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer TTL for metrics data
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      return failureCount < 3
    },
  })
}
