import { useQuery } from '@tanstack/react-query'
import { logger } from '@/lib/logger'
import { commands, type GitLabProject } from '@/lib/tauri-bindings'
import type {
  JenkinsJob,
  K8sNamespace,
  SonarQubeProject,
  KeycloakRealm,
} from '@/lib/bindings'

// Query keys for flow node data
export const flowNodeDataQueryKeys = {
  all: ['flow-node-data'] as const,
  gitlab: (integrationId: string) =>
    [...flowNodeDataQueryKeys.all, 'gitlab', integrationId] as const,
  jenkins: (integrationId: string) =>
    [...flowNodeDataQueryKeys.all, 'jenkins', integrationId] as const,
  jenkinsFolder: (integrationId: string, folderPath: string) =>
    [
      ...flowNodeDataQueryKeys.all,
      'jenkins',
      integrationId,
      'folder',
      folderPath,
    ] as const,
  kubernetes: (integrationId: string) =>
    [...flowNodeDataQueryKeys.all, 'kubernetes', integrationId] as const,
  sonarqube: (integrationId: string) =>
    [...flowNodeDataQueryKeys.all, 'sonarqube', integrationId] as const,
  keycloak: (integrationId: string) =>
    [...flowNodeDataQueryKeys.all, 'keycloak', integrationId] as const,
}

/**
 * Hook to fetch GitLab projects for a node
 */
export function useGitLabNodeData(integrationId: string | null | undefined) {
  return useQuery({
    queryKey: flowNodeDataQueryKeys.gitlab(integrationId || ''),
    queryFn: async (): Promise<GitLabProject[]> => {
      if (!integrationId) {
        return []
      }

      logger.debug('Fetching GitLab projects for node', { integrationId })
      const result = await commands.fetchGitlabProjects(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to fetch GitLab projects', {
          error: result.error,
          integrationId,
        })
        throw new Error(result.error)
      }

      logger.info('GitLab projects fetched successfully', {
        integrationId,
        count: result.data.length,
      })
      return result.data
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to fetch Jenkins jobs for a node
 * Filters out folders and returns only actual jobs (including jobs inside folders)
 */
export function useJenkinsNodeData(integrationId: string | null | undefined) {
  return useQuery({
    queryKey: flowNodeDataQueryKeys.jenkins(integrationId || ''),
    queryFn: async (): Promise<JenkinsJob[]> => {
      if (!integrationId) {
        return []
      }

      logger.debug('Fetching Jenkins jobs for node', { integrationId })
      const result = await commands.fetchJenkinsJobs(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to fetch Jenkins jobs', {
          error: result.error,
          integrationId,
        })
        throw new Error(result.error)
      }

      // Log all items for debugging
      logger.debug('Jenkins API response', {
        integrationId,
        totalItems: result.data.length,
        items: result.data.map(j => ({
          name: j.name,
          color: j.color,
          url: j.url,
        })),
      })

      // Return all items - filtering will be done in UI
      // If backend only returns folders, we need backend to fetch jobs from folders
      logger.info('Jenkins jobs fetched successfully', {
        integrationId,
        count: result.data.length,
      })

      return result.data
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to fetch Kubernetes namespaces for a node
 */
export function useKubernetesNodeData(
  integrationId: string | null | undefined
) {
  return useQuery({
    queryKey: flowNodeDataQueryKeys.kubernetes(integrationId || ''),
    queryFn: async (): Promise<K8sNamespace[]> => {
      if (!integrationId) {
        return []
      }

      logger.debug('Fetching Kubernetes namespaces for node', { integrationId })
      const result = await commands.fetchK8sNamespaces(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to fetch Kubernetes namespaces', {
          error: result.error,
          integrationId,
        })
        throw new Error(result.error)
      }

      logger.info('Kubernetes namespaces fetched successfully', {
        integrationId,
        count: result.data.length,
      })
      return result.data
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to fetch SonarQube projects for a node
 */
export function useSonarQubeNodeData(integrationId: string | null | undefined) {
  return useQuery({
    queryKey: flowNodeDataQueryKeys.sonarqube(integrationId || ''),
    queryFn: async (): Promise<SonarQubeProject[]> => {
      if (!integrationId) {
        return []
      }

      logger.debug('Fetching SonarQube projects for node', { integrationId })
      const result = await commands.fetchSonarqubeProjects(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to fetch SonarQube projects', {
          error: result.error,
          integrationId,
        })
        throw new Error(result.error)
      }

      logger.info('SonarQube projects fetched successfully', {
        integrationId,
        count: result.data.length,
      })
      return result.data
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  })
}

/**
 * Hook to fetch Keycloak realms for a node
 */
export function useKeycloakNodeData(integrationId: string | null | undefined) {
  return useQuery({
    queryKey: flowNodeDataQueryKeys.keycloak(integrationId || ''),
    queryFn: async (): Promise<KeycloakRealm[]> => {
      if (!integrationId) {
        return []
      }

      logger.debug('Fetching Keycloak realms for node', { integrationId })
      const result = await commands.fetchKeycloakRealms(integrationId)

      if (result.status === 'error') {
        logger.error('Failed to fetch Keycloak realms', {
          error: result.error,
          integrationId,
        })
        throw new Error(result.error)
      }

      logger.info('Keycloak realms fetched successfully', {
        integrationId,
        count: result.data.length,
      })
      return result.data
    },
    enabled: !!integrationId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  })
}
