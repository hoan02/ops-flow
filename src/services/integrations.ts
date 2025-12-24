import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  commands,
  type Integration,
  type IntegrationCredentials,
} from '@/lib/tauri-bindings'

// Query keys for integrations
export const integrationsQueryKeys = {
  all: ['integrations'] as const,
  integrations: () => [...integrationsQueryKeys.all] as const,
  credentials: (integrationId: string) =>
    [...integrationsQueryKeys.all, 'credentials', integrationId] as const,
}

// TanStack Query hooks following the architectural patterns
export function useIntegrations() {
  return useQuery({
    queryKey: integrationsQueryKeys.integrations(),
    queryFn: async (): Promise<Integration[]> => {
      logger.debug('Loading integrations from backend')
      const result = await commands.loadIntegrations()

      if (result.status === 'error') {
        logger.error('Failed to load integrations', { error: result.error })
        toast.error('Failed to load integrations', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Integrations loaded successfully', {
        count: result.data.length,
      })
      return result.data
    },
    staleTime: 1000 * 30, // 30 seconds - short TTL for real-time data
    gcTime: 1000 * 60, // 1 minute
  })
}

export function useSaveIntegrations() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrations: Integration[]) => {
      logger.debug('Saving integrations to backend', {
        count: integrations.length,
      })
      const result = await commands.saveIntegrations(integrations)

      if (result.status === 'error') {
        logger.error('Failed to save integrations', {
          error: result.error,
          count: integrations.length,
        })
        toast.error('Failed to save integrations', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Integrations saved successfully', {
        count: integrations.length,
      })
    },
    onSuccess: (_, integrations) => {
      // Update the cache with the new integrations
      queryClient.setQueryData(
        integrationsQueryKeys.integrations(),
        integrations
      )
      logger.info('Integrations cache updated')
      toast.success('Integrations saved')
    },
  })
}

// Credentials hooks
export function useIntegrationCredentials(integrationId: string) {
  return useQuery({
    queryKey: integrationsQueryKeys.credentials(integrationId),
    queryFn: async (): Promise<IntegrationCredentials | null> => {
      logger.debug('Loading credentials for integration', { integrationId })
      const result = await commands.getIntegrationCredentials(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to load credentials', {
          error: result.error,
          integrationId,
        })
        toast.error('Failed to load credentials', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      if (!result.data) {
        logger.debug('No credentials found for integration', { integrationId })
        return null
      }

      logger.info('Credentials loaded successfully', { integrationId })
      return result.data
    },
    enabled: !!integrationId,
    staleTime: 1000 * 60, // 1 minute - credentials don't change often
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSaveIntegrationCredentials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      integrationId,
      credentials,
    }: {
      integrationId: string
      credentials: IntegrationCredentials
    }) => {
      logger.debug('Saving credentials for integration', { integrationId })
      const result = await commands.saveIntegrationCredentials(
        integrationId,
        credentials
      )

      if (result.status === 'error') {
        logger.error('Failed to save credentials', {
          error: result.error,
          integrationId,
        })
        toast.error('Failed to save credentials', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Credentials saved successfully', { integrationId })
    },
    onSuccess: (_, { integrationId, credentials }) => {
      // Update the cache with the new credentials
      queryClient.setQueryData(
        integrationsQueryKeys.credentials(integrationId),
        credentials
      )
      logger.info('Credentials cache updated', { integrationId })
      toast.success('Credentials saved')
    },
  })
}

export function useDeleteIntegrationCredentials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrationId: string) => {
      logger.debug('Deleting credentials for integration', { integrationId })
      const result = await commands.deleteIntegrationCredentials(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to delete credentials', {
          error: result.error,
          integrationId,
        })
        toast.error('Failed to delete credentials', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Credentials deleted successfully', { integrationId })
    },
    onSuccess: (_, integrationId) => {
      // Remove credentials from cache
      queryClient.removeQueries({
        queryKey: integrationsQueryKeys.credentials(integrationId),
      })
      logger.info('Credentials cache removed', { integrationId })
      toast.success('Credentials deleted')
    },
  })
}

