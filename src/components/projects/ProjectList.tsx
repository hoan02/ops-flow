import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
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
import { useProjects, useSaveProjects } from '@/services/projects'
import { ProjectItem } from './ProjectItem'
import { ProjectDialog } from './ProjectDialog'
import type { Project } from '@/lib/tauri-bindings'

export function ProjectList() {
  const { t } = useTranslation()
  const { data: projects } = useProjects()
  const saveProjects = useSaveProjects()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null
  )

  const handleAdd = () => {
    setEditingProject(null)
    setDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleDeleteClick = (projectId: string) => {
    setDeletingProjectId(projectId)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingProjectId || !projects) return

    try {
      const updated = projects.filter(p => p.id !== deletingProjectId)
      await saveProjects.mutateAsync(updated)
      setDeletingProjectId(null)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingProject(null)
  }

  const deletingProject = projects?.find(p => p.id === deletingProjectId)

  return (
    <>
      <div className="flex items-center justify-between px-2 py-2">
        <h3 className="text-sm font-semibold">{t('sidebar.projects.title')}</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleAdd}
          title={t('sidebar.projects.add')}
        >
          <Plus className="size-4" />
          <span className="sr-only">{t('sidebar.projects.add')}</span>
        </Button>
      </div>

      <div className="space-y-1 px-2">
        {!projects || projects.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t('sidebar.projects.empty')}
          </div>
        ) : (
          projects.map(project => (
            <ProjectItem
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
        onClose={handleDialogClose}
      />

      <AlertDialog
        open={deletingProjectId !== null}
        onOpenChange={open => !open && setDeletingProjectId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('project.delete.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('project.delete.confirmDescription', {
                name: deletingProject?.name,
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
