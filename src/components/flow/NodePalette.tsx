import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GitBranch, Settings, Container, Activity, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useIntegrations } from '@/services/integrations'
import { useFlowStore } from '@/store/flow-store'
import type { IntegrationType } from '@/lib/tauri-bindings'
import { cn } from '@/lib/utils'

interface NodePaletteItem {
  type: IntegrationType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const nodeTemplates: NodePaletteItem[] = [
  {
    type: 'gitlab',
    label: 'GitLab',
    description: 'Git repository and CI/CD',
    icon: GitBranch,
    color: 'text-orange-500',
  },
  {
    type: 'jenkins',
    label: 'Jenkins',
    description: 'CI/CD automation server',
    icon: Settings,
    color: 'text-blue-500',
  },
  {
    type: 'kubernetes',
    label: 'Kubernetes',
    description: 'Container orchestration',
    icon: Container,
    color: 'text-cyan-500',
  },
  {
    type: 'sonarqube',
    label: 'SonarQube',
    description: 'Code quality analysis',
    icon: Activity,
    color: 'text-yellow-500',
  },
  {
    type: 'keycloak',
    label: 'Keycloak',
    description: 'Identity and access management',
    icon: Shield,
    color: 'text-purple-500',
  },
]

interface NodePaletteProps {
  onNodeClick?: (nodeType: IntegrationType) => void
  className?: string
}

export function NodePalette({
  onNodeClick,
  className,
}: NodePaletteProps) {
  const { t } = useTranslation()
  const { data: integrations } = useIntegrations()
  const pendingNodeType = useFlowStore(state => state.pendingNodeType)
  const setPendingNodeType = useFlowStore(state => state.setPendingNodeType)

  const nodesWithIntegrations = useMemo(() => {
    return nodeTemplates.map(template => {
      const availableIntegrations = integrations?.filter(
        i => i.type === template.type
      ) || []
      return {
        ...template,
        availableIntegrations,
        hasIntegrations: availableIntegrations.length > 0,
      }
    })
  }, [integrations])

  const handleClick = (nodeType: IntegrationType) => {
    // Toggle: if already selected, deselect; otherwise select
    if (pendingNodeType === nodeType) {
      setPendingNodeType(null)
    } else {
      setPendingNodeType(nodeType)
    }
    onNodeClick?.(nodeType)
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b p-3">
        <h3 className="text-sm font-semibold">
          {t('flow.palette.title', 'Node Palette')}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {t('flow.palette.description', 'Click node then click on canvas to add')}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {nodesWithIntegrations.map(node => {
            const Icon = node.icon
            const isSelected = pendingNodeType === node.type
            return (
              <Card
                key={node.type}
                onClick={() => handleClick(node.type)}
                className={cn(
                  'p-3 cursor-pointer transition-all duration-200',
                  'hover:shadow-md hover:border-primary/50 hover:bg-accent',
                  isSelected && 'border-primary border-2 bg-primary/5 shadow-md',
                  !node.hasIntegrations && 'opacity-50'
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('size-5 mt-0.5 transition-colors', node.color, isSelected && 'scale-110')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn('text-sm font-medium', isSelected && 'text-primary')}>
                        {node.label}
                      </h4>
                      {!node.hasIntegrations && (
                        <Badge variant="outline" className="text-xs">
                          {t('flow.palette.noIntegration', 'No integration')}
                        </Badge>
                      )}
                      {node.hasIntegrations && (
                        <Badge variant="secondary" className="text-xs">
                          {node.availableIntegrations.length}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {node.description}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
