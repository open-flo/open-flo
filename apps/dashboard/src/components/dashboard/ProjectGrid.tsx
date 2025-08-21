import React from 'react'
import { Project } from '@/lib/types'
import { ProjectCard } from './ProjectCard'
import { useProject } from '@/contexts/ProjectContext'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ProjectGrid: React.FC = () => {
  const { projects, loading, error, selectProject, refreshProjects } = useProject()

  const handleSelectProject = (project: Project) => {
    selectProject(project)
  }

  const handleRetry = () => {
    refreshProjects()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Select a Project</h1>
          <p className="text-muted-foreground mt-2">
            Choose a project to access your workspace
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Your workspace projects
          </p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">No Projects Found</h1>
          <p className="text-muted-foreground mt-2">
            You don't have access to any projects yet
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Get started</h3>
            <p className="text-muted-foreground">
              Contact your administrator to get access to a project or create a new one.
            </p>
          </div>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Request Access
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Select a Project</h1>
        <p className="text-muted-foreground mt-2">
          Choose a project to access your workspace features
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.project_id}
            project={project}
            onSelect={handleSelectProject}
          />
        ))}
      </div>
    </div>
  )
} 