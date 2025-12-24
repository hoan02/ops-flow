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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/services/projects'
import { useEnvironments, useSaveEnvironments } from '@/services/environments'
import type { Environment } from '@/lib/tauri-bindings'

interface EnvironmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  environment: Environment | null
  onClose: () => void
}

export function EnvironmentDialog({
  open,
  onOpenChange,
  environment,
  onClose,
}: EnvironmentDialogProps) {
  const { t } = useTranslation()
  const { data: projects } = useProjects()
  const { data: environments } = useEnvironments()
  const saveEnvironments = useSaveEnvironments()

  const isEditMode = environment !== null
  
  // Initialize state from props - component resets when key changes
  const [name, setName] = useState(() => environment?.name ?? '')
  const [namespace, setNamespace] = useState(() => environment?.namespace ?? '')
  const [projectId, setProjectId] = useState(() => environment?.project_id ?? '')
  const [nameError, setNameError] = useState('')
  const [projectIdError, setProjectIdError] = useState('')

  // Reset state when environment or open changes using key prop
  const dialogKey = `${environment?.id ?? 'new'}-${open}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    let hasError = false
    if (!name.trim()) {
      setNameError(t('environment.form.nameRequired'))
      hasError = true
    }
    if (!projectId) {
      setProjectIdError(t('environment.form.projectRequired'))
      hasError = true
    }
    if (hasError) return

    setNameError('')
    setProjectIdError('')

    try {
      const current = environments ?? []
      let updated: Environment[]

      if (isEditMode && environment) {
        updated = current.map(e =>
          e.id === environment.id
            ? {
                ...e,
                name: name.trim(),
                namespace: namespace.trim() || null,
                project_id: projectId,
              }
            : e
        )
      } else {
        const newEnvironment: Environment = {
          id: crypto.randomUUID(),
          name: name.trim(),
          namespace: namespace.trim() || null,
          project_id: projectId,
        }
        updated = [...current, newEnvironment]
      }

      await saveEnvironments.mutateAsync(updated)
      onClose()
    } catch (error) {
      console.error('Failed to save environment:', error)
    }
  }

  const actionLabel = isEditMode
    ? t('environment.dialog.edit')
    : t('environment.dialog.add')

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('environment.dialog.title', { action: actionLabel })}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t('environment.dialog.editDescription')
              : t('environment.dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="environment-name">
                {t('environment.form.name')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="environment-name"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setNameError('')
                }}
                placeholder={t('environment.form.namePlaceholder')}
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
              <Label htmlFor="environment-project">
                {t('environment.form.project')}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={projectId}
                onValueChange={value => {
                  setProjectId(value)
                  setProjectIdError('')
                }}
              >
                <SelectTrigger
                  id="environment-project"
                  className="w-full"
                  aria-invalid={!!projectIdError}
                >
                  <SelectValue placeholder={t('environment.form.projectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projectIdError && (
                <p className="text-sm text-destructive">{projectIdError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment-namespace">
                {t('environment.form.namespace')}
              </Label>
              <Input
                id="environment-namespace"
                value={namespace}
                onChange={e => setNamespace(e.target.value)}
                placeholder={t('environment.form.namespacePlaceholder')}
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
            <Button type="submit" disabled={saveEnvironments.isPending}>
              {saveEnvironments.isPending
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

