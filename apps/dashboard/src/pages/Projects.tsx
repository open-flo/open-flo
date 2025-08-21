import React, { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Plus, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export const Projects = () => {
  const { projects, loading, error, refreshProjects, selectProject } = useProject()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false
  })
  const navigate = useNavigate()

  // Refresh projects when this component mounts (e.g., after login navigation)
  useEffect(() => {
    console.log("Projects component mounted, refreshing projects...")
    refreshProjects()
  }, [refreshProjects])

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      setCreateError('Project name is required')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await api.projects.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_default: formData.is_default
      })

      if (response.success) {
        await refreshProjects()
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', is_default: false })
        
        // Navigate to the new project
        if (response.project_id) {
          selectProject(projects.find(p => p.project_id === response.project_id) || null)
          navigate(`/project/${response.project_id}`)
        }
      } else {
        setCreateError(response.message || 'Failed to create project')
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectProject = (project: any) => {
    selectProject(project)
    navigate(`/project/${project.project_id}/analytics`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">

        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your workspace.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
              
              {createError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={isCreating || !formData.name.trim()}
              >
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-muted-foreground">
              Create your first project to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.project_id}
              project={project}
              onSelect={handleSelectProject}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects 