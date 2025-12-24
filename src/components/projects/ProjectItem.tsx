import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDevOpsStore } from '@/store/devops-store'
import type { Project } from '@/lib/tauri-bindings'

interface ProjectItemProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
}

export function ProjectItem({ project, onEdit, onDelete }: ProjectItemProps) {
  const { t } = useTranslation()
  const selectedProjectId = useDevOpsStore(state => state.selectedProjectId)

  const isSelected = selectedProjectId === project.id

  const handleClick = () => {
    const { setSelectedProjectId } = useDevOpsStore.getState()
    setSelectedProjectId(isSelected ? null : project.id)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50'
      )}
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{project.name}</div>
        {project.description && (
          <div className="text-xs text-muted-foreground truncate">
            {project.description}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <MoreVertical className="size-4" />
            <span className="sr-only">{t('common.moreOptions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={e => {
              e.stopPropagation()
              onEdit(project)
            }}
          >
            <Edit className="mr-2 size-4" />
            {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={e => {
              e.stopPropagation()
              onDelete(project.id)
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

