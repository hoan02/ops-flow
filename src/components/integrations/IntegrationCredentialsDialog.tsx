import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

  // Auth method: 'username-password' | 'token' | null (null means no choice needed)
  const [authMethod, setAuthMethod] = useState<'username-password' | 'token' | null>(null)
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [kubeconfigPath, setKubeconfigPath] = useState('')

  // Determine if this integration needs auth method selection
  const needsAuthMethodSelection = (type: IntegrationType): boolean => {
    // Jenkins can use username/password or username/token
    // GitLab only supports token (API v4 does not support Basic Auth)
    return type === 'jenkins'
  }

  useEffect(() => {
    if (existingCredentials) {
      setToken(existingCredentials.token ?? '')
      setUsername(existingCredentials.username ?? '')
      setPassword(existingCredentials.password ?? '')
      setKubeconfigPath(
        existingCredentials.custom?.['kubeconfig_path'] ?? ''
      )

      // Determine auth method from existing credentials
      if (needsAuthMethodSelection(integration.type)) {
        const hasToken = !!existingCredentials.token?.trim()
        const hasPassword = !!existingCredentials.password?.trim()

        if (integration.type === 'jenkins') {
          // Jenkins always needs username, can use password or token
          // If both exist, prefer password (as per Rust code logic)
          if (hasPassword) {
            setAuthMethod('username-password')
          } else if (hasToken) {
            setAuthMethod('token')
          } else {
            // Default to username-password if neither exists
            setAuthMethod('username-password')
          }
        }
      }
    } else {
      setToken('')
      setUsername('')
      setPassword('')
      setKubeconfigPath('')
      // Set default auth method for integrations that need selection
      if (needsAuthMethodSelection(integration.type)) {
        // Default to username-password for Jenkins
        setAuthMethod('username-password')
      }
    }
  }, [existingCredentials, open, integration.type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate based on integration type and auth method
    if (integration.type === 'jenkins') {
      if (authMethod === 'username-password') {
        const trimmedUsername = username.trim()
        const trimmedPassword = password.trim()

        if (!trimmedUsername) {
          toast.error(t('integration.credentials.validation.usernameRequired'))
          return
        }

        if (!trimmedPassword) {
          toast.error(t('integration.credentials.validation.passwordRequired'))
          return
        }
      } else if (authMethod === 'token') {
        const trimmedToken = token.trim()
        const trimmedUsername = username.trim()

        if (!trimmedUsername) {
          toast.error(t('integration.credentials.validation.usernameRequired'))
          return
        }

        if (!trimmedToken) {
          toast.error(t('integration.credentials.validation.tokenRequired'))
          return
        }
      }
    } else if (integration.type === 'gitlab') {
      // GitLab only supports token
      const trimmedToken = token.trim()
      if (!trimmedToken) {
        toast.error(t('integration.credentials.validation.tokenRequired'))
        return
      }
    }

    // Build credentials object based on integration type and auth method
    const credentials: IntegrationCredentials = {
      // Token: for token-only integrations (GitLab, SonarQube) or when token method is selected
      token:
        integration.type === 'gitlab' ||
        integration.type === 'sonarqube' ||
        (showAuthMethodSelection && authMethod === 'token')
          ? token.trim() || null
          : null,
      // Username: for integrations that require username
      // - Jenkins: always needs username (with either password or token)
      // - Keycloak: always needs username
      username:
        integration.type === 'jenkins' ||
        integration.type === 'keycloak'
          ? username.trim() || null
          : null,
      // Password: when username-password method is selected or for Keycloak
      password:
        (showAuthMethodSelection && authMethod === 'username-password') ||
        integration.type === 'keycloak'
          ? password.trim() || null
          : null,
      // Custom fields: for Kubernetes (kubeconfig_path)
      custom:
        integration.type === 'kubernetes' && kubeconfigPath.trim()
          ? { kubeconfig_path: kubeconfigPath.trim() }
          : undefined,
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

  const showAuthMethodSelection = needsAuthMethodSelection(integration.type)

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
            {/* Auth method selection for integrations that support both methods */}
            {showAuthMethodSelection && (
              <div className="space-y-3">
                <Label>{t('integration.credentials.authMethod')}</Label>
                <RadioGroup
                  value={authMethod || 'username-password'}
                  onValueChange={(value) => setAuthMethod(value as 'username-password' | 'token')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="username-password" id="auth-username-password" />
                    <Label
                      htmlFor="auth-username-password"
                      className="font-normal cursor-pointer"
                    >
                      {t('integration.credentials.authMethod.usernamePassword')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="token" id="auth-token" />
                    <Label
                      htmlFor="auth-token"
                      className="font-normal cursor-pointer"
                    >
                      {t('integration.credentials.authMethod.token')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Token field - shown for token-only integrations or when token method is selected */}
            {(integration.type === 'gitlab' ||
              integration.type === 'sonarqube' ||
              (showAuthMethodSelection && authMethod === 'token')) && (
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

            {/* Username field - shown for integrations that need username */}
            {(integration.type === 'jenkins' ||
              integration.type === 'keycloak') && (
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

            {/* Kubeconfig path field - shown for Kubernetes */}
            {integration.type === 'kubernetes' && (
              <div className="space-y-2">
                <Label htmlFor="credentials-kubeconfig-path">
                  {t('integration.credentials.kubeconfigPath')}
                </Label>
                <Input
                  id="credentials-kubeconfig-path"
                  value={kubeconfigPath}
                  onChange={e => setKubeconfigPath(e.target.value)}
                  placeholder={t('integration.credentials.kubeconfigPathPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('integration.credentials.kubeconfigPathDescription')}
                </p>
              </div>
            )}

            {/* Password field - shown when username-password method is selected or for keycloak */}
            {((showAuthMethodSelection && authMethod === 'username-password') ||
              integration.type === 'keycloak') && (
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

