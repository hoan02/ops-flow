import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProjects, useSaveProjects } from '@/services/projects'
import type { Project } from '@/lib/tauri-bindings'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onClose: () => void
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onClose,
}: ProjectDialogProps) {
  const { t } = useTranslation()
  const { data: projects } = useProjects()
  const saveProjects = useSaveProjects()

  const isEditMode = project !== null
  
  // Initialize state from props - component resets when key changes
  const [name, setName] = useState(() => project?.name ?? '')
  const [description, setDescription] = useState(() => project?.description ?? '')
  const [nameError, setNameError] = useState('')

  // Reset state when project or open changes using key prop
  const dialogKey = `${project?.id ?? 'new'}-${open}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!name.trim()) {
      setNameError(t('project.form.nameRequired'))
      return
    }

    setNameError('')

    try {
      const current = projects ?? []
      let updated: Project[]

      if (isEditMode && project) {
        updated = current.map(p =>
          p.id === project.id
            ? {
                ...p,
                name: name.trim(),
                description: description.trim() || null,
              }
            : p
        )
      } else {
        const newProject: Project = {
          id: crypto.randomUUID(),
          name: name.trim(),
          description: description.trim() || null,
          environments: [],
        }
        updated = [...current, newProject]
      }

      await saveProjects.mutateAsync(updated)
      onClose()
    } catch (error) {
      // Error is already handled by the mutation
      console.error('Failed to save project:', error)
    }
  }

  const actionLabel = isEditMode
    ? t('project.dialog.edit')
    : t('project.dialog.add')

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('project.dialog.title', { action: actionLabel })}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t('project.dialog.editDescription')
              : t('project.dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                {t('project.form.name')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setNameError('')
                }}
                placeholder={t('project.form.namePlaceholder')}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'name-error' : undefined}
              />
              {nameError && (
                <p id="name-error" className="text-sm text-destructive">
                  {nameError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">
                {t('project.form.description')}
              </Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('project.form.descriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saveProjects.isPending}>
              {saveProjects.isPending
                ? t('common.saving')
                : isEditMode
                  ? t('common.save')
                  : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

