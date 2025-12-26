import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ProjectList } from '@/components/projects'
import { EnvironmentList } from '@/components/environments'
import { IntegrationList } from '@/components/integrations'
import { NodePalette } from '@/components/flow/NodePalette'
import { useUIStore } from '@/store/ui-store'
import { useCallback } from 'react'
import type { IntegrationType } from '@/lib/tauri-bindings'

interface LeftSideBarProps {
  children?: React.ReactNode
  className?: string
}

export function LeftSideBar({ children, className }: LeftSideBarProps) {
  const flowEditorMode = useUIStore(state => state.flowEditorMode)

  const handleNodeClick = useCallback((_nodeType: IntegrationType) => {
    // NodePalette now handles pending node state internally via store
    // This callback is kept for potential future use
  }, [])

  return (
    <div
      className={cn('flex h-full flex-col border-r bg-background', className)}
    >
      {flowEditorMode ? (
        <NodePalette onNodeClick={handleNodeClick} />
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-2 space-y-4">
            <ProjectList />
            <Separator />
            <EnvironmentList />
            <Separator />
            <IntegrationList />
          </div>
        </ScrollArea>
      )}
      {children}
    </div>
  )
}
