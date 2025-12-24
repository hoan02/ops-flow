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
import { useIntegrationCredentials, useSaveIntegrationCredentials } from '@/services/integrations'
import type { Integration, IntegrationType, IntegrationCredentials } from '@/lib/tauri-bindings'

interface IntegrationCredentialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration
  onClose: () => void
}

export function IntegrationCredentialsDialog({
  open,
  onOpenChange,
  integration,
  onClose,
}: IntegrationCredentialsDialogProps) {
  const { t } = useTranslation()
  const { data: existingCredentials } = useIntegrationCredentials(integration.id)
  const saveCredentials = useSaveIntegrationCredentials()

  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (existingCredentials) {
      setToken(existingCredentials.token ?? '')
      setUsername(existingCredentials.username ?? '')
      setPassword(existingCredentials.password ?? '')
    } else {
      setToken('')
      setUsername('')
      setPassword('')
    }
  }, [existingCredentials, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const credentials: IntegrationCredentials = {
      token: token.trim() || null,
      username: username.trim() || null,
      password: password.trim() || null,
    }

    try {
      await saveCredentials.mutateAsync({
        integrationId: integration.id,
        credentials,
      })
      onClose()
    } catch (error) {
      console.error('Failed to save credentials:', error)
    }
  }

  const getFieldsForType = (type: IntegrationType) => {
    switch (type) {
      case 'gitlab':
      case 'jenkins':
      case 'sonarqube':
        return ['token']
      case 'kubernetes':
        return ['token', 'username', 'password']
      case 'keycloak':
        return ['username', 'password']
      default:
        return []
    }
  }

  const fields = getFieldsForType(integration.type)
  const needsToken = fields.includes('token')
  const needsUsername = fields.includes('username')
  const needsPassword = fields.includes('password')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('integration.credentials.dialog.title', { name: integration.name })}
          </DialogTitle>
          <DialogDescription>
            {t('integration.credentials.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {needsToken && (
              <div className="space-y-2">
                <Label htmlFor="credentials-token">
                  {t('integration.credentials.token')}
                </Label>
                <Input
                  id="credentials-token"
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder={t('integration.credentials.tokenPlaceholder')}
                />
              </div>
            )}

            {needsUsername && (
              <div className="space-y-2">
                <Label htmlFor="credentials-username">
                  {t('integration.credentials.username')}
                </Label>
                <Input
                  id="credentials-username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t('integration.credentials.usernamePlaceholder')}
                />
              </div>
            )}

            {needsPassword && (
              <div className="space-y-2">
                <Label htmlFor="credentials-password">
                  {t('integration.credentials.password')}
                </Label>
                <Input
                  id="credentials-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('integration.credentials.passwordPlaceholder')}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saveCredentials.isPending}>
              {saveCredentials.isPending
                ? t('common.saving')
                : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

