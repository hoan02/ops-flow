import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { useFlowStore } from '@/store/flow-store'
import { NodePropertiesForm } from './NodePropertiesForm'
import {
  useGitLabNodeData,
  useJenkinsNodeData,
  useKubernetesNodeData,
  useSonarQubeNodeData,
  useKeycloakNodeData,
} from '@/services/flow-node-data'
import { useQueryClient } from '@tanstack/react-query'
import { flowNodeDataQueryKeys } from '@/services/flow-node-data'
import { cn } from '@/lib/utils'
import type { IntegrationType } from '@/lib/tauri-bindings'

export function NodeDetailsPanel({ className }: { className?: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const selectedNodeId = useFlowStore(state => state.selectedNodeId)
  const nodes = useFlowStore(state => state.nodes)
  const edges = useFlowStore(state => state.edges)

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return nodes.find(n => n.id === selectedNodeId) || null
  }, [selectedNodeId, nodes])

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return []
    return edges.filter(
      e => e.source === selectedNodeId || e.target === selectedNodeId
    )
  }, [selectedNodeId, edges])

  const integrationId = selectedNode?.data.integrationId
    ? String(selectedNode.data.integrationId)
    : null
  const nodeType = selectedNode?.type as IntegrationType | undefined

  // Fetch data based on node type
  const gitlabData = useGitLabNodeData(
    nodeType === 'gitlab' ? integrationId : null
  )
  const jenkinsData = useJenkinsNodeData(
    nodeType === 'jenkins' ? integrationId : null
  )
  const kubernetesData = useKubernetesNodeData(
    nodeType === 'kubernetes' ? integrationId : null
  )
  const sonarqubeData = useSonarQubeNodeData(
    nodeType === 'sonarqube' ? integrationId : null
  )
  const keycloakData = useKeycloakNodeData(
    nodeType === 'keycloak' ? integrationId : null
  )

  // Get current data and loading state based on node type
  const { data, isLoading, isError, refetch } = useMemo(() => {
    switch (nodeType) {
      case 'gitlab':
        return gitlabData
      case 'jenkins':
        return jenkinsData
      case 'kubernetes':
        return kubernetesData
      case 'sonarqube':
        return sonarqubeData
      case 'keycloak':
        return keycloakData
      default:
        return {
          data: null,
          isLoading: false,
          isError: false,
          refetch: async () => ({}),
        }
    }
  }, [
    nodeType,
    gitlabData,
    jenkinsData,
    kubernetesData,
    sonarqubeData,
    keycloakData,
  ])

  const handleRefresh = () => {
    if (!integrationId || !nodeType) return

    // Invalidate and refetch based on node type
    const queryKey = (() => {
      switch (nodeType) {
        case 'gitlab':
          return flowNodeDataQueryKeys.gitlab(integrationId)
        case 'jenkins':
          return flowNodeDataQueryKeys.jenkins(integrationId)
        case 'kubernetes':
          return flowNodeDataQueryKeys.kubernetes(integrationId)
        case 'sonarqube':
          return flowNodeDataQueryKeys.sonarqube(integrationId)
        case 'keycloak':
          return flowNodeDataQueryKeys.keycloak(integrationId)
        default:
          return null
      }
    })()

    if (queryKey) {
      queryClient.invalidateQueries({ queryKey })
      refetch()
    }
  }

  if (!selectedNode) {
    return (
      <div
        className={cn('flex h-full items-center justify-center p-4', className)}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            {t('flow.details.noSelection', 'No node selected')}
          </p>
          <p className="text-xs mt-2">
            {t('flow.details.selectHint', 'Click on a node to view details')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      <div className="border-b px-3 py-2 flex-shrink-0">
        <h3 className="text-sm font-semibold">
          {t('flow.details.title', 'Node Details')}
        </h3>
      </div>
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-3 space-y-3">
          {/* Node Properties (Editable) */}
          <NodePropertiesForm node={selectedNode} />

          {/* Data Section - Only show if integration is selected */}
          {integrationId && nodeType && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 pt-3">
                <CardTitle className="text-sm">
                  {t('flow.details.data', 'Data')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw
                    className={cn('size-3', isLoading && 'animate-spin')}
                  />
                </Button>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                {isLoading && (
                  <div className="flex items-center justify-center py-3">
                    <Spinner className="size-4" />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t('flow.details.loading', 'Loading...')}
                    </span>
                  </div>
                )}
                {isError && (
                  <div className="py-3 text-center">
                    <p className="text-xs text-destructive">
                      {t('flow.details.error', 'Failed to load data')}
                    </p>
                  </div>
                )}
                {!isLoading && !isError && data && (
                  <NodeDataList nodeType={nodeType} data={data} />
                )}
                {!isLoading &&
                  !isError &&
                  (!data || (Array.isArray(data) && data.length === 0)) && (
                    <div className="py-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        {t('flow.details.noData', 'No data available')}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Component to render data list based on node type
function NodeDataList({
  nodeType,
  data,
}: {
  nodeType: IntegrationType
  data: unknown
}) {
  switch (nodeType) {
    case 'gitlab': {
      const projects = data as {
        id: number
        name: string
        path: string
        web_url: string
      }[]
      return (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {projects.map(project => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded border p-1.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {project.path}
                </p>
              </div>
              <a
                href={project.web_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 flex-shrink-0"
              >
                <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          ))}
        </div>
      )
    }
    case 'jenkins': {
      const jobs = data as { name: string; url: string; color: string }[]
      
      if (jobs.length === 0) {
        return (
          <div className="py-3 text-center">
            <p className="text-xs text-muted-foreground">
              No data available
            </p>
          </div>
        )
      }
      
      // Separate folders and actual jobs
      const folders = jobs.filter(j => j.color === 'folder' || (j.color === 'notbuilt' && !j.name.includes('/')))
      const actualJobs = jobs.filter(j => !folders.find(f => f.name === j.name))
      
      // If we only have folders, show a helpful message
      if (actualJobs.length === 0 && folders.length > 0) {
        return (
          <div className="space-y-2">
            <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">
              Only folders are available. Backend needs to fetch jobs from inside folders to display them here.
            </div>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              <p className="text-xs font-medium text-muted-foreground px-1">Folders:</p>
              {folders.map(folder => (
                <div
                  key={folder.name}
                  className="flex items-center justify-between rounded border p-1.5 bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {folder.name} <span className="text-muted-foreground">(Folder)</span>
                    </p>
                  </div>
                  <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {folder.color}
                    </Badge>
                    <a href={folder.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      
      // Show actual jobs
      return (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {actualJobs.map(job => {
            const statusColor = job.color.includes('red')
              ? 'destructive'
              : job.color.includes('yellow')
                ? 'outline'
                : job.color.includes('blue')
                  ? 'default'
                  : 'secondary'
            
            return (
              <div
                key={job.name}
                className="flex items-center justify-between rounded border p-1.5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{job.name}</p>
                </div>
                <div className="ml-2 flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant={statusColor} className="text-xs px-1.5 py-0">
                    {job.color}
                  </Badge>
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )
    }
    case 'kubernetes': {
      const namespaces = data as {
        name: string
        status: string
        created_at: string
      }[]
      return (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {namespaces.map(namespace => (
            <div
              key={namespace.name}
              className="flex items-center justify-between rounded border p-1.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{namespace.name}</p>
              </div>
              <Badge variant="secondary" className="text-xs ml-2 px-1.5 py-0 flex-shrink-0">
                {namespace.status}
              </Badge>
            </div>
          ))}
        </div>
      )
    }
    case 'sonarqube': {
      const projects = data as {
        key: string
        name: string
        qualifier: string
      }[]
      return (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {projects.map(project => (
            <div
              key={project.key}
              className="flex items-center justify-between rounded border p-1.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {project.key}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs ml-2 px-1.5 py-0 flex-shrink-0">
                {project.qualifier}
              </Badge>
            </div>
          ))}
        </div>
      )
    }
    case 'keycloak': {
      const realms = data as { realm: string; enabled: boolean }[]
      return (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
          {realms.map(realm => (
            <div
              key={realm.realm}
              className="flex items-center justify-between rounded border p-1.5 hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{realm.realm}</p>
              </div>
              <Badge
                variant={realm.enabled ? 'default' : 'secondary'}
                className="text-xs ml-2 px-1.5 py-0 flex-shrink-0"
              >
                {realm.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          ))}
        </div>
      )
    }
    default:
      return null
  }
}
