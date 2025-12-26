import { useState, useCallback } from 'react'
import { ReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Simple test component to verify drag and drop works
export function DragDropTest() {
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    console.log('Test - DragOver triggered')
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    console.log('Test - Drop triggered!')
    
    const nodeType = e.dataTransfer.getData('application/reactflow')
    console.log('Test - nodeType:', nodeType)

    if (!nodeType) {
      console.log('Test - No node type found')
      return
    }

    const position = {
      x: e.clientX - 100,
      y: e.clientY - 100,
    }

    const newNode = {
      id: `${nodeType}-${Date.now()}`,
      type: 'default',
      position,
      data: { label: nodeType },
    }

    console.log('Test - Adding node:', newNode)
    setNodes(nds => [...nds, newNode])
  }, [])

  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r p-4">
        <h2 className="font-bold mb-4">Drag Nodes</h2>
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', 'test-node')
            e.dataTransfer.effectAllowed = 'move'
            console.log('Test - DragStart')
          }}
          className="p-4 bg-blue-500 text-white rounded cursor-grab active:cursor-grabbing"
        >
          Test Node
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

export function DragDropTestWrapper() {
  return (
    <ReactFlowProvider>
      <DragDropTest />
    </ReactFlowProvider>
  )
}

