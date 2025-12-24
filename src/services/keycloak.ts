import { useQuery } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import { commands, unwrapResult } from '@/lib/tauri-bindings'

// Query keys for Keycloak data
export const keycloakQueryKeys = {
  all: ['keycloak'] as const,
  realms: (integrationId: string) =>
    [...keycloakQueryKeys.all, 'realms', integrationId] as const,
  clients: (integrationId: string, realm: string) =>
    [...keycloakQueryKeys.all, 'clients', integrationId, realm] as const,
}

// TanStack Query hooks following the architectural patterns

/**
 * Fetches Keycloak realms for a given integration.
 * Cache TTL: 5-10 minutes (realms don't change often).
 * Note: Requires admin access. Returns empty list if admin access is not available.
 */
export function useKeycloakRealms(integrationId: string) {
  return useQuery({
    queryKey: keycloakQueryKeys.realms(integrationId),
    queryFn: async () => {
      logger.debug('Fetching Keycloak realms', { integrationId })
      return unwrapResult(await commands.fetchKeycloakRealms(integrationId))
    },
    enabled: !!integrationId,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer TTL for config data
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      // Don't retry on permission errors (403) - admin access may not be available
      if (error instanceof Error && error.message.includes('403')) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Fetches Keycloak clients for a given realm.
 * Cache TTL: 5-10 minutes (clients don't change often).
 * Note: Requires admin access. Returns empty list if admin access is not available.
 */
export function useKeycloakClients(integrationId: string, realm: string) {
  return useQuery({
    queryKey: keycloakQueryKeys.clients(integrationId, realm),
    queryFn: async () => {
      logger.debug('Fetching Keycloak clients', {
        integrationId,
        realm,
      })
      return unwrapResult(
        await commands.fetchKeycloakClients(integrationId, realm)
      )
    },
    enabled: !!integrationId && !!realm,
    staleTime: 1000 * 60 * 5, // 5 minutes - longer TTL for config data
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes('401')) {
        return false
      }
      // Don't retry on permission errors (403) - admin access may not be available
      if (error instanceof Error && error.message.includes('403')) {
        return false
      }
      return failureCount < 3
    },
  })
}
