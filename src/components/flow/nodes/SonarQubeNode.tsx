import { memo, useMemo } from 'react'
import type { NodeProps, Position, Node } from '@xyflow/react'
import { Activity } from 'lucide-react'
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
import { useSonarQubeNodeData } from '@/services/flow-node-data'
import type { FlowNodeData } from '@/store/flow-store'

export function SonarQubeNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const integrationId = data.integrationId ? String(data.integrationId) : null
  const description = data.description ? String(data.description) : null

  const {
    data: projects,
    isLoading,
    isError,
  } = useSonarQubeNodeData(integrationId)

  // Determine node status based on data fetching state
  const status = useMemo(() => {
    if (isLoading) return 'loading'
    if (isError) return 'error'
    if (projects && projects.length > 0) return 'success'
    return 'initial'
  }, [isLoading, isError, projects])

  const projectCount = projects?.length || 0
  const selectedProjectKey = data.selectedProjectKey as string | undefined
  const selectedProject = useMemo(() => {
    if (!selectedProjectKey || !projects) return null
    return projects.find(p => p.key === selectedProjectKey) || null
  }, [selectedProjectKey, projects])

  return (
    <NodeStatusIndicator status={status}>
      <BaseNode className="min-w-[200px]">
        <BaseHandle type="target" position={'top' as Position} />
        <BaseNodeHeader>
          <Activity className="size-4 text-yellow-500" />
          <BaseNodeHeaderTitle>{data.label || 'SonarQube'}</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
          {selectedProject && (
            <div className="text-xs font-medium truncate">
              {selectedProject.name}
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
              {!isLoading && !isError && !selectedProject && (
                <Badge variant="secondary" className="text-xs">
                  {projectCount} {projectCount === 1 ? 'project' : 'projects'}
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

export default memo(SonarQubeNode)
