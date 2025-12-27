import { memo, useMemo } from 'react'
import type { NodeProps, Position, Node } from '@xyflow/react'
import { Settings } from 'lucide-react'
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
import { useJenkinsNodeData } from '@/services/flow-node-data'
import type { FlowNodeData } from '@/store/flow-store'

export function JenkinsNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const integrationId = data.integrationId ? String(data.integrationId) : null
  const description = data.description ? String(data.description) : null

  const { data: jobs, isLoading, isError } = useJenkinsNodeData(integrationId)

  // Determine node status based on data fetching state
  const status = useMemo(() => {
    if (isLoading) return 'loading'
    if (isError) return 'error'
    if (jobs && jobs.length > 0) return 'success'
    return 'initial'
  }, [isLoading, isError, jobs])

  const jobCount = jobs?.length || 0
  const selectedJobName = data.selectedJobName as string | undefined
  const selectedJob = useMemo(() => {
    if (!selectedJobName || !jobs) return null
    return jobs.find(j => j.name === selectedJobName) || null
  }, [selectedJobName, jobs])

  // Get latest build status from job colors
  const latestStatus = useMemo(() => {
    if (!jobs || jobs.length === 0) return null
    // Jenkins color mapping: blue=success, red=failure, yellow=unstable, etc.
    const statusColors = jobs.map(job => job.color)
    if (statusColors.some(c => c === 'red' || c.includes('red'))) return 'failure'
    if (statusColors.some(c => c === 'yellow' || c.includes('yellow'))) return 'unstable'
    if (statusColors.some(c => c === 'blue' || c.includes('blue'))) return 'success'
    return null
  }, [jobs])

  return (
    <NodeStatusIndicator status={status}>
      <BaseNode className="min-w-[200px]">
        <BaseHandle type="target" position={'top' as Position} />
        <BaseNodeHeader>
          <Settings className="size-4 text-blue-500" />
          <BaseNodeHeaderTitle>{data.label || 'Jenkins'}</BaseNodeHeaderTitle>
        </BaseNodeHeader>
        <BaseNodeContent>
          {description && (
            <div className="text-xs text-muted-foreground">{description}</div>
          )}
          {selectedJob && (
            <div className="text-xs font-medium truncate">
              {selectedJob.name}
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
              {!isLoading && !isError && !selectedJob && (
                <>
                  <Badge variant="secondary" className="text-xs">
                    {jobCount} {jobCount === 1 ? 'job' : 'jobs'}
                  </Badge>
                  {latestStatus && (
                    <Badge
                      variant={latestStatus === 'success' ? 'default' : latestStatus === 'failure' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {latestStatus}
                    </Badge>
                  )}
                </>
              )}
            </div>
          )}
        </BaseNodeContent>
        <BaseHandle type="source" position={'bottom' as Position} />
      </BaseNode>
    </NodeStatusIndicator>
  )
}

export default memo(JenkinsNode)

