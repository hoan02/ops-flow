import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIntegrations, useSaveIntegrations } from '@/services/integrations'
import { IntegrationItem } from './IntegrationItem'
import { IntegrationDialog } from './IntegrationDialog'
import { IntegrationCredentialsDialog } from './IntegrationCredentialsDialog'
import type { Integration } from '@/lib/tauri-bindings'

export function IntegrationList() {
  const { t } = useTranslation()
  const { data: integrations, isLoading } = useIntegrations()
  const saveIntegrations = useSaveIntegrations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] =
    useState<Integration | null>(null)
  const [credentialsIntegration, setCredentialsIntegration] =
    useState<Integration | null>(null)
  const [deletingIntegrationId, setDeletingIntegrationId] = useState<
    string | null
  >(null)

  const handleAdd = () => {
    setEditingIntegration(null)
    setDialogOpen(true)
  }

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration)
    setDialogOpen(true)
  }

  const handleCredentials = (integration: Integration) => {
    setCredentialsIntegration(integration)
    setCredentialsDialogOpen(true)
  }

  const handleDeleteClick = (integrationId: string) => {
    setDeletingIntegrationId(integrationId)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingIntegrationId || !integrations) return

    try {
      const updated = integrations.filter(i => i.id !== deletingIntegrationId)
      await saveIntegrations.mutateAsync(updated)
      setDeletingIntegrationId(null)
    } catch (error) {
      console.error('Failed to delete integration:', error)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingIntegration(null)
  }

  const handleCredentialsDialogClose = () => {
    setCredentialsDialogOpen(false)
    setCredentialsIntegration(null)
  }

  const deletingIntegration = integrations?.find(
    i => i.id === deletingIntegrationId
  )

  return (
    <>
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="text-sm font-semibold">
          {t('sidebar.integrations.title')}
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleAdd}
          title={t('sidebar.integrations.add')}
        >
          <Plus className="size-4" />
          <span className="sr-only">{t('sidebar.integrations.add')}</span>
        </Button>
      </div>

      <div className="space-y-1 px-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !integrations || integrations.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t('sidebar.integrations.empty')}
          </div>
        ) : (
          integrations.map(integration => (
            <IntegrationItem
              key={integration.id}
              integration={integration}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              onCredentials={handleCredentials}
            />
          ))
        )}
      </div>

      <IntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        integration={editingIntegration}
        onClose={handleDialogClose}
      />

      {credentialsIntegration && (
        <IntegrationCredentialsDialog
          open={credentialsDialogOpen}
          onOpenChange={setCredentialsDialogOpen}
          integration={credentialsIntegration}
          onClose={handleCredentialsDialogClose}
        />
      )}

      <AlertDialog
        open={deletingIntegrationId !== null}
        onOpenChange={open => !open && setDeletingIntegrationId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('integration.delete.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('integration.delete.confirmDescription', {
                name: deletingIntegration?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
