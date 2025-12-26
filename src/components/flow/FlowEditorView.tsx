import { useState, useCallback, useRef } from 'react'
import { FlowEditor } from './FlowEditor'
import { FlowEditorToolbar } from './FlowEditorToolbar'
import { useFlowStore } from '@/store/flow-store'
import { useFlow } from '@/services/flows'
import { useEffect } from 'react'

export function FlowEditorView() {
  const currentFlowId = useFlowStore(state => state.currentFlowId)
  const { data: flow } = useFlow(currentFlowId)
  const loadFlow = useFlowStore(state => state.loadFlow)
  const setCurrentFlowId = useFlowStore(state => state.setCurrentFlowId)

  const zoomInRef = useRef<() => void>()
  const zoomOutRef = useRef<() => void>()
  const fitViewRef = useRef<() => void>()

  // Load flow data when flow is fetched
  useEffect(() => {
    if (flow && flow.nodes && flow.edges) {
      try {
        const nodes = flow.nodes as unknown as typeof loadFlow extends (nodes: infer N, edges: infer E, viewport?: infer V) => void ? N : never
        const edges = flow.edges as unknown as typeof loadFlow extends (nodes: infer N, edges: infer E, viewport?: infer V) => void ? E : never
        const viewport = flow.viewport as unknown as typeof loadFlow extends (nodes: infer N, edges: infer E, viewport?: infer V) => void ? V : never
        
        loadFlow(
          Array.isArray(nodes) ? nodes : [],
          Array.isArray(edges) ? edges : [],
          viewport || undefined
        )
      } catch (error) {
        console.error('Failed to load flow data:', error)
      }
    }
  }, [flow, loadFlow])

  const handleZoomIn = useCallback(() => {
    zoomInRef.current?.()
  }, [])

  const handleZoomOut = useCallback(() => {
    zoomOutRef.current?.()
  }, [])

  const handleFitView = useCallback(() => {
    fitViewRef.current?.()
  }, [])

  return (
    <div className="flex h-full flex-col">
      <FlowEditorToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
      />
      <div className="flex-1 overflow-hidden">
        <FlowEditor
          zoomInRef={zoomInRef}
          zoomOutRef={zoomOutRef}
          fitViewRef={fitViewRef}
        />
      </div>
    </div>
  )
}

