import React from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { FlowEditorView } from '@/components/flow/FlowEditorView'
import { DragDropTestWrapper } from '@/components/flow/DragDropTest'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  const lastQuickPaneEntry = useUIStore(state => state.lastQuickPaneEntry)
  const flowEditorMode = useUIStore(state => state.flowEditorMode)
  const [showTest, setShowTest] = React.useState(false)

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {showTest ? (
        <DragDropTestWrapper />
      ) : flowEditorMode ? (
        <FlowEditorView />
      ) : (
        children || (
          <div className="flex flex-1 flex-col items-center justify-center">
            <h1 className="text-4xl font-bold text-foreground">
              {lastQuickPaneEntry
                ? `Last entry: ${lastQuickPaneEntry}`
                : 'Hello World'}
            </h1>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  const { setFlowEditorMode } = useUIStore.getState()
                  setFlowEditorMode(true)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Open Flow Editor
              </button>
              <button
                onClick={() => setShowTest(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
              >
                Test Drag & Drop
              </button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
