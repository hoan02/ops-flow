import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ProjectList } from '@/components/projects'
import { EnvironmentList } from '@/components/environments'
import { IntegrationList } from '@/components/integrations'

interface LeftSideBarProps {
  children?: React.ReactNode
  className?: string
}

export function LeftSideBar({ children, className }: LeftSideBarProps) {
  return (
    <div
      className={cn('flex h-full flex-col border-r bg-background', className)}
    >
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 space-y-4">
          <ProjectList />
          <Separator />
          <EnvironmentList />
          <Separator />
          <IntegrationList />
        </div>
      </ScrollArea>
      {children}
    </div>
  )
}
