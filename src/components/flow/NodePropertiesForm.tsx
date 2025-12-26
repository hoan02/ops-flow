import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFlowStore } from '@/store/flow-store'
import type { FlowNode } from '@/store/flow-store'

interface NodePropertiesFormProps {
  node: FlowNode
}

export function NodePropertiesForm({ node }: NodePropertiesFormProps) {
  const { t } = useTranslation()
  const updateNode = useFlowStore(state => state.updateNode)

  const [label, setLabel] = useState(node.data.label || '')
  const [description, setDescription] = useState(
    (node.data.description as string) || ''
  )
  const [integrationId, setIntegrationId] = useState(
    (node.data.integrationId as string) || ''
  )

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

  const handleIntegrationIdChange = (value: string) => {
    setIntegrationId(value)
    updateNode(node.id, { integrationId: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {t('flow.details.properties', 'Properties')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-label">
            {t('flow.details.label', 'Label')}
          </Label>
          <Input
            id="node-label"
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder={t('flow.details.labelPlaceholder', 'Enter node label')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-description">
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
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-integration-id">
            {t('flow.details.integrationId', 'Integration ID')}
          </Label>
          <Input
            id="node-integration-id"
            value={integrationId}
            onChange={e => handleIntegrationIdChange(e.target.value)}
            placeholder={t(
              'flow.details.integrationIdPlaceholder',
              'Enter integration ID (optional)'
            )}
          />
          <p className="text-xs text-muted-foreground">
            {t(
              'flow.details.integrationIdHint',
              'Link this node to a specific integration'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

