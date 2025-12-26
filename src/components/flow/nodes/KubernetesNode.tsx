import { memo } from 'react'
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
import type { FlowNodeData } from '@/store/flow-store'

export function KubernetesNode({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <NodeStatusIndicator status={data.status as 'loading' | 'success' | 'error' | 'initial'}>
      <BaseNode className="min-w-[200px]">
        <BaseHandle type="target" position={'top' as Position} />
        <BaseNodeHeader>
          <Container className="size-4 text-cyan-500" />
          <BaseNodeHeaderTitle>{data.label || 'Kubernetes'}</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          {data.integrationId && (
            <div className="text-xs text-muted-foreground">
              Integration: {String(data.integrationId)}
            </div>
          )}
          {data.description && (
            <div className="text-xs text-muted-foreground">{String(data.description)}</div>
          )}
        </BaseNodeContent>
        <BaseHandle type="source" position={'bottom' as Position} />
      </BaseNode>
    </NodeStatusIndicator>
  )
}

export default memo(KubernetesNode)

