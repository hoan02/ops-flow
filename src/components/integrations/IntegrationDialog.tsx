import { useState, useEffect } from 'react'
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
import { GitBranch, Server, Layers, Search, Shield } from 'lucide-react'
import { useIntegrations, useSaveIntegrations } from '@/services/integrations'
import type { Integration, IntegrationType } from '@/lib/tauri-bindings'

interface IntegrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration | null
  onClose: () => void
}

const integrationTypes: Array<{
  value: IntegrationType
  label: string
  icon: typeof GitBranch
}> = [
  { value: 'gitlab', label: 'GitLab', icon: GitBranch },
  { value: 'jenkins', label: 'Jenkins', icon: Server },
  { value: 'kubernetes', label: 'Kubernetes', icon: Layers },
  { value: 'sonarqube', label: 'SonarQube', icon: Search },
  { value: 'keycloak', label: 'Keycloak', icon: Shield },
]

export function IntegrationDialog({
  open,
  onOpenChange,
  integration,
  onClose,
}: IntegrationDialogProps) {
  const { t } = useTranslation()
  const { data: integrations } = useIntegrations()
  const saveIntegrations = useSaveIntegrations()

  const isEditMode = integration !== null
  const [type, setType] = useState<IntegrationType>('gitlab')
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [nameError, setNameError] = useState('')
  const [baseUrlError, setBaseUrlError] = useState('')

  useEffect(() => {
    if (integration) {
      setType(integration.type)
      setName(integration.name)
      setBaseUrl(integration.base_url)
    } else {
      setType('gitlab')
      setName('')
      setBaseUrl('')
    }
    setNameError('')
    setBaseUrlError('')
  }, [integration, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    let hasError = false
    if (!name.trim()) {
      setNameError(t('integration.form.nameRequired'))
      hasError = true
    }
    if (!baseUrl.trim()) {
      setBaseUrlError(t('integration.form.baseUrlRequired'))
      hasError = true
    } else {
      // Basic URL validation
      try {
        new URL(baseUrl.trim())
      } catch {
        setBaseUrlError(t('integration.form.baseUrlInvalid'))
        hasError = true
      }
    }
    if (hasError) return

    setNameError('')
    setBaseUrlError('')

    try {
      const current = integrations ?? []
      let updated: Integration[]

      if (isEditMode && integration) {
        updated = current.map(i =>
          i.id === integration.id
            ? {
                ...i,
                type,
                name: name.trim(),
                base_url: baseUrl.trim(),
              }
            : i
        )
      } else {
        const newIntegration: Integration = {
          id: crypto.randomUUID(),
          type,
          name: name.trim(),
          base_url: baseUrl.trim(),
          credentials_ref: null,
        }
        updated = [...current, newIntegration]
      }

      await saveIntegrations.mutateAsync(updated)
      onClose()
    } catch (error) {
      console.error('Failed to save integration:', error)
    }
  }

  const actionLabel = isEditMode
    ? t('integration.dialog.edit')
    : t('integration.dialog.add')

  const selectedType = integrationTypes.find(t => t.value === type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('integration.dialog.title', { action: actionLabel })}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t('integration.dialog.editDescription')
              : t('integration.dialog.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="integration-type">
                {t('integration.form.type')}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={value => setType(value as IntegrationType)}
                disabled={isEditMode}
              >
                <SelectTrigger id="integration-type" className="w-full">
                  <SelectValue>
                    {selectedType && (
                      <div className="flex items-center gap-2">
                        <selectedType.icon className="size-4" />
                        <span>{selectedType.label}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {integrationTypes.map(integrationType => (
                    <SelectItem
                      key={integrationType.value}
                      value={integrationType.value}
                    >
                      <div className="flex items-center gap-2">
                        <integrationType.icon className="size-4" />
                        <span>{integrationType.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditMode && (
                <p className="text-xs text-muted-foreground">
                  {t('integration.form.typeCannotBeChanged')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="integration-name">
                {t('integration.form.name')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="integration-name"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setNameError('')
                }}
                placeholder={t('integration.form.namePlaceholder')}
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
              <Label htmlFor="integration-base-url">
                {t('integration.form.baseUrl')}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="integration-base-url"
                type="url"
                value={baseUrl}
                onChange={e => {
                  setBaseUrl(e.target.value)
                  setBaseUrlError('')
                }}
                placeholder={t('integration.form.baseUrlPlaceholder')}
                aria-invalid={!!baseUrlError}
                aria-describedby={baseUrlError ? 'base-url-error' : undefined}
              />
              {baseUrlError && (
                <p id="base-url-error" className="text-sm text-destructive">
                  {baseUrlError}
                </p>
              )}
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
            <Button type="submit" disabled={saveIntegrations.isPending}>
              {saveIntegrations.isPending
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

