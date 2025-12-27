import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFlowStore } from '@/store/flow-store'
import { useIntegrations } from '@/services/integrations'
import {
  useGitLabNodeData,
  useJenkinsNodeData,
  useKubernetesNodeData,
  useSonarQubeNodeData,
  useKeycloakNodeData,
} from '@/services/flow-node-data'
import type { FlowNode } from '@/store/flow-store'
import type { IntegrationType } from '@/lib/tauri-bindings'

interface NodePropertiesFormProps {
  node: FlowNode
}

export function NodePropertiesForm({ node }: NodePropertiesFormProps) {
  const { t } = useTranslation()
  const updateNode = useFlowStore(state => state.updateNode)
  const { data: integrations } = useIntegrations()

  const nodeType = node.type as IntegrationType | undefined
  const [label, setLabel] = useState(node.data.label || '')
  const [description, setDescription] = useState(
    (node.data.description as string) || ''
  )
  const [integrationId, setIntegrationId] = useState(
    (node.data.integrationId as string) || ''
  )

  // Get available integrations for this node type
  const availableIntegrations = useMemo(() => {
    if (!nodeType || !integrations) return []
    return integrations.filter(i => i.type === nodeType)
  }, [nodeType, integrations])

  // Fetch data based on integration and node type
  const gitlabData = useGitLabNodeData(
    nodeType === 'gitlab' && integrationId ? integrationId : null
  )
  const jenkinsData = useJenkinsNodeData(
    nodeType === 'jenkins' && integrationId ? integrationId : null
  )
  const kubernetesData = useKubernetesNodeData(
    nodeType === 'kubernetes' && integrationId ? integrationId : null
  )
  const sonarqubeData = useSonarQubeNodeData(
    nodeType === 'sonarqube' && integrationId ? integrationId : null
  )
  const keycloakData = useKeycloakNodeData(
    nodeType === 'keycloak' && integrationId ? integrationId : null
  )

  // Get current data based on node type
  const currentData = useMemo(() => {
    let data: unknown[] = []
    switch (nodeType) {
      case 'gitlab':
        data = gitlabData.data || []
        break
      case 'jenkins':
        data = jenkinsData.data || []
        console.log('Jenkins data in form:', {
          data,
          isLoading: jenkinsData.isLoading,
          isError: jenkinsData.isError,
          error: jenkinsData.error,
        })
        break
      case 'kubernetes':
        data = kubernetesData.data || []
        break
      case 'sonarqube':
        data = sonarqubeData.data || []
        break
      case 'keycloak':
        data = keycloakData.data || []
        break
      default:
        data = []
    }
    return data
  }, [nodeType, gitlabData.data, jenkinsData.data, jenkinsData.isLoading, jenkinsData.isError, jenkinsData.error, kubernetesData.data, sonarqubeData.data, keycloakData.data])

  // Get selected item value based on node type
  const selectedItemValue = useMemo(() => {
    switch (nodeType) {
      case 'gitlab':
        return (node.data.selectedProjectId as number | undefined)?.toString() || ''
      case 'jenkins':
        return (node.data.selectedJobName as string) || ''
      case 'kubernetes':
        return (node.data.selectedNamespace as string) || ''
      case 'sonarqube':
        return (node.data.selectedProjectKey as string) || ''
      case 'keycloak':
        return (node.data.selectedRealm as string) || ''
      default:
        return ''
    }
  }, [nodeType, node.data])

  // Update local state when node changes
  useEffect(() => {
    setLabel(node.data.label || '')
    setDescription((node.data.description as string) || '')
    setIntegrationId((node.data.integrationId as string) || '')
  }, [node.id, node.data])

  const handleLabelChange = (value: string) => {
    setLabel(value)
    updateNode(node.id, { label: value })
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    updateNode(node.id, { description: value })
  }

  const handleIntegrationChange = (value: string) => {
    setIntegrationId(value)
    // Clear selected item when integration changes
    const updates: Record<string, unknown> = { integrationId: value }
    switch (nodeType) {
      case 'gitlab':
        updates.selectedProjectId = undefined
        break
      case 'jenkins':
        updates.selectedJobName = undefined
        break
      case 'kubernetes':
        updates.selectedNamespace = undefined
        break
      case 'sonarqube':
        updates.selectedProjectKey = undefined
        break
      case 'keycloak':
        updates.selectedRealm = undefined
        break
    }
    updateNode(node.id, updates)
  }

  const handleItemChange = (value: string) => {
    const updates: Record<string, unknown> = {}
    switch (nodeType) {
      case 'gitlab':
        updates.selectedProjectId = value ? Number(value) : undefined
        break
      case 'jenkins':
        updates.selectedJobName = value || undefined
        break
      case 'kubernetes':
        updates.selectedNamespace = value || undefined
        break
      case 'sonarqube':
        updates.selectedProjectKey = value || undefined
        break
      case 'keycloak':
        updates.selectedRealm = value || undefined
        break
    }
    updateNode(node.id, updates)
  }

  return (
    <Card>
      <CardHeader className="px-3 pt-3 pb-2">
        <CardTitle className="text-sm">
          {t('flow.details.properties', 'Properties')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="node-label" className="text-xs">
            {t('flow.details.label', 'Label')}
          </Label>
          <Input
            id="node-label"
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder={t('flow.details.labelPlaceholder', 'Enter node label')}
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="node-description" className="text-xs">
            {t('flow.details.description', 'Description')}
          </Label>
          <Textarea
            id="node-description"
            value={description}
            onChange={e => handleDescriptionChange(e.target.value)}
            placeholder={t(
              'flow.details.descriptionPlaceholder',
              'Enter node description'
            )}
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="node-integration" className="text-xs">
            {t('flow.details.integration', 'Integration')}
          </Label>
          <Select value={integrationId} onValueChange={handleIntegrationChange}>
            <SelectTrigger id="node-integration" className="w-full h-8 text-sm">
              <SelectValue
                placeholder={t(
                  'flow.details.integrationPlaceholder',
                  'Select integration'
                )}
              />
            </SelectTrigger>
            <SelectContent>
              {availableIntegrations.length === 0 ? (
                <SelectItem value="" disabled>
                  {t('flow.details.noIntegrations', 'No integrations available')}
                </SelectItem>
              ) : (
                availableIntegrations.map(integration => (
                  <SelectItem key={integration.id} value={integration.id}>
                    {integration.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Item Selection based on node type */}
        {integrationId && nodeType && nodeType === 'jenkins' && !jenkinsData.isLoading && !jenkinsData.isError && currentData.length > 0 && (
          <div className="space-y-1.5">
            {(() => {
              const jobs = currentData as { name: string; color: string }[]
              const folders = jobs.filter(j => j.color === 'folder' || (j.color === 'notbuilt' && !j.name.includes('/')))
              const actualJobs = jobs.filter(j => !folders.find(f => f.name === j.name))
              
              if (actualJobs.length === 0 && folders.length > 0) {
                return (
                  <div className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                    Only folders found. Backend needs to fetch jobs from inside folders to select specific jobs.
                  </div>
                )
              }
              
              return null
            })()}
          </div>
        )}
        {integrationId && nodeType && currentData.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="node-item" className="text-xs">
              {nodeType === 'gitlab' && t('flow.details.project', 'Project')}
              {nodeType === 'jenkins' && t('flow.details.job', 'Job')}
              {nodeType === 'kubernetes' &&
                t('flow.details.namespace', 'Namespace')}
              {nodeType === 'sonarqube' && t('flow.details.project', 'Project')}
              {nodeType === 'keycloak' && t('flow.details.realm', 'Realm')}
            </Label>
            <Select value={selectedItemValue} onValueChange={handleItemChange}>
              <SelectTrigger id="node-item" className="w-full h-8 text-sm">
                <SelectValue
                  placeholder={t(
                    'flow.details.selectItem',
                    'Select an item'
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {nodeType === 'gitlab' &&
                  (currentData as { id: number; name: string; path: string }[]).map(
                    project => (
                      <SelectItem
                        key={project.id}
                        value={project.id.toString()}
                      >
                        {project.name} ({project.path})
                      </SelectItem>
                    )
                  )}
                {nodeType === 'jenkins' &&
                  (() => {
                    const jobs = currentData as { name: string; color: string }[]
                    const folders = jobs.filter(j => j.color === 'folder' || (j.color === 'notbuilt' && !j.name.includes('/')))
                    const actualJobs = jobs.filter(j => !folders.find(f => f.name === j.name))
                    
                    // If we only have folders and no actual jobs, show folders but indicate they need backend support
                    if (actualJobs.length === 0 && folders.length > 0) {
                      return (
                        <>
                          {folders.map(folder => (
                            <SelectItem key={folder.name} value={folder.name} disabled>
                              {folder.name} (Folder - jobs inside not available)
                            </SelectItem>
                          ))}
                        </>
                      )
                    }
                    
                    // Show actual jobs, exclude folders
                    return actualJobs.map(job => (
                      <SelectItem key={job.name} value={job.name}>
                        {job.name} ({job.color})
                      </SelectItem>
                    ))
                  })()}
                {nodeType === 'kubernetes' &&
                  (currentData as { name: string; status: string }[]).map(
                    namespace => (
                      <SelectItem key={namespace.name} value={namespace.name}>
                        {namespace.name} ({namespace.status})
                      </SelectItem>
                    )
                  )}
                {nodeType === 'sonarqube' &&
                  (currentData as { key: string; name: string }[]).map(
                    project => (
                      <SelectItem key={project.key} value={project.key}>
                        {project.name} ({project.key})
                      </SelectItem>
                    )
                  )}
                {nodeType === 'keycloak' &&
                  (currentData as { realm: string; enabled: boolean }[]).map(
                    realm => (
                      <SelectItem key={realm.realm} value={realm.realm}>
                        {realm.realm} {realm.enabled ? '(Enabled)' : '(Disabled)'}
                      </SelectItem>
                    )
                  )}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

