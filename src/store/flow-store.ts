import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Viewport,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react'

export interface FlowNodeData {
  label: string
  integrationType: string
  integrationId?: string
  [key: string]: unknown
}

export type FlowNode = Node<FlowNodeData>
export type FlowEdge = Edge

interface FlowState {
  // Flow data
  nodes: FlowNode[]
  edges: FlowEdge[]
  viewport: Viewport

  // UI state
  selectedNodeId: string | null
  pendingNodeType: string | null // Node type waiting to be added on next canvas click
  isDirty: boolean
  currentFlowId: string | null

  // Actions
  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: FlowEdge[]) => void
  setViewport: (viewport: Viewport) => void
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: FlowNode) => void
  updateNode: (nodeId: string, data: Partial<FlowNodeData>) => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void
  setSelectedNodeId: (nodeId: string | null) => void
  clearSelection: () => void
  setPendingNodeType: (nodeType: string | null) => void
  loadFlow: (nodes: FlowNode[], edges: FlowEdge[], viewport?: Viewport) => void
  resetFlow: () => void
  setCurrentFlowId: (flowId: string | null) => void
  markDirty: (dirty: boolean) => void
}

const initialViewport: Viewport = { x: 0, y: 0, zoom: 1 }

export const useFlowStore = create<FlowState>()(
  devtools(
    set => ({
      nodes: [],
      edges: [],
      viewport: initialViewport,
      selectedNodeId: null,
      pendingNodeType: null,
      isDirty: false,
      currentFlowId: null,

      setNodes: nodes =>
        set({ nodes, isDirty: true }, undefined, 'setNodes'),

      setEdges: edges =>
        set({ edges, isDirty: true }, undefined, 'setEdges'),

      setViewport: viewport =>
        set({ viewport }, undefined, 'setViewport'),

      onNodesChange: changes => {
        set(
          state => {
            // Use applyNodeChanges from React Flow to properly handle all change types
            // This ensures nodes are initialized correctly and can be dragged
            const updatedNodes = applyNodeChanges(changes, state.nodes)

            // Handle node selection state
            const selectChange = changes.find(c => c.type === 'select')
            const selectedNodeId = selectChange
              ? selectChange.selected
                ? selectChange.id
                : null
              : updatedNodes.some(n => n.selected)
                ? state.selectedNodeId
                : null

            return {
              nodes: updatedNodes,
              isDirty: true,
              selectedNodeId,
            }
          },
          undefined,
          'onNodesChange'
        )
      },

      onEdgesChange: changes => {
        set(
          state => {
            // Use applyEdgeChanges from React Flow to properly handle all change types
            const updatedEdges = applyEdgeChanges(changes, state.edges)
            return { edges: updatedEdges, isDirty: true }
          },
          undefined,
          'onEdgesChange'
        )
      },

      onConnect: connection => {
        set(
          state => {
            if (!connection.source || !connection.target) {
              return state
            }
            const newEdge: FlowEdge = {
              id: `edge-${connection.source}-${connection.target}`,
              source: connection.source,
              target: connection.target,
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
            }
            return {
              edges: [...state.edges, newEdge],
              isDirty: true,
            }
          },
          undefined,
          'onConnect'
        )
      },

      addNode: node =>
        set(
          state => ({
            nodes: [...state.nodes, node],
            isDirty: true,
          }),
          undefined,
          'addNode'
        ),

      updateNode: (nodeId, data) =>
        set(
          state => ({
            nodes: state.nodes.map(node =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, ...data } }
                : node
            ),
            isDirty: true,
          }),
          undefined,
          'updateNode'
        ),

      deleteNode: nodeId =>
        set(
          state => ({
            nodes: state.nodes.filter(n => n.id !== nodeId),
            edges: state.edges.filter(
              e => e.source !== nodeId && e.target !== nodeId
            ),
            selectedNodeId:
              state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            isDirty: true,
          }),
          undefined,
          'deleteNode'
        ),

      deleteEdge: edgeId =>
        set(
          state => ({
            edges: state.edges.filter(e => e.id !== edgeId),
            isDirty: true,
          }),
          undefined,
          'deleteEdge'
        ),

      setSelectedNodeId: nodeId =>
        set(
          state => {
            // Update node selection state
            const nodes = state.nodes.map(node => ({
              ...node,
              selected: node.id === nodeId,
            }))
            return {
              nodes,
              selectedNodeId: nodeId,
            }
          },
          undefined,
          'setSelectedNodeId'
        ),

      clearSelection: () =>
        set(
          state => ({
            nodes: state.nodes.map(node => ({ ...node, selected: false })),
            selectedNodeId: null,
          }),
          undefined,
          'clearSelection'
        ),

      setPendingNodeType: nodeType =>
        set({ pendingNodeType: nodeType }, undefined, 'setPendingNodeType'),

      loadFlow: (nodes, edges, viewport) =>
        set(
          {
            nodes,
            edges,
            viewport: viewport || initialViewport,
            selectedNodeId: null,
            isDirty: false,
          },
          undefined,
          'loadFlow'
        ),

      resetFlow: () =>
        set(
          {
            nodes: [],
            edges: [],
            viewport: initialViewport,
            selectedNodeId: null,
            isDirty: false,
            currentFlowId: null,
          },
          undefined,
          'resetFlow'
        ),

      setCurrentFlowId: flowId =>
        set({ currentFlowId: flowId }, undefined, 'setCurrentFlowId'),

      markDirty: dirty =>
        set({ isDirty: dirty }, undefined, 'markDirty'),
    }),
    {
      name: 'flow-store',
    }
  )
)

