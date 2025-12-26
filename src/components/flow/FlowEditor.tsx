import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type Viewport,
} from '@xyflow/react'
import { NodeSearch } from '@/components/ui/xyflow/node-search'
import { nodeTypes } from './node-types'
import { useFlowStore } from '@/store/flow-store'
import type { FlowNode } from '@/store/flow-store'
import type { IntegrationType } from '@/lib/tauri-bindings'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { MousePointerClick, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FlowEditorProps {
  className?: string
  zoomInRef?: React.MutableRefObject<(() => void) | undefined>
  zoomOutRef?: React.MutableRefObject<(() => void) | undefined>
  fitViewRef?: React.MutableRefObject<(() => void) | undefined>
}

function FlowEditorInner({
  className,
  zoomInRef,
  zoomOutRef,
  fitViewRef,
}: FlowEditorProps) {
  const { t } = useTranslation()
  const {
    nodes,
    edges,
    viewport,
    pendingNodeType,
    onNodesChange: storeOnNodesChange,
    onEdgesChange: storeOnEdgesChange,
    onConnect: storeOnConnect,
    setViewport: storeSetViewport,
    setSelectedNodeId,
    clearSelection,
    setPendingNodeType,
  } = useFlowStore()

  const {
    screenToFlowPosition,
    setViewport: reactFlowSetViewport,
    zoomIn: reactFlowZoomIn,
    zoomOut: reactFlowZoomOut,
    fitView: reactFlowFitView,
  } = useReactFlow()

  // Expose zoom functions via refs to parent
  useEffect(() => {
    const zoomInFn = () => reactFlowZoomIn()
    const zoomOutFn = () => reactFlowZoomOut()
    const fitViewFn = () => reactFlowFitView({ padding: 0.2 })
    
    if (zoomInRef) {
      zoomInRef.current = zoomInFn
    }
    if (zoomOutRef) {
      zoomOutRef.current = zoomOutFn
    }
    if (fitViewRef) {
      fitViewRef.current = fitViewFn
    }
  }, [reactFlowZoomIn, reactFlowZoomOut, reactFlowFitView, zoomInRef, zoomOutRef, fitViewRef])

  // Sync viewport from store to React Flow
  useEffect(() => {
    reactFlowSetViewport(viewport)
  }, [viewport, reactFlowSetViewport])

  // Handle ESC key to cancel pending node
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && pendingNodeType) {
        setPendingNodeType(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pendingNodeType, setPendingNodeType])

  // Change cursor when pending node
  useEffect(() => {
    const wrapper = document.querySelector('.reactflow-wrapper')
    if (wrapper instanceof HTMLElement) {
      if (pendingNodeType) {
        wrapper.style.cursor = 'crosshair'
      } else {
        wrapper.style.cursor = ''
      }
    }
  }, [pendingNodeType])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      storeOnNodesChange(changes)

      // Handle node selection
      const selectChange = changes.find(c => c.type === 'select')
      if (selectChange) {
        if (selectChange.selected) {
          setSelectedNodeId(selectChange.id)
        } else {
          clearSelection()
        }
      }
    },
    [storeOnNodesChange, setSelectedNodeId, clearSelection]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      storeOnEdgesChange(changes)
    },
    [storeOnEdgesChange]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      storeOnConnect(connection)
    },
    [storeOnConnect]
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      setSelectedNodeId(node.id)
    },
    [setSelectedNodeId]
  )

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      clearSelection()
      
      // Check if we have a pending node to add (from click on palette)
      if (pendingNodeType && ['gitlab', 'jenkins', 'kubernetes', 'sonarqube', 'keycloak'].includes(pendingNodeType)) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })

        const newNode: FlowNode = {
          id: `${pendingNodeType}-${Date.now()}`,
          type: pendingNodeType as IntegrationType,
          position,
          data: {
            label: pendingNodeType.charAt(0).toUpperCase() + pendingNodeType.slice(1),
            integrationType: pendingNodeType,
          },
        }

        // Use onNodesChange to add node properly - React Flow needs this to initialize the node
        storeOnNodesChange([
          {
            type: 'add',
            item: newNode,
          },
        ])
        
        // Clear pending
        setPendingNodeType(null)
      }
    },
    [clearSelection, screenToFlowPosition, storeOnNodesChange, pendingNodeType, setPendingNodeType]
  )

  const onMove = useCallback(
    (_event: unknown, viewport: Viewport) => {
      storeSetViewport(viewport)
    },
    [storeSetViewport]
  )

  const getNodeTypeLabel = (nodeType: string) => {
    return nodeType.charAt(0).toUpperCase() + nodeType.slice(1)
  }

  return (
    <div
      className={cn('h-full w-full relative reactflow-wrapper', className)}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMove={onMove}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={viewport}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        nodesDraggable={true}
        nodesConnectable={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={node => {
            switch (node.type) {
              case 'gitlab':
                return '#f97316'
              case 'jenkins':
                return '#3b82f6'
              case 'kubernetes':
                return '#06b6d4'
              case 'sonarqube':
                return '#eab308'
              case 'keycloak':
                return '#a855f7'
              default:
                return '#64748b'
            }
          }}
          className="bg-background border"
        />
        <Panel position="top-center" className="mt-2">
          <NodeSearch
            onSelectNode={node => {
              setSelectedNodeId(node.id)
            }}
          />
        </Panel>
        {pendingNodeType && (
          <Panel position="top-center" className="mt-16">
            <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <MousePointerClick className="size-4" />
              <span className="text-sm font-medium">
                {t('flow.editor.clickToAdd', 'Click on canvas to add {{nodeType}} node', {
                  nodeType: getNodeTypeLabel(pendingNodeType),
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
                onClick={() => setPendingNodeType(null)}
                title={t('flow.editor.cancel', 'Cancel (ESC)')}
              >
                <X className="size-3" />
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}

export function FlowEditor({
  className,
  zoomInRef,
  zoomOutRef,
  fitViewRef,
}: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner
        className={className}
        zoomInRef={zoomInRef}
        zoomOutRef={zoomOutRef}
        fitViewRef={fitViewRef}
      />
    </ReactFlowProvider>
  )
}
