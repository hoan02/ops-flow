import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Save,
  FolderOpen,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFlowStore } from '@/store/flow-store'
import { useFlows, useSaveFlow, useDeleteFlow } from '@/services/flows'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

interface FlowEditorToolbarProps {
  className?: string
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
}

export function FlowEditorToolbar({
  className,
  onZoomIn,
  onZoomOut,
  onFitView,
}: FlowEditorToolbarProps) {
  const { t } = useTranslation()
  const { nodes, edges, resetFlow, currentFlowId, setCurrentFlowId, markDirty } =
    useFlowStore()
  const { data: flows } = useFlows()
  const saveFlow = useSaveFlow()
  const deleteFlow = useDeleteFlow()
  const setFlowEditorMode = useUIStore(state => state.setFlowEditorMode)

  const handleBack = () => {
    setFlowEditorMode(false)
  }

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [flowName, setFlowName] = useState('')
  const [selectedFlowId, setSelectedFlowId] = useState<string>('')

  const handleNew = () => {
    if (confirm(t('flow.toolbar.confirmNew', 'Create a new flow? Unsaved changes will be lost.'))) {
      resetFlow()
      setFlowName('')
    }
  }

  const handleSave = () => {
    if (currentFlowId) {
      // Save existing flow
      saveFlow.mutate({
        flowId: currentFlowId,
        name: flowName || `Flow ${Date.now()}`,
        nodes,
        edges,
      })
      markDirty(false)
    } else {
      // Open save dialog for new flow
      setFlowName(`Flow ${new Date().toLocaleDateString()}`)
      setSaveDialogOpen(true)
    }
  }

  const handleSaveConfirm = () => {
    const flowId = currentFlowId || `flow-${Date.now()}`
    saveFlow.mutate(
      {
        flowId,
        name: flowName,
        nodes,
        edges,
      },
      {
        onSuccess: () => {
          setCurrentFlowId(flowId)
          setSaveDialogOpen(false)
          markDirty(false)
        },
      }
    )
  }

  const handleLoad = () => {
    setLoadDialogOpen(true)
  }

  const handleLoadConfirm = () => {
    if (!selectedFlowId) return

    // Load flow logic will be handled by parent component
    // This is just for UI - actual loading happens via useFlow hook
    setLoadDialogOpen(false)
  }

  const handleDelete = () => {
    if (!currentFlowId) return
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!currentFlowId) return

    deleteFlow.mutate(currentFlowId, {
      onSuccess: () => {
        resetFlow()
        setDeleteDialogOpen(false)
      },
    })
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 border-b bg-background p-2',
          className
        )}
      >
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 size-4" />
          {t('flow.toolbar.back', 'Back')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleNew}>
          <Plus className="mr-2 size-4" />
          {t('flow.toolbar.new', 'New')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saveFlow.isPending}
        >
          <Save className="mr-2 size-4" />
          {t('flow.toolbar.save', 'Save')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleLoad}>
          <FolderOpen className="mr-2 size-4" />
          {t('flow.toolbar.load', 'Load')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={!currentFlowId}
        >
          <Trash2 className="mr-2 size-4" />
          {t('flow.toolbar.delete', 'Delete')}
        </Button>

        <div className="flex-1" />

        <Button variant="ghost" size="icon-sm" onClick={onZoomIn}>
          <ZoomIn className="size-4" />
          <span className="sr-only">{t('flow.toolbar.zoomIn', 'Zoom in')}</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onZoomOut}>
          <ZoomOut className="size-4" />
          <span className="sr-only">{t('flow.toolbar.zoomOut', 'Zoom out')}</span>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onFitView}>
          <Maximize2 className="size-4" />
          <span className="sr-only">{t('flow.toolbar.fitView', 'Fit view')}</span>
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('flow.toolbar.saveFlow', 'Save Flow')}</DialogTitle>
            <DialogDescription>
              {t('flow.toolbar.saveFlowDescription', 'Enter a name for this flow')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="flow-name">{t('flow.toolbar.flowName', 'Flow Name')}</Label>
            <Input
              id="flow-name"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              placeholder={t('flow.toolbar.flowNamePlaceholder', 'My Flow')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSaveConfirm} disabled={!flowName.trim()}>
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('flow.toolbar.loadFlow', 'Load Flow')}</DialogTitle>
            <DialogDescription>
              {t('flow.toolbar.loadFlowDescription', 'Select a flow to load')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="flow-select">{t('flow.toolbar.selectFlow', 'Flow')}</Label>
            <Select value={selectedFlowId} onValueChange={setSelectedFlowId}>
              <SelectTrigger id="flow-select">
                <SelectValue placeholder={t('flow.toolbar.selectFlowPlaceholder', 'Select a flow')} />
              </SelectTrigger>
              <SelectContent>
                {flows?.map(flow => (
                  <SelectItem key={flow.id} value={flow.id}>
                    {flow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleLoadConfirm} disabled={!selectedFlowId}>
              {t('common.load', 'Load')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('flow.toolbar.deleteFlow', 'Delete Flow')}</DialogTitle>
            <DialogDescription>
              {t('flow.toolbar.deleteFlowDescription', 'Are you sure you want to delete this flow? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteFlow.isPending}
            >
              {t('common.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

