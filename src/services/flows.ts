import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { commands, type Flow, type FlowMetadata } from '@/lib/tauri-bindings'
import type { Node, Edge, Viewport } from '@xyflow/react'

// Query keys for flows
export const flowsQueryKeys = {
  all: ['flows'] as const,
  flows: () => [...flowsQueryKeys.all] as const,
  flow: (id: string) => [...flowsQueryKeys.all, 'flow', id] as const,
}

// TanStack Query hooks following the architectural patterns
export function useFlows() {
  return useQuery({
    queryKey: flowsQueryKeys.flows(),
    queryFn: async (): Promise<FlowMetadata[]> => {
      logger.debug('Loading flows from backend')
      const result = await commands.loadFlows()

      if (result.status === 'error') {
        logger.error('Failed to load flows', { error: result.error })
        toast.error('Failed to load flows', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Flows loaded successfully', {
        count: result.data.length,
      })
      return result.data
    },
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60, // 1 minute
  })
}

export function useFlow(flowId: string | null) {
  return useQuery({
    queryKey: flowsQueryKeys.flow(flowId || ''),
    queryFn: async (): Promise<Flow | null> => {
      if (!flowId) return null

      logger.debug('Loading flow from backend', { flowId })
      const result = await commands.loadFlow(flowId)

      if (result.status === 'error') {
        logger.error('Failed to load flow', {
          error: result.error,
          flowId,
        })
        toast.error('Failed to load flow', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Flow loaded successfully', { flowId })
      return result.data
    },
    enabled: !!flowId,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useSaveFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      flowId,
      name,
      nodes,
      edges,
      viewport,
    }: {
      flowId: string
      name: string
      nodes: Node[]
      edges: Edge[]
      viewport?: Viewport
    }) => {
      logger.debug('Saving flow to backend', { flowId, name })
      const now = new Date().toISOString()

      const flow: Flow = {
        id: flowId,
        name,
        created_at: now, // In a real app, you'd preserve the original created_at
        updated_at: now,
        nodes: nodes as unknown as Flow['nodes'],
        edges: edges as unknown as Flow['edges'],
        viewport: viewport as unknown as Flow['viewport'] || null,
      }

      const result = await commands.saveFlow(flow)

      if (result.status === 'error') {
        logger.error('Failed to save flow', {
          error: result.error,
          flowId,
        })
        toast.error('Failed to save flow', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Flow saved successfully', { flowId, name })
    },
    onSuccess: (_, variables) => {
      // Invalidate flows list to refresh
      queryClient.invalidateQueries({
        queryKey: flowsQueryKeys.flows(),
      })
      // Update the specific flow cache
      queryClient.invalidateQueries({
        queryKey: flowsQueryKeys.flow(variables.flowId),
      })
      logger.info('Flow cache updated')
      toast.success('Flow saved')
    },
  })
}

export function useDeleteFlow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (flowId: string) => {
      logger.debug('Deleting flow from backend', { flowId })
      const result = await commands.deleteFlow(flowId)

      if (result.status === 'error') {
        logger.error('Failed to delete flow', {
          error: result.error,
          flowId,
        })
        toast.error('Failed to delete flow', {
          description: result.error,
        })
        throw new Error(result.error)
      }

      logger.info('Flow deleted successfully', { flowId })
    },
    onSuccess: (_, flowId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: flowsQueryKeys.flow(flowId),
      })
      // Invalidate flows list
      queryClient.invalidateQueries({
        queryKey: flowsQueryKeys.flows(),
      })
      logger.info('Flow cache removed', { flowId })
      toast.success('Flow deleted')
    },
  })
}

