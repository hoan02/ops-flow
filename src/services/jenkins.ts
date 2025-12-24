import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, unwrapResult } from '@/lib/tauri-bindings'

// Query keys for Jenkins data
export const jenkinsQueryKeys = {
  all: ['jenkins'] as const,
  jobs: (integrationId: string) =>
    [...jenkinsQueryKeys.all, 'jobs', integrationId] as const,
  builds: (integrationId: string, jobName: string) =>
    [...jenkinsQueryKeys.all, 'builds', integrationId, jobName] as const,
  buildDetails: (
    integrationId: string,
    jobName: string,
    buildNumber: number
  ) =>
    [
      ...jenkinsQueryKeys.all,
      'buildDetails',
      integrationId,
      jobName,
      buildNumber,
    ] as const,
}

// TanStack Query hooks following the architectural patterns

/**
 * Fetches Jenkins jobs for a given integration.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useJenkinsJobs(integrationId: string) {
  return useQuery({
    queryKey: jenkinsQueryKeys.jobs(integrationId),
    queryFn: async () => {
      logger.debug('Fetching Jenkins jobs', { integrationId })
      return unwrapResult(await commands.fetchJenkinsJobs(integrationId))
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
 * Fetches Jenkins builds for a given job.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useJenkinsBuilds(
  integrationId: string,
  jobName: string
) {
  return useQuery({
    queryKey: jenkinsQueryKeys.builds(integrationId, jobName),
    queryFn: async () => {
      logger.debug('Fetching Jenkins builds', {
        integrationId,
        jobName,
      })
      return unwrapResult(
        await commands.fetchJenkinsBuilds(integrationId, jobName)
      )
    },
    enabled: !!integrationId && !!jobName,
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
 * Fetches detailed information for a specific Jenkins build.
 * Cache TTL: 30 seconds for real-time data.
 */
export function useJenkinsBuildDetails(
  integrationId: string,
  jobName: string,
  buildNumber: number
) {
  return useQuery({
    queryKey: jenkinsQueryKeys.buildDetails(
      integrationId,
      jobName,
      buildNumber
    ),
    queryFn: async () => {
      logger.debug('Fetching Jenkins build details', {
        integrationId,
        jobName,
        buildNumber,
      })
      return unwrapResult(
        await commands.fetchJenkinsBuildDetails(
          integrationId,
          jobName,
          buildNumber
        )
      )
    },
    enabled: !!integrationId && !!jobName && !!buildNumber,
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
 * Mutation hook for triggering a Jenkins build.
 * Invalidates build queries on success.
 */
export function useTriggerJenkinsBuild() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      integrationId,
      jobName,
      parameters,
    }: {
      integrationId: string
      jobName: string
      parameters?: Record<string, string>
    }) => {
      logger.debug('Triggering Jenkins build', {
        integrationId,
        jobName,
        parameters,
      })
      const result = await commands.triggerJenkinsBuild(
        integrationId,
        jobName,
        parameters || undefined
      )

      if (result.status === 'error') {
        logger.error('Failed to trigger build', {
          error: result.error,
          integrationId,
          jobName,
        })
        toast.error('Failed to trigger build', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Build triggered successfully', {
        integrationId,
        jobName,
      })
    },
    onSuccess: (_, { integrationId, jobName }) => {
      // Invalidate build queries to refetch updated list
      queryClient.invalidateQueries({
        queryKey: jenkinsQueryKeys.builds(integrationId, jobName),
      })
      // Also invalidate jobs to update job status
      queryClient.invalidateQueries({
        queryKey: jenkinsQueryKeys.jobs(integrationId),
      })
      logger.info('Build queries invalidated', {
        integrationId,
        jobName,
      })
      toast.success('Build triggered successfully')
    },
  })
}

