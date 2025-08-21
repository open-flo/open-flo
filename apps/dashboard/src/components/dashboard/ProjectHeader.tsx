import React, { useState } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Folder, Settings, ChevronDown, MoreHorizontal, Check, Plus, Code, Copy } from 'lucide-react'

export const ProjectHeader: React.FC = () => {
  const { selectedProject, projects, selectProject } = useProject()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)

  // Check if we're on the projects page or user management page
  const isOnProjectsPage = (location.pathname === '/projects' || location.pathname ===  '/')
  const isOnUserManagementPage = location.pathname === '/settings/users'

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.project_id === projectId)
    if (project) {
      selectProject(project)
      navigate(`/project/${project.project_id}`)
    }
  }

  const handleViewAllProjects = () => {
    selectProject(null)
    navigate('/projects')
  }

  const handleProjectSettings = () => {
    if (selectedProject) {
      navigate(`/project/${selectedProject.project_id}/settings`)
    }
  }

  const handleManageProjects = () => {
    navigate('/projects')
  }

  const handleViewCode = () => {
    setIsCodeDialogOpen(true)
  }

  const handleCopyCode = async () => {
    const codeSnippet = `<script src="https://cdn.flowvana.tech/prod-dist/flowlight.umd.js"></script>
<script src="https://cdn.flowvana.tech/proj_MKruFoGxBzqTvYB8ZO0_uQ/flowlight-bootstrapper.configured.js"></script>`
    
    try {
      await navigator.clipboard.writeText(codeSnippet)
      toast({
        title: "Copied to clipboard",
        description: "Code snippet copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  // If on projects page or user management page, show simple header without dropdown
  if (isOnProjectsPage || isOnUserManagementPage) {
    return null
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center space-x-2">
        <Folder className="h-5 w-5 text-muted-foreground" />
        <span className="text-lg font-semibold">Flowvana Dashboard</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Project Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Folder className="h-4 w-4" />
            <span className="font-medium">{selectedProject.name}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            PROJECTS
          </DropdownMenuLabel>
          
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.project_id}
              onClick={() => handleProjectChange(project.project_id)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                {project.project_id === selectedProject.project_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
                <span className={project.project_id === selectedProject.project_id ? "font-medium" : ""}>
                  {project.name}
                </span>
              </div>
             
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleManageProjects}>
            <Plus className="h-4 w-4 mr-2" />
            Create project
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleManageProjects}>
            <Settings className="h-4 w-4 mr-2" />
            Manage projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Code Button */}
      <Button variant="outline" size="sm" onClick={handleViewCode}>
        <Code className="h-4 w-4 mr-2" />
        View Code
      </Button>

      {/* Code Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Integration Code</DialogTitle>
            <DialogDescription>
              Copy and paste this code into your web app to integrate Flowvana.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap break-all">
              <code className="block">{`<script src="https://cdn.flowvana.tech/prod-dist/flowlight.umd.js"></script>
<script src="https://cdn.flowvana.tech/proj_MKruFoGxBzqTvYB8ZO0_uQ/flowlight-bootstrapper.configured.js"></script>`}</code>
            </pre>
            
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopyCode}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 