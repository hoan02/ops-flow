import { cn } from '@/lib/utils'
import { NodeDetailsPanel } from '@/components/flow/NodeDetailsPanel'
import { useUIStore } from '@/store/ui-store'

interface RightSideBarProps {
  children?: React.ReactNode
  className?: string
}

export function RightSideBar({ children, className }: RightSideBarProps) {
  const flowEditorMode = useUIStore(state => state.flowEditorMode)

  return (
    <div
      className={cn('flex h-full flex-col border-l bg-background', className)}
    >
      {flowEditorMode ? <NodeDetailsPanel /> : children}
    </div>
  )
}
