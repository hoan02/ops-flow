import { useQuery, useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import { commands, unwrapResult } from '@/lib/tauri-bindings'

// Query keys for Kubernetes data
export const k8sQueryKeys = {
  all: ['kubernetes'] as const,
  namespaces: (integrationId: string) =>
    [...k8sQueryKeys.all, 'namespaces', integrationId] as const,
  pods: (integrationId: string, namespace: string) =>
    [...k8sQueryKeys.all, 'pods', integrationId, namespace] as const,
  services: (integrationId: string, namespace: string) =>
    [...k8sQueryKeys.all, 'services', integrationId, namespace] as const,
  podDetails: (
    integrationId: string,
    namespace: string,
    podName: string
  ) =>
    [
      ...k8sQueryKeys.all,
      'podDetails',
      integrationId,
      namespace,
      podName,
    ] as const,
}

// TanStack Query hooks following the architectural patterns

/**
 * Fetches Kubernetes namespaces for a given integration.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useK8sNamespaces(integrationId: string) {
  return useQuery({
    queryKey: k8sQueryKeys.namespaces(integrationId),
    queryFn: async () => {
      logger.debug('Fetching Kubernetes namespaces', { integrationId })
      return unwrapResult(await commands.fetchK8sNamespaces(integrationId))
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on auth errors or connection failures
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('Failed to connect'))
      ) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Fetches Kubernetes pods in a specific namespace.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useK8sPods(integrationId: string, namespace: string) {
  return useQuery({
    queryKey: k8sQueryKeys.pods(integrationId, namespace),
    queryFn: async () => {
      logger.debug('Fetching Kubernetes pods', {
        integrationId,
        namespace,
      })
      return unwrapResult(
        await commands.fetchK8sPods(integrationId, namespace)
      )
    },
    enabled: !!integrationId && !!namespace,
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on auth errors or connection failures
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('Failed to connect'))
      ) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Fetches Kubernetes services in a specific namespace.
 * Cache TTL: 30-60 seconds for real-time data.
 */
export function useK8sServices(integrationId: string, namespace: string) {
  return useQuery({
    queryKey: k8sQueryKeys.services(integrationId, namespace),
    queryFn: async () => {
      logger.debug('Fetching Kubernetes services', {
        integrationId,
        namespace,
      })
      return unwrapResult(
        await commands.fetchK8sServices(integrationId, namespace)
      )
    },
    enabled: !!integrationId && !!namespace,
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on auth errors or connection failures
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('Failed to connect'))
      ) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Fetches detailed information for a specific Kubernetes pod.
 * Cache TTL: 30 seconds for real-time data.
 */
export function useK8sPodDetails(
  integrationId: string,
  namespace: string,
  podName: string
) {
  return useQuery({
    queryKey: k8sQueryKeys.podDetails(integrationId, namespace, podName),
    queryFn: async () => {
      logger.debug('Fetching Kubernetes pod details', {
        integrationId,
        namespace,
        podName,
      })
      return unwrapResult(
        await commands.fetchK8sPodDetails(integrationId, namespace, podName)
      )
    },
    enabled: !!integrationId && !!namespace && !!podName,
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on auth errors, connection failures, or not found
      if (
        error instanceof Error &&
        (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('Failed to connect') ||
          error.message.includes('not found'))
      ) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Helper function to invalidate Kubernetes queries.
 * Useful for refreshing data after mutations or manual refresh.
 */
export function useInvalidateK8sQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateNamespaces: (integrationId: string) => {
      queryClient.invalidateQueries({
        queryKey: k8sQueryKeys.namespaces(integrationId),
      })
    },
    invalidatePods: (integrationId: string, namespace: string) => {
      queryClient.invalidateQueries({
        queryKey: k8sQueryKeys.pods(integrationId, namespace),
      })
    },
    invalidateServices: (integrationId: string, namespace: string) => {
      queryClient.invalidateQueries({
        queryKey: k8sQueryKeys.services(integrationId, namespace),
      })
    },
    invalidatePodDetails: (
      integrationId: string,
      namespace: string,
      podName: string
    ) => {
      queryClient.invalidateQueries({
        queryKey: k8sQueryKeys.podDetails(integrationId, namespace, podName),
      })
    },
    invalidateAll: (integrationId: string) => {
      queryClient.invalidateQueries({
        queryKey: k8sQueryKeys.all,
        predicate: (query) => {
          const key = query.queryKey
          return (
            Array.isArray(key) &&
            key.length >= 3 &&
            key[0] === 'kubernetes' &&
            key[2] === integrationId
          )
        },
      })
    },
  }
}

