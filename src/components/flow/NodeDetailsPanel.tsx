import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFlowStore } from '@/store/flow-store'
import { NodePropertiesForm } from './NodePropertiesForm'
import { cn } from '@/lib/utils'

export function NodeDetailsPanel({ className }: { className?: string }) {
  const { t } = useTranslation()
  const selectedNodeId = useFlowStore(state => state.selectedNodeId)
  const nodes = useFlowStore(state => state.nodes)
  const edges = useFlowStore(state => state.edges)

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return nodes.find(n => n.id === selectedNodeId) || null
  }, [selectedNodeId, nodes])

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return []
    return edges.filter(
      e => e.source === selectedNodeId || e.target === selectedNodeId
    )
  }, [selectedNodeId, edges])

  if (!selectedNode) {
    return (
      <div
        className={cn(
          'flex h-full items-center justify-center p-4',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            {t('flow.details.noSelection', 'No node selected')}
          </p>
          <p className="text-xs mt-2">
            {t('flow.details.selectHint', 'Click on a node to view details')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b p-3">
        <h3 className="text-sm font-semibold">
          {t('flow.details.title', 'Node Details')}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Node Info (Read-only) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t('flow.details.info', 'Information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t('flow.details.nodeId', 'Node ID')}
                </Label>
                <p className="text-sm font-mono mt-1">{selectedNode.id}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t('flow.details.nodeType', 'Type')}
                </Label>
                <p className="text-sm mt-1 capitalize">
                  {selectedNode.type || 'default'}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t('flow.details.position', 'Position')}
                </Label>
                <p className="text-sm mt-1">
                  X: {Math.round(selectedNode.position.x)}, Y:{' '}
                  {Math.round(selectedNode.position.y)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {t('flow.details.connections', 'Connections')}
                </Label>
                <p className="text-sm mt-1">
                  {connectedEdges.length}{' '}
                  {connectedEdges.length === 1
                    ? t('flow.details.connection', 'connection')
                    : t('flow.details.connections', 'connections')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Node Properties (Editable) */}
          <NodePropertiesForm node={selectedNode} />
        </div>
      </ScrollArea>
    </div>
  )
}

