import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'
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
import { useProjects } from '@/services/projects'
import { useEnvironments, useSaveEnvironments } from '@/services/environments'
import { EnvironmentItem } from './EnvironmentItem'
import { EnvironmentDialog } from './EnvironmentDialog'
import type { Environment } from '@/lib/tauri-bindings'

export function EnvironmentList() {
  const { t } = useTranslation()
  const { data: projects } = useProjects()
  const { data: environments, isLoading } = useEnvironments()
  const saveEnvironments = useSaveEnvironments()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null)
  const [deletingEnvironmentId, setDeletingEnvironmentId] = useState<
    string | null
  >(null)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  )

  const handleAdd = () => {
    setEditingEnvironment(null)
    setDialogOpen(true)
  }

  const handleEdit = (environment: Environment) => {
    setEditingEnvironment(environment)
    setDialogOpen(true)
  }

  const handleDeleteClick = (environmentId: string) => {
    setDeletingEnvironmentId(environmentId)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingEnvironmentId || !environments) return

    try {
      const updated = environments.filter(e => e.id !== deletingEnvironmentId)
      await saveEnvironments.mutateAsync(updated)
      setDeletingEnvironmentId(null)
    } catch (error) {
      console.error('Failed to delete environment:', error)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEnvironment(null)
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const deletingEnvironment = environments?.find(
    e => e.id === deletingEnvironmentId
  )

  // Group environments by project
  const environmentsByProject = new Map<string, Environment[]>()
  environments?.forEach(env => {
    const existing = environmentsByProject.get(env.project_id) ?? []
    existing.push(env)
    environmentsByProject.set(env.project_id, existing)
  })

  // Ensure all projects are in the map (even if they have no environments)
  projects?.forEach(project => {
    if (!environmentsByProject.has(project.id)) {
      environmentsByProject.set(project.id, [])
    }
  })

  return (
    <>
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="text-sm font-semibold">
          {t('sidebar.environments.title')}
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleAdd}
          title={t('sidebar.environments.add')}
        >
          <Plus className="size-4" />
          <span className="sr-only">{t('sidebar.environments.add')}</span>
        </Button>
      </div>

      <div className="space-y-1 px-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t('sidebar.environments.noProjects')}
          </div>
        ) : environmentsByProject.size === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t('sidebar.environments.empty')}
          </div>
        ) : (
          Array.from(environmentsByProject.entries()).map(
            ([projectId, envs]) => {
              const project = projects?.find(p => p.id === projectId)
              const isExpanded = expandedProjects.has(projectId)

              return (
                <div key={projectId} className="space-y-1">
                  <button
                    onClick={() => toggleProject(projectId)}
                    className="flex w-full items-center gap-1 rounded-md px-2 py-1 text-sm font-medium hover:bg-accent/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                    <span className="flex-1 text-start">
                      {project?.name ?? t('environment.unknownProject')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {envs.length}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {envs.length === 0 ? (
                        <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                          {t('sidebar.environments.emptyForProject')}
                        </div>
                      ) : (
                        envs.map(env => (
                          <EnvironmentItem
                            key={env.id}
                            environment={env}
                            project={project}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            }
          )
        )}
      </div>

      <EnvironmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        environment={editingEnvironment}
        onClose={handleDialogClose}
      />

      <AlertDialog
        open={deletingEnvironmentId !== null}
        onOpenChange={open => !open && setDeletingEnvironmentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('environment.delete.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('environment.delete.confirmDescription', {
                name: deletingEnvironment?.name,
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

