import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, unwrapResult } from '@/lib/tauri-bindings'

// Query keys for GitLab data
export const gitlabQueryKeys = {
  all: ['gitlab'] as const,
  projects: (integrationId: string) =>
    [...gitlabQueryKeys.all, 'projects', integrationId] as const,
  pipelines: (integrationId: string, projectId: number) =>
    [...gitlabQueryKeys.all, 'pipelines', integrationId, projectId] as const,
  webhooks: (integrationId: string, projectId: number) =>
    [...gitlabQueryKeys.all, 'webhooks', integrationId, projectId] as const,
}

// TanStack Query hooks following the architectural patterns

/**
 * Fetches GitLab projects for a given integration.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useGitLabProjects(integrationId: string) {
  return useQuery({
    queryKey: gitlabQueryKeys.projects(integrationId),
    queryFn: async () => {
      logger.debug('Fetching GitLab projects', { integrationId })
      return unwrapResult(await commands.fetchGitlabProjects(integrationId))
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
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
 * Fetches GitLab pipelines for a given project.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useGitLabPipelines(
  integrationId: string,
  projectId: number
) {
  return useQuery({
    queryKey: gitlabQueryKeys.pipelines(integrationId, projectId),
    queryFn: async () => {
      logger.debug('Fetching GitLab pipelines', {
        integrationId,
        projectId,
      })
      return unwrapResult(
        await commands.fetchGitlabPipelines(integrationId, projectId)
      )
    },
    enabled: !!integrationId && !!projectId,
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
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
 * Fetches GitLab webhooks for a given project.
 * Cache TTL: 60 seconds (webhooks don't change often).
 */
export function useGitLabWebhooks(
  integrationId: string,
  projectId: number
) {
  return useQuery({
    queryKey: gitlabQueryKeys.webhooks(integrationId, projectId),
    queryFn: async () => {
      logger.debug('Fetching GitLab webhooks', {
        integrationId,
        projectId,
      })
      return unwrapResult(
        await commands.fetchGitlabWebhooks(integrationId, projectId)
      )
    },
    enabled: !!integrationId && !!projectId,
    staleTime: 1000 * 60, // 60 seconds - webhooks don't change often
    gcTime: 1000 * 60 * 5, // 5 minutes
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
 * Mutation hook for triggering a GitLab pipeline.
 * Invalidates pipeline queries on success.
 */
export function useTriggerGitLabPipeline() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      integrationId,
      projectId,
      ref,
    }: {
      integrationId: string
      projectId: number
      ref: string
    }) => {
      logger.debug('Triggering GitLab pipeline', {
        integrationId,
        projectId,
        ref,
      })
      const result = await commands.triggerGitlabPipeline(
        integrationId,
        projectId,
        ref
      )

      if (result.status === 'error') {
        logger.error('Failed to trigger pipeline', {
          error: result.error,
          integrationId,
          projectId,
          ref,
        })
        toast.error('Failed to trigger pipeline', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Pipeline triggered successfully', {
        integrationId,
        projectId,
        ref,
        pipelineId: result.data.id,
      })
      return result.data
    },
    onSuccess: (_, { integrationId, projectId }) => {
      // Invalidate pipeline queries to refetch updated list
      queryClient.invalidateQueries({
        queryKey: gitlabQueryKeys.pipelines(integrationId, projectId),
      })
      logger.info('Pipeline queries invalidated', {
        integrationId,
        projectId,
      })
      toast.success('Pipeline triggered successfully')
    },
  })
}

