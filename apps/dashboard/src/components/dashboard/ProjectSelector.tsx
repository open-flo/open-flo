import React from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Folder, ChevronDown, MoreHorizontal, Loader2 } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'

export const ProjectSelector: React.FC = () => {
  const { selectedProject, projects, loading, selectProject } = useProject()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (loading) {
    return (
      <div className="px-2 py-2">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {!isCollapsed && <span className="text-sm">Loading projects...</span>}
        </div>
      </div>
    )
  }

  if (!selectedProject && projects.length === 0) {
    return (
      <div className="px-2 py-2">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Folder className="h-4 w-4" />
          {!isCollapsed && <span className="text-sm">No projects</span>}
        </div>
      </div>
    )
  }

  if (!selectedProject) {
    return (
      <div className="px-2 py-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => selectProject(null)}
          className="w-full justify-start"
        >
          <Folder className="h-4 w-4 mr-2" />
          {!isCollapsed && "Select Project"}
        </Button>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Folder className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Current Project</DropdownMenuLabel>
          <DropdownMenuItem disabled>
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <div className="font-medium truncate">{selectedProject.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {selectedProject.description || 'No description'}
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.project_id}
              onClick={() => selectProject(project)}
              className={project.project_id === selectedProject.project_id ? 'bg-accent' : ''}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col space-y-1 min-w-0 flex-1">
                  <div className="font-medium truncate">{project.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {project.description || 'No description'}
                  </div>
                </div>
                {project.is_default && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    Default
                  </Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => selectProject(null)}>
            View All Projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="px-2 py-2 space-y-2">
      {/* Current Project Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <Folder className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{selectedProject.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {selectedProject.description || 'No description'}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => selectProject(null)}>
              View All Projects
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project Badges */}
      <div className="flex flex-wrap gap-1">
        {selectedProject.is_default && (
          <Badge variant="secondary" className="text-xs">
            Default
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {selectedProject.status}
        </Badge>
      </div>

      {/* Quick Project Switcher */}
      {projects.length > 1 && (
        <Select
          value={selectedProject.project_id}
          onValueChange={(projectId) => {
            const project = projects.find(p => p.project_id === projectId)
            if (project) selectProject(project)
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Switch project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.project_id} value={project.project_id}>
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{project.name}</span>
                  {project.is_default && (
                    <Badge variant="secondary" className="text-xs ml-2">
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
} 