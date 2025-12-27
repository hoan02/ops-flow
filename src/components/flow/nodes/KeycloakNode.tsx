import { memo, useMemo } from 'react'
import type { NodeProps, Position, Node } from '@xyflow/react'
import { Shield } from 'lucide-react'
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
import { useKeycloakNodeData } from '@/services/flow-node-data'
import type { FlowNodeData } from '@/store/flow-store'

export function KeycloakNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const integrationId = data.integrationId ? String(data.integrationId) : null
  const description = data.description ? String(data.description) : null

  const {
    data: realms,
    isLoading,
    isError,
  } = useKeycloakNodeData(integrationId)

  // Determine node status based on data fetching state
  const status = useMemo(() => {
    if (isLoading) return 'loading'
    if (isError) return 'error'
    if (realms && realms.length > 0) return 'success'
    return 'initial'
  }, [isLoading, isError, realms])

  const realmCount = realms?.length || 0
  const selectedRealm = data.selectedRealm as string | undefined
  const selectedRealmData = useMemo(() => {
    if (!selectedRealm || !realms) return null
    return realms.find(r => r.realm === selectedRealm) || null
  }, [selectedRealm, realms])

  return (
    <NodeStatusIndicator status={status}>
      <BaseNode className="min-w-[200px]">
        <BaseHandle type="target" position={'top' as Position} />
        <BaseNodeHeader>
          <Shield className="size-4 text-purple-500" />
          <BaseNodeHeaderTitle>{data.label || 'Keycloak'}</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
          {selectedRealmData && (
            <div className="text-xs font-medium truncate">
              {selectedRealmData.realm}
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
              {!isLoading && !isError && !selectedRealmData && (
                <Badge variant="secondary" className="text-xs">
                  {realmCount} {realmCount === 1 ? 'realm' : 'realms'}
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

export default memo(KeycloakNode)
