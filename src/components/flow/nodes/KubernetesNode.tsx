import { memo, useMemo } from 'react'
import type { NodeProps, Position, Node } from '@xyflow/react'
import { Container } from 'lucide-react'
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from '@/components/ui/xyflow/base-node'
import { BaseHandle } from '@/components/ui/xyflow/base-handle'
import { NodeStatusIndicator } from '@/components/ui/xyflow/node-status-indicator'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useKubernetesNodeData } from '@/services/flow-node-data'
import type { FlowNodeData } from '@/store/flow-store'

export function KubernetesNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const integrationId = data.integrationId ? String(data.integrationId) : null
  const description = data.description ? String(data.description) : null

  const { data: namespaces, isLoading, isError } = useKubernetesNodeData(integrationId)

  // Determine node status based on data fetching state
  const status = useMemo(() => {
    if (isLoading) return 'loading'
    if (isError) return 'error'
    if (namespaces && namespaces.length > 0) return 'success'
    return 'initial'
  }, [isLoading, isError, namespaces])

  const namespaceCount = namespaces?.length || 0
  const selectedNamespace = data.selectedNamespace as string | undefined
  const selectedNamespaceData = useMemo(() => {
    if (!selectedNamespace || !namespaces) return null
    return namespaces.find(n => n.name === selectedNamespace) || null
  }, [selectedNamespace, namespaces])

  return (
    <NodeStatusIndicator status={status}>
      <BaseNode className="min-w-[200px]">
        <BaseHandle type="target" position={'top' as Position} />
        <BaseNodeHeader>
          <Container className="size-4 text-cyan-500" />
          <BaseNodeHeaderTitle>{data.label || 'Kubernetes'}</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
          {selectedNamespaceData && (
            <div className="text-xs font-medium truncate">
              {selectedNamespaceData.name}
            </div>
          )}
          {integrationId && (
            <div className="flex items-center gap-2 flex-wrap">
              {isLoading && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Spinner className="size-3" />
                  <span>Loading...</span>
                </div>
              )}
              {isError && (
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
              )}
              {!isLoading && !isError && !selectedNamespaceData && (
                <Badge variant="secondary" className="text-xs">
                  {namespaceCount} {namespaceCount === 1 ? 'namespace' : 'namespaces'}
                </Badge>
              )}
            </div>
          )}
        </BaseNodeContent>
        <BaseHandle type="source" position={'bottom' as Position} />
      </BaseNode>
    </NodeStatusIndicator>
  )
}

export default memo(KubernetesNode)

