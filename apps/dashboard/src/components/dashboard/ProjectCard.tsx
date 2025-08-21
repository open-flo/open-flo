import React from 'react'
import { Project } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Folder } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ProjectCardProps {
  project: Project
  onSelect: (project: Project) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  const navigate = useNavigate()
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

 

  const handleSelectProject = () => {
    onSelect(project)
    navigate(`/project/${project.project_id}/analytics`)
  }

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 group"
      onClick={handleSelectProject}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                {project.name}
              </CardTitle>
              
            </div>
          </div>

        </div>
        
        {project.description && (
          <CardDescription className="text-sm text-muted-foreground mt-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Project Stats */}
         

          {/* Creation Date */}
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {formatDate(project.created_at)}</span>
          </div>

          {/* Access Badge */}
          {project.settings.allow_public_access && (
            <Badge variant="outline" className="text-xs">
              Public Access Enabled
            </Badge>
          )}


        </div>
      </CardContent>
    </Card>
  )
} 