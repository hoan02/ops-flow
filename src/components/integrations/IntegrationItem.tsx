import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GitBranch,
  Server,
  Layers,
  Search,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  Wifi,
  WifiOff,
  Loader2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDevOpsStore } from '@/store/devops-store'
import type { Integration, IntegrationType } from '@/lib/tauri-bindings'
import { useTestIntegrationConnection } from '@/services/integrations'

interface IntegrationItemProps {
  integration: Integration
  onEdit: (integration: Integration) => void
  onDelete: (integrationId: string) => void
  onCredentials: (integration: Integration) => void
}

const integrationIcons: Record<IntegrationType, typeof GitBranch> = {
  gitlab: GitBranch,
  jenkins: Server,
  kubernetes: Layers,
  sonarqube: Search,
  keycloak: Shield,
}

export function IntegrationItem({
  integration,
  onEdit,
  onDelete,
  onCredentials,
}: IntegrationItemProps) {
  const { t } = useTranslation()
  const selectedIntegrationId = useDevOpsStore(
    state => state.selectedIntegrationId
  )
  const setSelectedIntegrationId = useDevOpsStore.getState()
    .setSelectedIntegrationId

  const testConnection = useTestIntegrationConnection()
  const isSelected = selectedIntegrationId === integration.id
  const Icon = integrationIcons[integration.type]
  const isConnected = integration.credentials_ref !== null
  const isTesting = testConnection.isPending

  const handleClick = () => {
    setSelectedIntegrationId(isSelected ? null : integration.id)
  }

  const handleTestConnection = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await testConnection.mutateAsync(integration.id)
    } catch (error) {
      // Error is handled by the mutation
      console.error('Test connection failed:', error)
    }
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50'
      )}
      onClick={handleClick}
    >
      <Icon className="size-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{integration.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {integration.base_url}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Badge
          variant={isConnected ? 'default' : 'outline'}
          className="text-xs"
        >
          {isConnected ? (
            <>
              <Wifi className="mr-1 size-3" />
              {t('sidebar.integrations.connected')}
            </>
          ) : (
            <>
              <WifiOff className="mr-1 size-3" />
              {t('sidebar.integrations.disconnected')}
            </>
          )}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title={t('sidebar.integrations.testConnection')}
        >
          {isTesting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Wifi className="size-4" />
          )}
          <span className="sr-only">{t('sidebar.integrations.testConnection')}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => e.stopPropagation()}
            >
              <MoreVertical className="size-4" />
              <span className="sr-only">{t('common.moreOptions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onEdit(integration)
              }}
            >
              <Edit className="mr-2 size-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onCredentials(integration)
              }}
            >
              <Key className="mr-2 size-4" />
              {t('integration.credentials')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation()
                onDelete(integration.id)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

