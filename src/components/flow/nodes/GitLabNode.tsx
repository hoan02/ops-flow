import { memo } from 'react'
import type { NodeProps, Position, Node } from '@xyflow/react'
import { GitBranch } from 'lucide-react'
import {
  BaseNode,
  BaseNodeHeader,
  BaseNodeHeaderTitle,
  BaseNodeContent,
} from '@/components/ui/xyflow/base-node'
import { BaseHandle } from '@/components/ui/xyflow/base-handle'
import { NodeStatusIndicator } from '@/components/ui/xyflow/node-status-indicator'
import type { FlowNodeData } from '@/store/flow-store'

export function GitLabNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const status = (data.status as 'loading' | 'success' | 'error' | 'initial' | undefined) || 'initial'
  const integrationId = data.integrationId ? String(data.integrationId) : null
  const description = data.description ? String(data.description) : null
  return (
    <NodeStatusIndicator status={status}>
      <BaseNode className="min-w-[200px]">
        <BaseHandle type="target" position={'top' as Position} />
        <BaseNodeHeader>
          <GitBranch className="size-4 text-orange-500" />
          <BaseNodeHeaderTitle>{data.label || 'GitLab'}</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          {integrationId && (
            <div className="text-xs text-muted-foreground">
              Integration: {integrationId}
            </div>
          )}
          {description && (
            <div className="text-xs text-muted-foreground">
              {description}
            </div>
          )}
        </BaseNodeContent>
        <BaseHandle type="source" position={'bottom' as Position} />
      </BaseNode>
    </NodeStatusIndicator>
  )
}

export default memo(GitLabNode)

